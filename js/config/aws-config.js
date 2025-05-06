// aws-config.js

// AWS Region
const AWS_REGION = 'us-east-1'; // หรือ ap-southeast-1 แล้วแต่คุณใช้จริง

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
  USER_POOL_ID: 'us-east-1_FhgCeg2YB',
  CLIENT_ID: '3nl4qiirkgk0appekqtf13qbn6',
  IDENTITY_POOL_ID: '' // หากคุณยังไม่ใช้ Identity Pool สำหรับ AWS SDK แบบเต็ม ไม่จำเป็นต้องกรอก
};

// Export configuration
export { AWS_REGION, TABLES, COGNITO };
