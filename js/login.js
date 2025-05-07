/**
 * InfoHub 360 - Login Handler
 * 
 * ไฟล์นี้จัดการการล็อกอินผ่าน AWS Cognito
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Login script loaded');
  
  // ข้อมูล Cognito
  const poolData = {
    UserPoolId: 'us-east-1_FhgCeg2YB',
    ClientId: '5eeajv1i9r7e64qv0gd7h1u0bi'
  };  
  
  // สร้าง Cognito User Pool
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  console.log('Cognito User Pool initialized');
  
  // Toggle Password Visibility
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle eye icon
      const eyeIcon = this.querySelector('i');
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
    });
  }
  
  // ดึงองค์ประกอบที่ต้องใช้
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const buttonText = document.getElementById('buttonText');
  
  // เพิ่ม Event Listener สำหรับปุ่มล็อกอิน
  if (loginButton) {
    loginButton.addEventListener('click', function() {
      handleLogin();
    });
    console.log('Login button event listener added');
  }
  
  // เพิ่ม Event Listener สำหรับฟอร์มล็อกอิน
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleLogin();
    });
    console.log('Login form event listener added');
  }
  
  // ฟังก์ชันจัดการการล็อกอิน
  function handleLogin() {
    console.log('Handle login function called');
    
    // ดึงค่าจากฟอร์ม
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) {
      console.error('Cannot find username or password inputs');
      return;
    }
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
      if (errorMessage && errorText) {
        errorText.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
        errorMessage.classList.remove('hide');
      }
      return;
    }
    
    console.log('Attempting login for user:', username);
    
    // แสดงสถานะกำลังโหลด
    if (loadingSpinner && buttonText) {
      loadingSpinner.classList.remove('hide');
      buttonText.textContent = 'กำลังเข้าสู่ระบบ...';
    }
    
    // ซ่อนข้อความผิดพลาด (ถ้ามี)
    if (errorMessage) {
      errorMessage.classList.add('hide');
    }
    
    // เริ่มกระบวนการล็อกอินกับ Cognito
    authenticateWithCognito(username, password);
  }
  
  // ฟังก์ชันสำหรับการล็อกอินผ่าน Cognito
  function authenticateWithCognito(username, password) {
    console.log('Authenticating with Cognito...');
    
    // สร้างข้อมูลสำหรับการล็อกอิน
    const authenticationData = {
      Username: username,
      Password: password
    };
    
    // ไม่จำเป็นต้องส่ง SecretHash ถ้าปิดการใช้งาน Client Secret ในหน้า AWS Console
    
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    
    const userData = {
      Username: username,
      Pool: userPool
    };
    
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    // ทำการล็อกอิน
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function(result) {
        console.log('Login successful');
        
        // เก็บ tokens ใน session storage
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();
        
        sessionStorage.setItem('infohub_auth', idToken);
        sessionStorage.setItem('infohub_access_token', accessToken);
        sessionStorage.setItem('infohub_refresh_token', refreshToken);
        
        // เก็บข้อมูลผู้ใช้
        const payload = result.getIdToken().payload;
        sessionStorage.setItem('infohub_user', JSON.stringify(payload));
        
        // จดจำ username หากทำเครื่องหมายที่ "จดจำฉันไว้ในระบบ"
        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe && rememberMe.checked) {
          localStorage.setItem('infohub_remember_username', username);
        } else {
          localStorage.removeItem('infohub_remember_username');
        }
        
        // เปลี่ยนเส้นทางไปยังหน้าหลัก
        window.location.href = '/';
      },
      
      onFailure: function(err) {
        console.error('Login error:', err);
        
        // ซ่อนสถานะกำลังโหลด
        if (loadingSpinner && buttonText) {
          loadingSpinner.classList.add('hide');
          buttonText.textContent = 'เข้าสู่ระบบ';
        }
        
        // แสดงข้อความผิดพลาด
        if (errorMessage && errorText) {
          let errorMsg = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
          
          if (err.message) {
            if (err.message.includes('Incorrect username or password')) {
              errorMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            } else if (err.message.includes('User is not confirmed')) {
              errorMsg = 'บัญชีผู้ใช้ยังไม่ได้รับการยืนยัน กรุณาตรวจสอบอีเมลของคุณ';
            } else if (err.message.includes('User does not exist')) {
              errorMsg = 'ไม่พบบัญชีผู้ใช้นี้ในระบบ';
            } else if (err.message.includes('SECRET_HASH was not received')) {
              errorMsg = 'เกิดข้อผิดพลาดในการคำนวณรหัสตรวจสอบ กรุณาติดต่อผู้ดูแลระบบ';
            } else {
              errorMsg = err.message;
            }
          }
          
          errorText.textContent = errorMsg;
          errorMessage.classList.remove('hide');
        }
      },
      
      newPasswordRequired: function(userAttributes, requiredAttributes) {
        // สำหรับกรณีที่ต้องเปลี่ยนรหัสผ่านใหม่เมื่อล็อกอินครั้งแรก
        console.log('New password required');
        
        // ซ่อนสถานะกำลังโหลด
        if (loadingSpinner && buttonText) {
          loadingSpinner.classList.add('hide');
          buttonText.textContent = 'เข้าสู่ระบบ';
        }
        
        // แสดงข้อความแจ้งให้ติดต่อผู้ดูแลระบบ
        if (errorMessage && errorText) {
          errorText.textContent = 'ต้องเปลี่ยนรหัสผ่านใหม่ กรุณาติดต่อผู้ดูแลระบบ';
          errorMessage.classList.remove('hide');
        }
      },
      
      mfaRequired: function(challengeName, challengeParameters) {
        // สำหรับกรณีที่ต้องใช้ MFA
        console.log('MFA required');
        
        // ซ่อนสถานะกำลังโหลด
        if (loadingSpinner && buttonText) {
          loadingSpinner.classList.add('hide');
          buttonText.textContent = 'เข้าสู่ระบบ';
        }
        
        // แสดงข้อความแจ้งให้ติดต่อผู้ดูแลระบบ
        if (errorMessage && errorText) {
          errorText.textContent = 'ต้องยืนยันตัวตนด้วยรหัส MFA กรุณาติดต่อผู้ดูแลระบบ';
          errorMessage.classList.remove('hide');
        }
      }
    });
  }
  
  // ตรวจสอบว่ามี username ที่จำไว้หรือไม่
  const rememberedUsername = localStorage.getItem('infohub_remember_username');
  if (rememberedUsername) {
    const usernameInput = document.getElementById('username');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (usernameInput) usernameInput.value = rememberedUsername;
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
  }
  
  // จัดการลิงก์สมัครสมาชิก
  const signupLink = document.getElementById('signupLink');
  if (signupLink) {
    signupLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีผู้ใช้ใหม่');
    });
  }
  
  // จัดการลิงก์ลืมรหัสผ่าน
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน');
    });
  }
  
  // ตรวจสอบพารามิเตอร์ error ใน URL
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get('error');
  
  if (errorParam) {
    // แสดงข้อความผิดพลาด
    if (errorMessage && errorText) {
      errorText.textContent = decodeURIComponent(errorParam);
      errorMessage.classList.remove('hide');
    }
  }
  
  // ตรวจสอบการกด Enter ในช่องข้อมูล
  const inputs = document.querySelectorAll('#loginForm input');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  });
});