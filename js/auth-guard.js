/**
 * InfoHub 360 - Authentication Guard
 * 
 * ไฟล์นี้ใช้สำหรับตรวจสอบการยืนยันตัวตนในหน้าที่ต้องการการยืนยันตัวตน
 * หากผู้ใช้ยังไม่ได้เข้าสู่ระบบ จะถูกเปลี่ยนเส้นทางไปยังหน้าล็อกอิน
 * อัปเดต: ใช้ Cognito User Attributes
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
 * อัพเดทข้อมูลผู้ใช้ในส่วนต่างๆ ของ UI (อัปเดตสำหรับ Cognito)
 */
function updateUserInfoUI() {
    // ดึงข้อมูลผู้ใช้จาก sessionStorage
    const userDataStr = sessionStorage.getItem('infohub_user');
    if (!userDataStr) return;
    
    try {
        const userData = JSON.parse(userDataStr);
        console.log('User data from Cognito:', userData);
        
        // อัพเดทชื่อผู้ใช้ในส่วน header
        const userGreeting = document.querySelector('.user-greeting');
        if (userGreeting) {
            // ใช้ข้อมูลจาก Cognito attributes
            let displayName = '';
            
            if (userData.name) {
                displayName = userData.name;
            } else if (userData.nickname) {
                displayName = userData.nickname;
            } else if (userData.email) {
                // ใช้ส่วนหน้าของอีเมลถ้าไม่มีชื่อ
                displayName = userData.email.split('@')[0];
            } else {
                displayName = 'ผู้ใช้งาน';
            }
            
            userGreeting.textContent = `สวัสดี, คุณ${displayName}`;
        }
        
        // อัพเดทตัวอักษรแรกในอวตาร์
        const userAvatar = document.querySelector('.user-avatar span');
        if (userAvatar) {
            let firstChar = 'U';
            
            if (userData.name) {
                firstChar = userData.name.charAt(0).toUpperCase();
            } else if (userData.nickname) {
                firstChar = userData.nickname.charAt(0).toUpperCase();
            } else if (userData.email) {
                firstChar = userData.email.charAt(0).toUpperCase();
            }
            
            userAvatar.textContent = firstChar;
        }
        
        // อัพเดทข้อมูลในโปรไฟล์ (ถ้าอยู่ในหน้าโปรไฟล์)
        updateProfilePageInfo(userData);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
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

/**
 * อัพเดทข้อมูลในหน้าโปรไฟล์
 */
function updateProfilePageInfo(userData) {
    // ตรวจสอบว่าอยู่ในหน้าโปรไฟล์หรือไม่
    if (!window.location.pathname.includes('profile.html')) return;
    
    // อัพเดทชื่อในหน้าโปรไฟล์
    const profileName = document.querySelector('.profile-info h2');
    if (profileName && userData.name) {
        profileName.textContent = `คุณ${userData.name}`;
    }
    
    // อัพเดทข้อมูลติดต่อ
    const profileContact = document.querySelector('.profile-contact');
    if (profileContact) {
        const email = userData.email || 'ไม่ระบุอีเมล';
        const phone = userData.phone_number || 'ไม่ระบุเบอร์โทร';
        
        profileContact.innerHTML = `
            <p><i class="fas fa-envelope"></i> ${email}</p>
            <p><i class="fas fa-phone"></i> ${phone}</p>
        `;
    }
    
    // อัพเดทรูปโปรไฟล์
    const profileAvatars = document.querySelectorAll('.profile-avatar span');
    profileAvatars.forEach(avatar => {
        let firstChar = 'U';
        
        if (userData.name) {
            firstChar = userData.name.charAt(0).toUpperCase();
        } else if (userData.nickname) {
            firstChar = userData.nickname.charAt(0).toUpperCase();
        } else if (userData.email) {
            firstChar = userData.email.charAt(0).toUpperCase();
        }
        
        avatar.textContent = firstChar;
    });
    
    // อัพเดทตำแหน่งงาน (ถ้ามี)
    const jobTitle = document.querySelector('.job-title');
    if (jobTitle) {
        jobTitle.textContent = 'พนักงานขาย | ฝ่ายขายอิเล็กทรอนิกส์';
    }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ปัจจุบัน
 */
function getCurrentUser() {
    const userDataStr = sessionStorage.getItem('infohub_user');
    if (!userDataStr) return null;
    
    try {
        return JSON.parse(userDataStr);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/**
 * ฟังก์ชันสำหรับอัพเดทข้อมูลผู้ใช้
 */
function updateUserData(newUserData) {
    try {
        sessionStorage.setItem('infohub_user', JSON.stringify(newUserData));
        updateUserInfoUI();
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        return false;
    }
}

// Export functions ที่อาจจะใช้ในไฟล์อื่น
window.InfoHubAuth = {
    getCurrentUser,
    updateUserData,
    updateUserInfoUI
};