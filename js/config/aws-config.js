/**
 * InfoHub 360 - AWS Configuration
 * 
 * ไฟล์นี้เก็บการตั้งค่าต่างๆ สำหรับบริการ AWS 
 * เช่น Cognito, DynamoDB และ API Gateway
 */

// AWS Region
export const AWS_REGION = 'us-east-1'; // หรือ ap-southeast-1 แล้วแต่คุณใช้จริง

// DynamoDB Table Names
export const TABLES = {
  USERS: 'InfoHub360_Users',
  PRODUCTS: 'InfoHub360_Products',
  CUSTOMERS: 'InfoHub360_Customers',
  SALES: 'InfoHub360_Sales',
  DOCUMENTS: 'InfoHub360_Documents'
};

// Cognito Configuration
export const COGNITO = {
  USER_POOL_ID: 'us-east-1_htw79',
  CLIENT_ID: '61uv085pkuso0odci2om9hulm8',
  CLIENT_SECRET: 'q720s3k95p5fn1mbev4t98ve9m2ic42am260mp2lsm6qirfpt76',
  IDENTITY_POOL_ID: '' // หากคุณยังไม่ใช้ Identity Pool สำหรับ AWS SDK แบบเต็ม ไม่จำเป็นต้องกรอก
};

// API Gateway Endpoints
export const API_ENDPOINTS = {
  PRODUCTS: 'https://s9ohxtt51a.execute-api.us-east-1.amazonaws.com/GetProducts',
  CUSTOMERS: 'https://api.example.com/customers', // เปลี่ยนเป็น URL จริงของคุณ
  SALES: 'https://api.example.com/sales', // เปลี่ยนเป็น URL จริงของคุณ
  DOCUMENTS: 'https://api.example.com/documents' // เปลี่ยนเป็น URL จริงของคุณ
};

// ฟังก์ชันสำหรับตรวจสอบว่ากำลังทำงานในโหมดพัฒนาหรือโหมดการใช้งานจริง
export function isDevelopment() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// ฟังก์ชันสำหรับเริ่มต้น AWS SDK (ถ้าต้องการใช้)
export function initializeAWS() {
  // ในอนาคตอาจเพิ่มโค้ดสำหรับเริ่มต้น AWS SDK ที่นี่
  return {
    region: AWS_REGION,
    userPoolId: COGNITO.USER_POOL_ID,
    clientId: COGNITO.CLIENT_ID
  };
}