// config.js - อ่านค่าจาก .env และกำหนดค่า config
// หมายเหตุ: ในโหมดการทำงานจริง ควรใช้ server เพื่ออ่านค่าจาก .env ฝั่ง server
// ไม่ควรใส่ข้อมูลสำคัญลงใน JavaScript ฝั่ง client โดยตรง

window.AppConfig = {
    cognito: {
      userPoolId: 'us-east-1_FhgCeg2YB',
      clientId: '5eeajv1i9r7e64qv0gd7h1u0bi'
    },
    api: {
      baseUrl: 'https://s9ohxtt51a.execute-api.us-east-1.amazonaws.com'
    }
  };  
  
  console.log('Config loaded:', window.AppConfig);