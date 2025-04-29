/**
 * InfoHub 360 - Login Page JavaScript
 * 
 * This file contains all the JavaScript functionality for the login page
 * including form validation, password toggling, and authentication.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginForm = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const rememberMe = document.getElementById('rememberMe');
    
    // Check if there's a saved username in localStorage
    if (localStorage.getItem('infohub_username')) {
      username.value = localStorage.getItem('infohub_username');
      rememberMe.checked = true;
    }
    
    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      
      // Toggle eye icon
      const eyeIcon = this.querySelector('i');
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
    });
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Basic validation
      if (!username.value.trim()) {
        showError('กรุณากรอกชื่อผู้ใช้');
        username.focus();
        return;
      }
      
      if (!password.value) {
        showError('กรุณากรอกรหัสผ่าน');
        password.focus();
        return;
      }
      
      // Show loading state
      setLoading(true);
      
      // Save username to localStorage if remember me is checked
      if (rememberMe.checked) {
        localStorage.setItem('infohub_username', username.value);
      } else {
        localStorage.removeItem('infohub_username');
      }
      
      // In a real application, this would be an API call to your authentication endpoint
      // For this example, we're simulating an API call with a timeout
      setTimeout(() => {
        authenticateUser(username.value, password.value);
      }, 1500);
    });
    
    /**
     * Authenticates the user credentials
     * @param {string} username - The username
     * @param {string} password - The password
     */
    function authenticateUser(username, password) {
      // This is just a demo authentication
      // In a real app, this would be a call to your backend/AWS Cognito/etc.
      
      // Demo credentials
      if (username === 'somchai' && password === 'password123') {
        // Successful login
        
        // In a real application, you would:
        // 1. Get a token from your authentication service
        // 2. Store it securely (e.g., HttpOnly cookie or sessionStorage)
        // 3. Redirect to the dashboard
        
        // For this demo, we'll just store a dummy token and redirect
        sessionStorage.setItem('infohub_auth', 'dummy-jwt-token');
        
        // Redirect to dashboard
        window.location.href = 'index.html';
      } else {
        // Failed login
        showError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
      }
    }
    
    /**
     * Shows an error message
     * @param {string} message - The error message to display
     */
    function showError(message) {
      errorText.textContent = message;
      errorMessage.classList.add('active');
    }
    
    /**
     * Sets the loading state of the login button
     * @param {boolean} isLoading - Whether the button should show loading state
     */
    function setLoading(isLoading) {
      if (isLoading) {
        loginButton.disabled = true;
        loadingSpinner.classList.add('active');
        buttonText.textContent = 'กำลังเข้าสู่ระบบ...';
        errorMessage.classList.remove('active');
      } else {
        loginButton.disabled = false;
        loadingSpinner.classList.remove('active');
        buttonText.textContent = 'เข้าสู่ระบบ';
      }
    }
    
    /**
     * Handles DynamoDB connection for authentication
     * This is just a placeholder function - in a real app, you'd implement 
     * AWS SDK integration here or in a separate service file
     */
    function connectToDynamoDB() {
      // In a real application, you would initialize AWS SDK here:
      /*
      AWS.config.update({
        region: 'your-region',
        credentials: new AWS.CognitoIdentityCredentials({
          IdentityPoolId: 'your-identity-pool-id'
        })
      });
      
      const dynamodb = new AWS.DynamoDB.DocumentClient();
      */
      
      // And then you would query your Users table:
      /*
      const params = {
        TableName: 'Users',
        Key: {
          username: username.value
        }
      };
      
      dynamodb.get(params, function(err, data) {
        if (err) {
          console.error("Error:", err);
          showError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
          setLoading(false);
        } else {
          if (data.Item && validatePassword(password.value, data.Item.passwordHash)) {
            // Login successful
            window.location.href = 'index.html';
          } else {
            showError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            setLoading(false);
          }
        }
      });
      */
    }
  });