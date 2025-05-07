/**
 * InfoHub 360 - Authentication Service
 * 
 * This file contains functions for user authentication using AWS Cognito
 */

import { COGNITO } from '../config/aws-config.js';

class AuthService {
  constructor() {
    // Initialize Cognito User Pool
    this.userPool = new AmazonCognitoIdentity.CognitoUserPool({
      UserPoolId: COGNITO.USER_POOL_ID,
      ClientId: COGNITO.CLIENT_ID
    });
    
    // Check if user is already authenticated
    this.isAuthenticated = !!sessionStorage.getItem('infohub_auth');
    this.cognitoUser = null;
  }
  
  /**
   * Authenticate a user via Cognito
   * @param {string} username - The username
   * @param {string} password - The password
   * @returns {Promise} - Resolves to user data or rejects with error
   */
  login(username, password) {
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
        Pool: this.userPool
      };
      
      this.cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      // Authenticate user
      this.cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          // Get tokens from the session
          const idToken = session.getIdToken().getJwtToken();
          const accessToken = session.getAccessToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();
          
          // Store tokens in sessionStorage
          sessionStorage.setItem('infohub_auth', idToken);
          sessionStorage.setItem('infohub_access_token', accessToken);
          sessionStorage.setItem('infohub_refresh_token', refreshToken);
          
          this.isAuthenticated = true;
          
          // Get user attributes
          this.cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              console.error('Error getting user attributes:', err);
              reject(err);
              return;
            }
            
            // Convert attributes array to object
            const userAttributes = {};
            attributes.forEach(attr => {
              userAttributes[attr.getName()] = attr.getValue();
            });
            
            // Store user attributes
            sessionStorage.setItem('infohub_user', JSON.stringify(userAttributes));
            
            resolve(userAttributes);
          });
        },
        onFailure: (err) => {
          console.error('Authentication failed:', err);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Handle new password required challenge
          reject({
            code: 'NewPasswordRequired',
            userAttributes: userAttributes,
            requiredAttributes: requiredAttributes
          });
        },
        mfaRequired: (challengeName, challengeParameters) => {
          // Handle MFA challenge (if MFA is enabled)
          reject({
            code: 'MFARequired',
            challengeName: challengeName,
            challengeParameters: challengeParameters
          });
        }
      });
    });
  }
  
  /**
   * Log out the current user
   */
  logout() {
    // Clear session storage
    sessionStorage.removeItem('infohub_auth');
    sessionStorage.removeItem('infohub_access_token');
    sessionStorage.removeItem('infohub_refresh_token');
    sessionStorage.removeItem('infohub_user');
    this.isAuthenticated = false;
    
    // If using Cognito, sign out from Cognito too
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
      this.cognitoUser = null;
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
    return user && user['custom:role'] && user['custom:role'].includes(role);
  }
  
  /**
   * Complete new password challenge (for first-time login)
   * @param {string} newPassword - The new password
   * @param {Object} userAttributes - User attributes to update
   * @returns {Promise} - Resolves when challenge is completed
   */
  completeNewPasswordChallenge(newPassword, userAttributes = {}) {
    return new Promise((resolve, reject) => {
      if (!this.cognitoUser) {
        reject(new Error('No authenticated user'));
        return;
      }
      
      this.cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: (session) => {
          // Get tokens from the session
          const idToken = session.getIdToken().getJwtToken();
          const accessToken = session.getAccessToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();
          
          // Store tokens in sessionStorage
          sessionStorage.setItem('infohub_auth', idToken);
          sessionStorage.setItem('infohub_access_token', accessToken);
          sessionStorage.setItem('infohub_refresh_token', refreshToken);
          
          this.isAuthenticated = true;
          
          resolve(session);
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  }
  
  /**
   * Change password for authenticated user
   * @param {string} oldPassword - The old password
   * @param {string} newPassword - The new password
   * @returns {Promise} - Resolves when password is changed
   */
  changePassword(oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      if (!this.cognitoUser) {
        // Try to get current authenticated user
        const userData = this.getCurrentUser();
        if (!userData) {
          reject(new Error('No authenticated user'));
          return;
        }
        
        const currentUsername = userData.email || userData.username;
        
        // Create Cognito user
        this.cognitoUser = new AmazonCognitoIdentity.CognitoUser({
          Username: currentUsername,
          Pool: this.userPool
        });
      }
      
      this.cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
  
  /**
   * Request password reset for a user
   * @param {string} username - The username
   * @returns {Promise} - Resolves when code is sent
   */
  forgotPassword(username) {
    return new Promise((resolve, reject) => {
      // Create Cognito user
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: username,
        Pool: this.userPool
      });
      
      cognitoUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
        inputVerificationCode: (data) => {
          resolve(data);
        }
      });
    });
  }
  
  /**
   * Confirm new password with verification code
   * @param {string} username - The username
   * @param {string} verificationCode - The verification code
   * @param {string} newPassword - The new password
   * @returns {Promise} - Resolves when password is reset
   */
  confirmPassword(username, verificationCode, newPassword) {
    return new Promise((resolve, reject) => {
      // Create Cognito user
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: username,
        Pool: this.userPool
      });
      
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  }
  
  /**
   * Refresh session using refresh token
   * @returns {Promise} - Resolves with new session
   */
  refreshSession() {
    return new Promise((resolve, reject) => {
      if (!this.cognitoUser) {
        // Try to get current authenticated user
        const userData = this.getCurrentUser();
        if (!userData) {
          reject(new Error('No authenticated user'));
          return;
        }
        
        const currentUsername = userData.email || userData.username;
        
        // Create Cognito user
        this.cognitoUser = new AmazonCognitoIdentity.CognitoUser({
          Username: currentUsername,
          Pool: this.userPool
        });
      }
      
      // Get refresh token from sessionStorage
      const refreshToken = sessionStorage.getItem('infohub_refresh_token');
      if (!refreshToken) {
        reject(new Error('No refresh token'));
        return;
      }
      
      // Create refresh token object
      const cognitoRefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({
        RefreshToken: refreshToken
      });
      
      // Refresh session
      this.cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
        if (err) {
          console.error('Error refreshing session:', err);
          reject(err);
          return;
        }
        
        // Get tokens from the session
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const newRefreshToken = session.getRefreshToken().getToken();
        
        // Store tokens in sessionStorage
        sessionStorage.setItem('infohub_auth', idToken);
        sessionStorage.setItem('infohub_access_token', accessToken);
        sessionStorage.setItem('infohub_refresh_token', newRefreshToken);
        
        this.isAuthenticated = true;
        
        resolve(session);
      });
    });
  }
  
  /**
   * Check if the current token is valid
   * @returns {boolean} - True if token is valid
   */
  isTokenValid() {
    // Check if there's a token
    const idToken = sessionStorage.getItem('infohub_auth');
    if (!idToken) {
      return false;
    }
    
    // In a real application, you would parse the JWT token and check its expiration
    // For simplicity, we'll just check if it exists
    // TODO: Implement proper token validation
    
    return true;
  }
  
  /**
   * Get the current Cognito user
   * @returns {Object|null} - Cognito user object or null
   */
  getCognitoUser() {
    // Get current user from the pool
    const cognitoUser = this.userPool.getCurrentUser();
    
    if (cognitoUser) {
      this.cognitoUser = cognitoUser;
    }
    
    return this.cognitoUser;
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;