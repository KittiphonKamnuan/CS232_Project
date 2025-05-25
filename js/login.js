/**
 * InfoHub 360 - Login Handler
 * 
 * ไฟล์นี้จัดการการล็อกอินผ่าน AWS Cognito
 * อัปเดต: รองรับ Cognito User Attributes และจัดการข้อมูลผู้ใช้ที่ถูกต้อง
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Login script loaded');
  
  // ข้อมูล Cognito
  const poolData = {
    UserPoolId: 'us-east-1_SkQQTwajD',
    ClientId: 'enel8ba2e0n2jhschr9eoiac7'
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
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      showError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    
    console.log('Attempting login for user:', username);
    
    // แสดงสถานะกำลังโหลด
    showLoading(true);
    
    // ซ่อนข้อความผิดพลาด (ถ้ามี)
    hideError();
    
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
        handleLoginSuccess(result, username, cognitoUser);
      },
      
      onFailure: function(err) {
        console.error('Login error:', err);
        handleLoginError(err);
      },
      
      newPasswordRequired: function(userAttributes, requiredAttributes) {
        console.log('New password required');
        handleNewPasswordRequired(userAttributes, requiredAttributes, cognitoUser);
      },
      
      mfaRequired: function(challengeName, challengeParameters) {
        console.log('MFA required');
        handleMfaRequired(challengeName, challengeParameters);
      }
    });
  }
  
  // จัดการการล็อกอินสำเร็จ
  function handleLoginSuccess(result, username, cognitoUser) {
    try {
      // เก็บ tokens ใน session storage
      const idToken = result.getIdToken().getJwtToken();
      const accessToken = result.getAccessToken().getJwtToken();
      const refreshToken = result.getRefreshToken().getToken();
      
      sessionStorage.setItem('infohub_auth', idToken);
      sessionStorage.setItem('infohub_access_token', accessToken);
      sessionStorage.setItem('infohub_refresh_token', refreshToken);
      
      // ดึงข้อมูลผู้ใช้จาก ID Token
      const idTokenPayload = result.getIdToken().payload;
      console.log('ID Token Payload:', idTokenPayload);
      
      // ดึงข้อมูล User Attributes เพิ่มเติม
      getUserAttributes(cognitoUser, idTokenPayload, username);
      
    } catch (error) {
      console.error('Error processing login success:', error);
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูลการล็อกอิน');
      showLoading(false);
    }
  }
  
  // ดึงข้อมูล User Attributes จาก Cognito
  function getUserAttributes(cognitoUser, idTokenPayload, username) {
    cognitoUser.getUserAttributes(function(err, attributes) {
      if (err) {
        console.error('Error getting user attributes:', err);
        // ใช้ข้อมูลจาก ID Token เป็นหลัก
        saveUserDataAndRedirect(idTokenPayload, null, username);
        return;
      }
      
      console.log('User attributes:', attributes);
      
      // แปลง attributes array เป็น object
      const userAttributes = {};
      if (attributes) {
        attributes.forEach(attribute => {
          userAttributes[attribute.Name] = attribute.Value;
        });
      }
      
      console.log('Processed user attributes:', userAttributes);
      
      // บันทึกข้อมูลและเปลี่ยนเส้นทาง
      saveUserDataAndRedirect(idTokenPayload, userAttributes, username);
    });
  }
  
  // บันทึกข้อมูลผู้ใช้และเปลี่ยนเส้นทาง
  function saveUserDataAndRedirect(idTokenPayload, userAttributes, username) {
    try {
      // รวมข้อมูลจาก ID Token และ User Attributes
      const combinedUserData = {
        // ข้อมูลจาก ID Token
        sub: idTokenPayload.sub,
        email_verified: idTokenPayload.email_verified,
        iss: idTokenPayload.iss,
        'cognito:username': idTokenPayload['cognito:username'] || username,
        aud: idTokenPayload.aud,
        event_id: idTokenPayload.event_id,
        token_use: idTokenPayload.token_use,
        auth_time: idTokenPayload.auth_time,
        exp: idTokenPayload.exp,
        iat: idTokenPayload.iat,
        
        // ข้อมูลจาก User Attributes (ถ้ามี)
        email: userAttributes?.email || idTokenPayload.email,
        name: userAttributes?.name || idTokenPayload.name,
        nickname: userAttributes?.nickname || idTokenPayload.nickname,
        phone_number: userAttributes?.phone_number || idTokenPayload.phone_number,
        picture: userAttributes?.picture || idTokenPayload.picture,
        
        // ข้อมูลเพิ่มเติม
        username: username,
        loginTime: new Date().toISOString()
      };
      
      console.log('Combined user data:', combinedUserData);
      
      // เก็บข้อมูลผู้ใช้ใน sessionStorage
      sessionStorage.setItem('infohub_user', JSON.stringify(combinedUserData));
      
      // จดจำ username หากทำเครื่องหมายที่ "จดจำฉันไว้ในระบบ"
      handleRememberMe(username);
      
      // แสดงข้อความสำเร็จ
      showSuccess('เข้าสู่ระบบสำเร็จ กำลังนำคุณเข้าสู่หน้าหลัก...');
      
      // เปลี่ยนเส้นทางไปยังหน้าที่ต้องการ
      setTimeout(() => {
        const redirectUrl = sessionStorage.getItem('redirect_after_login') || 'index.html';
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirectUrl;
      }, 1500);
      
    } catch (error) {
      console.error('Error saving user data:', error);
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้');
      showLoading(false);
    }
  }
  
  // จัดการ Remember Me
  function handleRememberMe(username) {
    const rememberMe = document.getElementById('rememberMe');
    if (rememberMe && rememberMe.checked) {
      localStorage.setItem('infohub_remember_username', username);
    } else {
      localStorage.removeItem('infohub_remember_username');
    }
  }
  
  // จัดการข้อผิดพลาดการล็อกอิน
  function handleLoginError(err) {
    showLoading(false);
    
    let errorMsg = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    
    if (err.message) {
      if (err.message.includes('Incorrect username or password')) {
        errorMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.message.includes('User is not confirmed')) {
        errorMsg = 'บัญชีผู้ใช้ยังไม่ได้รับการยืนยัน กรุณาติดต่อผู้ดูแลระบบ';
      } else if (err.message.includes('User does not exist')) {
        errorMsg = 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ';
      } else if (err.message.includes('UserNotFoundException')) {
        errorMsg = 'ไม่พบบัญชีผู้ใช้นี้ในระบบ';
      } else if (err.message.includes('NotAuthorizedException')) {
        errorMsg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.message.includes('TooManyRequestsException')) {
        errorMsg = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่แล้วลองใหม่';
      } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่';
      } else {
        errorMsg = `เกิดข้อผิดพลาด: ${err.message}`;
      }
    }
    
    showError(errorMsg);
  }
  
  // จัดการกรณีต้องเปลี่ยนรหัสผ่านใหม่
  function handleNewPasswordRequired(userAttributes, requiredAttributes, cognitoUser) {
    showLoading(false);
    showError('ต้องเปลี่ยนรหัสผ่านใหม่ กรุณาติดต่อผู้ดูแลระบบ');
    
    // TODO: เพิ่มฟังก์ชันการเปลี่ยนรหัสผ่านในอนาคต
    console.log('Required attributes for password change:', requiredAttributes);
    console.log('User attributes:', userAttributes);
  }
  
  // จัดการกรณีต้องใช้ MFA
  function handleMfaRequired(challengeName, challengeParameters) {
    showLoading(false);
    showError('ต้องยืนยันตัวตนด้วยรหัส MFA กรุณาติดต่อผู้ดูแลระบบ');
    
    // TODO: เพิ่มฟังก์ชัน MFA ในอนาคต
    console.log('MFA Challenge:', challengeName);
    console.log('Challenge Parameters:', challengeParameters);
  }
  
  // ฟังก์ชันแสดง/ซ่อนสถานะโหลด
  function showLoading(show) {
    if (loadingSpinner && buttonText) {
      if (show) {
        loadingSpinner.classList.remove('hide');
        buttonText.textContent = 'กำลังเข้าสู่ระบบ...';
        if (loginButton) loginButton.disabled = true;
      } else {
        loadingSpinner.classList.add('hide');
        buttonText.textContent = 'เข้าสู่ระบบ';
        if (loginButton) loginButton.disabled = false;
      }
    }
  }
  
  // ฟังก์ชันแสดงข้อความผิดพลาด
  function showError(message) {
    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.classList.remove('hide');
      
      // Auto hide error after 10 seconds
      setTimeout(() => {
        hideError();
      }, 10000);
    }
  }
  
  // ฟังก์ชันซ่อนข้อความผิดพลาด
  function hideError() {
    if (errorMessage) {
      errorMessage.classList.add('hide');
    }
  }
  
  // ฟังก์ชันแสดงข้อความสำเร็จ
  function showSuccess(message) {
    // สร้าง success message element ถ้ายังไม่มี
    let successMessage = document.getElementById('successMessage');
    if (!successMessage) {
      successMessage = document.createElement('div');
      successMessage.id = 'successMessage';
      successMessage.className = 'alert alert-success';
      successMessage.innerHTML = `
        <div class="alert-content">
          <i class="fas fa-check-circle"></i>
          <span id="successText"></span>
        </div>
      `;
      
      // แทรกก่อน error message
      if (errorMessage && errorMessage.parentNode) {
        errorMessage.parentNode.insertBefore(successMessage, errorMessage);
      }
    }
    
    const successText = document.getElementById('successText');
    if (successText) {
      successText.textContent = message;
    }
    
    successMessage.classList.remove('hide');
    hideError(); // ซ่อน error message ถ้ามี
  }
  
  // ตรวจสอบว่ามี username ที่จำไว้หรือไม่
  function loadRememberedUsername() {
    const rememberedUsername = localStorage.getItem('infohub_remember_username');
    if (rememberedUsername) {
      const usernameInput = document.getElementById('username');
      const rememberMeCheckbox = document.getElementById('rememberMe');
      
      if (usernameInput) usernameInput.value = rememberedUsername;
      if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
      
      // Focus ที่ password field
      if (passwordInput) {
        passwordInput.focus();
      }
    }
  }
  
  // จัดการลิงก์สมัครสมาชิก
  const signupLink = document.getElementById('signupLink');
  if (signupLink) {
    signupLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีผู้ใช้ใหม่\n\nอีเมล: admin@infohub360.com\nโทร: 02-123-4567');
    });
  }
  
  // จัดการลิงก์ลืมรหัสผ่าน
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน\n\nอีเมล: admin@infohub360.com\nโทร: 02-123-4567');
    });
  }
  
  // ตรวจสอบพารามิเตอร์ error ใน URL
  function checkUrlError() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      showError(decodeURIComponent(errorParam));
      
      // ลบ error parameter จาก URL
      const url = new URL(window.location);
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url);
    }
  }
  
  // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่แล้วหรือไม่
  function checkExistingLogin() {
    const authToken = sessionStorage.getItem('infohub_auth');
    if (authToken) {
      try {
        // ตรวจสอบว่า token ยังใช้ได้อยู่หรือไม่
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          // Token ยังใช้ได้ เปลี่ยนเส้นทางไปหน้าหลัก
          console.log('User already logged in, redirecting...');
          window.location.href = 'index.html';
          return true;
        } else {
          // Token หมดอายุ ลบข้อมูลเก่า
          sessionStorage.removeItem('infohub_auth');
          sessionStorage.removeItem('infohub_access_token');
          sessionStorage.removeItem('infohub_refresh_token');
          sessionStorage.removeItem('infohub_user');
        }
      } catch (error) {
        console.error('Error checking existing login:', error);
        // ลบข้อมูลเก่าถ้ามีปัญหา
        sessionStorage.clear();
      }
    }
    return false;
  }
  
  // ตรวจสอบการกด Enter ในช่องข้อมูล
  function setupKeyboardEvents() {
    const inputs = document.querySelectorAll('#loginForm input');
    inputs.forEach(input => {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleLogin();
        }
      });
    });
    
    // ปิด error message เมื่อมีการพิมพ์
    const usernameInput = document.getElementById('username');
    const passwordInputField = document.getElementById('password');
    
    [usernameInput, passwordInputField].forEach(input => {
      if (input) {
        input.addEventListener('input', function() {
          hideError();
        });
      }
    });
  }
  
  // Initialize functions
  function initialize() {
    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่แล้วหรือไม่
    if (checkExistingLogin()) {
      return;
    }
    
    // โหลด username ที่จำไว้
    loadRememberedUsername();
    
    // ตรวจสอบ URL error
    checkUrlError();
    
    // ตั้งค่า keyboard events
    setupKeyboardEvents();
    
    console.log('Login page initialized');
  }
  
  // เริ่มต้นการทำงาน
  initialize();
  
  // Export ฟังก์ชันสำหรับใช้งานภายนอก (ถ้าจำเป็น)
  window.InfoHubLogin = {
    handleLogin: handleLogin,
    showError: showError,
    showSuccess: showSuccess,
    hideError: hideError
  };
});