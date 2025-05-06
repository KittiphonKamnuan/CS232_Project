// app.js

import express from 'express';
import session from 'express-session';
import * as openid from 'openid-client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const { Issuer, generators } = openid;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname))); // ให้ access ทุกไฟล์รวมถึง index.html, css/, js/, assets/

// Session middleware
app.use(session({
  secret: 'some_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

// OIDC Client Setup
let client;

async function initializeClient() {
  const issuer = await Issuer.discover('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FhgCeg2YB');
  client = new issuer.Client({
    client_id: '3nl4qiirkgk0appekqtf13qbn6',
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: ['http://localhost:8080/callback'],
    response_types: ['code']
  });
}

initializeClient().catch(console.error);

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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  const state = generators.state();
  const nonce = generators.nonce();
  req.session.state = state;
  req.session.nonce = nonce;

  const authUrl = client.authorizationUrl({
    scope: 'openid email',
    state,
    nonce
  });
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  try {
    const { state, nonce } = req.session || {};
    if (!state || !nonce) throw new Error('Session expired or invalid login flow.');

    const params = client.callbackParams(req);
    const tokenSet = await client.callback('http://localhost:8080/callback', params, {
      state,
      nonce
    });

    const userinfo = await client.userinfo(tokenSet.access_token);
    req.session.userinfo = userinfo;
    res.redirect('/');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = 'https://us-east-1fhgceg2yb.auth.us-east-1.amazoncognito.com/logout' +
      '?client_id=3nl4qiirkgk0appekqtf13qbn6' +
      '&logout_uri=http://localhost:8080';
    res.redirect(logoutUrl);
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});