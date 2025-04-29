/**
 * InfoHub 360 - Authentication Service
 * 
 * This file contains functions for user authentication using AWS Cognito and DynamoDB
 */

import { COGNITO, TABLES, initializeAWS } from './aws-config.js';

class AuthService {
  constructor() {
    // Initialize AWS services
    const { auth, dynamoDB } = initializeAWS();
    this.auth = auth;
    this.dynamoDB = dynamoDB;
    
    // Check if user is already authenticated
    this.isAuthenticated = !!sessionStorage.getItem('infohub_auth');
  }
  
  /**
   * Authenticate a user via DynamoDB or Cognito
   * @param {string} username - The username
   * @param {string} password - The password
   * @returns {Promise} - Resolves to user data or rejects with error
   */
  login(username, password) {
    return new Promise((resolve, reject) => {
      // ตัวเลือก 1: ใช้ DynamoDB ตรวจสอบโดยตรง (ไม่แนะนำในการใช้งานจริง เพราะ credentials จะถูกเปิดเผยบนฝั่ง client)
      // สำหรับการพัฒนาหรือทดสอบเท่านั้น
      this._loginWithDynamoDB(username, password)
        .then(userData => {
          // Store auth token
          sessionStorage.setItem('infohub_auth', 'dynamodb-user-authenticated');
          sessionStorage.setItem('infohub_user', JSON.stringify(userData));
          this.isAuthenticated = true;
          resolve(userData);
        })
        .catch(error => {
          // ถ้าล้มเหลว ให้ลองใช้ Cognito
          this._loginWithCognito(username, password)
            .then(userData => {
              // Store auth token from Cognito
              sessionStorage.setItem('infohub_auth', userData.token);
              sessionStorage.setItem('infohub_user', JSON.stringify(userData.attributes));
              this.isAuthenticated = true;
              resolve(userData.attributes);
            })
            .catch(error => {
              reject(error);
            });
        });
    });
  }
  
  /**
   * Log out the current user
   */
  logout() {
    // Clear session storage
    sessionStorage.removeItem('infohub_auth');
    sessionStorage.removeItem('infohub_user');
    this.isAuthenticated = false;
    
    // If using Cognito, sign out from Cognito too
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
    }
    
    // Redirect to login page
    window.location.href = 'login.html';
  }
  
  /**
   * Get current user data
   * @returns {Object|null} - User data or null if not authenticated
   */
  getCurrentUser() {
    if (!this.isAuthenticated) {
      return null;
    }
    
    const userData = sessionStorage.getItem('infohub_user');
    return userData ? JSON.parse(userData) : null;
  }
  
  /**
   * Check if current user has specific role
   * @param {string} role - The role to check
   * @returns {boolean} - True if user has the role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.roles && user.roles.includes(role);
  }
  
  /**
   * Authenticate with DynamoDB directly
   * @private
   */
  _loginWithDynamoDB(username, password) {
    return new Promise((resolve, reject) => {
      // Query the Users table in DynamoDB
      const params = {
        TableName: TABLES.USERS,
        Key: {
          username: username
        }
      };
      
      this.dynamoDB.get(params, (err, data) => {
        if (err) {
          console.error("DynamoDB error:", err);
          reject(new Error("การเชื่อมต่อฐานข้อมูลมีปัญหา"));
          return;
        }
        
        // Check if user exists and password matches
        if (data.Item && this._verifyPassword(password, data.Item.passwordHash)) {
          // Remove sensitive data before returning
          const userData = { ...data.Item };
          delete userData.passwordHash;
          
          resolve(userData);
        } else {
          reject(new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"));
        }
      });
    });
  }
  
  /**
   * Authenticate with Amazon Cognito
   * @private
   */
  _loginWithCognito(username, password) {
    return new Promise((resolve, reject) => {
      // Create authentication details
      const authenticationData = {
        Username: username,
        Password: password
      };
      
      const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
      
      // Create user
      const userData = {
        Username: username,
        Pool: this.auth
      };
      
      this.cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      // Authenticate user
      this.cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          // Get user attributes
          this.cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              reject(err);
              return;
            }
            
            // Convert attributes array to object
            const userAttributes = {};
            attributes.forEach(attr => {
              userAttributes[attr.Name] = attr.Value;
            });
            
            resolve({
              token: session.getIdToken().getJwtToken(),
              attributes: userAttributes
            });
          });
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  }
  
  /**
   * Verify password against hash
   * @private
   */
  _verifyPassword(password, hash) {
    // In a real application, you would use a proper password hashing library
    // This is just a demo for illustration purposes
    // DO NOT USE THIS IN PRODUCTION
    
    // Simple comparison (for demo only)
    return hash === password; // ในระบบจริงควรใช้ bcrypt หรือ scrypt
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;