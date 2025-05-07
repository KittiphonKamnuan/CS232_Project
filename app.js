// app.js - แก้ไขการ import ให้เข้ากับ openid-client เวอร์ชัน 6.4.2

import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as openid from 'openid-client';
import { Issuer } from 'openid-client';

// สำหรับ ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = 8080;

// กำหนดค่า AWS Region และ User Pool ID
const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_FhgCeg2YB';
const CLIENT_ID = '5eeajv1i9r7e64qv0gd7h1u0bi'; // หรือ client ID ที่คุณใช้จริง

// รองรับ URL-encoded bodies สำหรับการส่งฟอร์ม
app.use(express.urlencoded({ extended: true }));
app.use(express.json());  // เพิ่มการรองรับ JSON

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname))); 

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'some_secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 วัน
  }
}));

let cognitoClient;

async function initializeCognitoClient() {
    try {
      const discoveryUrl = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/openid-configuration`;
  
      const issuer = await Issuer.discover(discoveryUrl);
  
      cognitoClient = new issuer.Client({
        client_id: CLIENT_ID,
        redirect_uris: ['http://localhost:8080/callback'],
        response_types: ['code']
      });
  
      console.log('✅ Cognito client initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Cognito client:', error);
    }
  }
  
  initializeCognitoClient();

// Auth check middleware
const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.userinfo) {
    req.isAuthenticated = false;
  } else {
    req.isAuthenticated = true;
  }
  next();
};

// Routes
app.get('/', checkAuth, (req, res) => {
  console.log('Serving index.html, authenticated:', req.isAuthenticated);
  
  // ถ้ายังไม่ได้ล็อกอิน ให้ redirect ไปหน้า login
  if (!req.isAuthenticated) {
    return res.redirect('/login');
  }
  
  // ถ้าล็อกอินแล้ว ให้แสดงหน้า index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route สำหรับหน้า login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// เพิ่ม route สำหรับล็อกอินผ่าน Cognito
app.get('/login-cognito', (req, res) => {
  if (!cognitoClient) {
    return res.redirect('/login?error=' + encodeURIComponent('Cognito client not initialized'));
  }

  // สร้าง nonce และ state สำหรับความปลอดภัย
  const nonce = openid.generators.nonce();
  const state = openid.generators.state();

  // เก็บค่าใน session
  req.session.nonce = nonce;
  req.session.state = state;

  // สร้าง URL สำหรับการล็อกอิน
  const authUrl = cognitoClient.authorizationUrl({
    scope: 'openid',  // ใช้แค่ openid เพื่อเป็นการทดสอบก่อน
    state: state,
    nonce: nonce,
  });

  // redirect ไปยัง Cognito hosted UI
  res.redirect(authUrl);
});

// Route สำหรับรับข้อมูลหลังจากล็อกอินผ่าน Cognito
app.get('/callback', async (req, res) => {
    try {
      if (!cognitoClient) {
        return res.redirect('/login?error=' + encodeURIComponent('Cognito client not initialized'));
      }
  
      // รับ parameters จาก URL
      const params = cognitoClient.callbackParams(req);
      
      // แลกเปลี่ยน code เพื่อรับ token
      const tokenSet = await cognitoClient.callback(
        'http://localhost:8080/callback',
        params,
        {
          nonce: req.session.nonce,
          state: req.session.state
        }
      );
  
      // รับข้อมูลผู้ใช้จาก token
      const userinfo = await cognitoClient.userinfo(tokenSet.access_token);
      
      // เก็บข้อมูลผู้ใช้ใน session
      req.session.userinfo = userinfo;
      req.session.access_token = tokenSet.access_token;
      req.session.refresh_token = tokenSet.refresh_token;
      
      // บันทึก session
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect('/login?error=' + encodeURIComponent('ไม่สามารถบันทึก session ได้'));
        }
        
        // redirect ไปยังหน้าแรก
        res.redirect('/');
      });
    } catch (error) {
      console.error('Error in callback:', error);
      res.redirect('/login?error=' + encodeURIComponent('การล็อกอินล้มเหลว: ' + error.message));
    }
  });

  app.post('/api/verify-token', express.json(), async (req, res) => {
    // รับข้อมูลจากฟอร์ม
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // ส่งคำตอบว่าได้รับข้อมูลแล้ว
    res.json({ success: true, message: 'Login data received' });
  });
  
  // เพิ่ม API endpoint สำหรับตรวจสอบ token (ใช้กับ client-side authentication)
  app.post('/api/verify-token', express.json(), async (req, res) => {
    const { token, user } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    try {
      // สร้าง session จาก token
      req.session.userinfo = user;
      req.session.access_token = token;
      
      // บันทึก session
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ error: 'ไม่สามารถบันทึก session ได้' });
        }
        
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });
  
  // Local login (fallback)
  app.post('/login-simple', (req, res) => {
    const { username, password } = req.body;
    
    // ตรวจสอบแบบง่ายๆ (ใช้เฉพาะในการพัฒนาเท่านั้น)
    if (username === 'admin' && password === 'password') {
      // สร้าง session และเก็บข้อมูลผู้ใช้
      req.session.userinfo = {
        sub: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      // บันทึก session
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect('/login?error=' + encodeURIComponent('ไม่สามารถบันทึก session ได้'));
        }
        
        res.redirect('/');
      });
    } else {
      res.redirect('/login?error=invalid_credentials');
    }
  });
  
  // Route สำหรับออกจากระบบ
  app.get('/logout', (req, res) => {
    const isUsingCognito = req.session && req.session.access_token;
    
    // ลบ session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      
      // ถ้าใช้ Cognito ให้ redirect ไปที่หน้า logout ของ Cognito
      if (isUsingCognito && cognitoClient) {
        // อัพเดท URL ให้ถูกต้อง - ใช้ domain ของ User Pool ที่ถูกต้อง
        const logoutUrl = `https://htw79.auth.us-east-1.amazoncognito.com/logout?client_id=61uv085pkuso0odci2om9hulm8&logout_uri=http://localhost:8080/login`;
        return res.redirect(logoutUrl);
      }
      
      // ถ้าไม่ได้ใช้ Cognito ให้ redirect ไปที่หน้า login
      res.redirect('/login');
    });
  });
  
  // เพิ่ม routes สำหรับ APIs
  app.get('/api/auth/status', checkAuth, (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated
    });
  });
  
  app.get('/api/user', checkAuth, (req, res) => {
    if (!req.isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // ส่งข้อมูลผู้ใช้กลับไป
    const userData = { ...req.session.userinfo };
    res.json(userData);
  });
  
  // Route สำหรับทดสอบ session
  app.get('/test-session', (req, res) => {
    if (!req.session) {
      return res.status(500).send('Session is not initialized');
    }
    
    if (!req.session.test) {
      req.session.test = 1;
    } else {
      req.session.test++;
    }
    
    req.session.save((err) => {
      if (err) {
        return res.status(500).send(`Error saving session: ${err.message}`);
      }
      res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .status-box { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Session Test</h1>
        
        <div class="status-box">
          <p>Session is working. Counter: ${req.session.test}</p>
          <p>Session ID: ${req.session.id}</p>
          <p>Refresh page to increment counter.</p>
        </div>
        
        <pre>
    Session Data:
    ${JSON.stringify(req.session, null, 2)}
        </pre>
        
        <p><a href="/">กลับสู่หน้าหลัก</a> | <a href="/login">ไปที่หน้าล็อกอิน</a></p>
      </body>
      </html>
      `);
    });
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
    console.log(`💡 Login page: http://localhost:${port}/login`);
  });