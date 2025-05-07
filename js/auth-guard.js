/**
 * InfoHub 360 - Authentication Guard
 * 
 * ไฟล์นี้ใช้สำหรับตรวจสอบการยืนยันตัวตนในหน้าที่ต้องการการยืนยันตัวตน
 * หากผู้ใช้ยังไม่ได้เข้าสู่ระบบ จะถูกเปลี่ยนเส้นทางไปยังหน้าล็อกอิน
 */

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่าอยู่ในหน้าล็อกอินหรือไม่
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (isLoginPage) {
        // ถ้าอยู่ในหน้าล็อกอินและมี token อยู่แล้ว ให้เปลี่ยนเส้นทางไปยังหน้าหลัก
        if (sessionStorage.getItem('infohub_auth')) {
            window.location.href = 'index.html';
        }
        return; // ไม่ต้องตรวจสอบต่อถ้าอยู่ในหน้าล็อกอิน
    }
    
    // ตรวจสอบว่ามี token หรือไม่
    const authToken = sessionStorage.getItem('infohub_auth');
    
    if (!authToken) {
        console.log('ไม่พบ Token - เปลี่ยนเส้นทางไปยังหน้าล็อกอิน');
        
        // เก็บหน้าที่พยายามเข้าถึง
        sessionStorage.setItem('redirect_after_login', window.location.href);
        
        // เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
        window.location.href = 'login.html';
        return;
    }
    
    // ตรวจสอบ token หมดอายุ (ต้องแยกวิเคราะห์ JWT token)
    checkTokenExpiration(authToken);
    
    // อัพเดทข้อมูลผู้ใช้ใน UI
    updateUserInfoUI();
});

/**
 * ตรวจสอบว่า token หมดอายุหรือไม่
 */
function checkTokenExpiration(token) {
    try {
        // ถอดรหัส JWT token (ส่วนที่ 2 คือ payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // ตรวจสอบเวลาหมดอายุ
        const expTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        if (currentTime > expTime) {
            console.log('Token หมดอายุ - เปลี่ยนเส้นทางไปยังหน้าล็อกอิน');
            
            // ลบข้อมูลใน sessionStorage
            sessionStorage.removeItem('infohub_auth');
            sessionStorage.removeItem('infohub_access_token');
            sessionStorage.removeItem('infohub_refresh_token');
            sessionStorage.removeItem('infohub_user');
            
            // เก็บหน้าที่พยายามเข้าถึง
            sessionStorage.setItem('redirect_after_login', window.location.href);
            
            // เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
            window.location.href = 'login.html?error=' + encodeURIComponent('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบ token:', error);
        return false;
    }
}

/**
 * อัพเดทข้อมูลผู้ใช้ในส่วนต่างๆ ของ UI
 */
function updateUserInfoUI() {
    // ดึงข้อมูลผู้ใช้จาก sessionStorage
    const userDataStr = sessionStorage.getItem('infohub_user');
    if (!userDataStr) return;
    
    const userData = JSON.parse(userDataStr);
    
    // อัพเดทชื่อผู้ใช้ในส่วน header
    const userGreeting = document.querySelector('.user-greeting');
    if (userGreeting) {
        // ตรวจสอบว่ามีชื่อจริงหรือไม่
        if (userData.given_name) {
            userGreeting.textContent = `สวัสดี, คุณ${userData.given_name}`;
        } else if (userData.name) {
            userGreeting.textContent = `สวัสดี, คุณ${userData.name}`;
        } else {
            userGreeting.textContent = `สวัสดี, ${userData.email || userData.username || 'คุณ'}`;
        }
    }
    
    // อัพเดทตัวอักษรแรกในอวตาร์
    const userAvatar = document.querySelector('.user-avatar span');
    if (userAvatar) {
        const firstChar = (userData.given_name || userData.name || userData.email || userData.username || '?').charAt(0).toUpperCase();
        userAvatar.textContent = firstChar;
    }
    
    // ตั้งค่า event listener สำหรับปุ่มออกจากระบบ
    const logoutButton = document.querySelector('.menu-item[href="login.html"]');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // ลบข้อมูลใน sessionStorage
            sessionStorage.removeItem('infohub_auth');
            sessionStorage.removeItem('infohub_access_token');
            sessionStorage.removeItem('infohub_refresh_token');
            sessionStorage.removeItem('infohub_user');
            
            // เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
            window.location.href = 'login.html';
        });
    }
}