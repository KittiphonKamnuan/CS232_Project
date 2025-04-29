/**
 * InfoHub 360 - AWS Configuration
 * 
 * This file contains configuration for AWS services used in the application.
 * Replace placeholder values with your actual AWS configuration.
 */

// AWS Region
const AWS_REGION = 'ap-southeast-1'; // เปลี่ยนเป็น region ที่คุณใช้งาน เช่น ap-southeast-1 สำหรับสิงคโปร์

// DynamoDB Table Names
const TABLES = {
  USERS: 'InfoHub360_Users',
  PRODUCTS: 'InfoHub360_Products',
  CUSTOMERS: 'InfoHub360_Customers',
  SALES: 'InfoHub360_Sales',
  DOCUMENTS: 'InfoHub360_Documents'
};

// Cognito Configuration
const COGNITO = {
  USER_POOL_ID: 'ap-southeast-1_xxxxxxxx', // User Pool ID จาก Cognito
  CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // App Client ID จาก Cognito
  IDENTITY_POOL_ID: 'ap-southeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' // Identity Pool ID (ถ้าใช้)
};

// Initialize AWS SDK
function initializeAWS() {
  // Configure AWS SDK
  AWS.config.region = AWS_REGION;
  
  // ตัวอย่างการใช้ Cognito สำหรับ authentication
  const authData = {
    UserPoolId: COGNITO.USER_POOL_ID,
    ClientId: COGNITO.CLIENT_ID
  };
  
  const auth = new AmazonCognitoIdentity.CognitoUserPool(authData);
  
  // สำหรับการเข้าถึง DynamoDB โดยตรง (ไม่แนะนำในการใช้งานจริงบนเว็บไคลเอนต์)
  // แนะนำให้ใช้ API Gateway + Lambda แทน
  /*
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: COGNITO.IDENTITY_POOL_ID
  });
  */
  
  return {
    auth,
    dynamoDB: new AWS.DynamoDB.DocumentClient()
  };
}

// Export the configuration and initialization function
export { AWS_REGION, TABLES, COGNITO, initializeAWS };