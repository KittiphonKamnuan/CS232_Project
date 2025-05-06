/**
 * settings-controller.js
 * Controller สำหรับจัดการการตั้งค่าระบบ
 * ปรับปรุงให้ใช้ MockupService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

class SettingsController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.successMessage = document.getElementById('success-message');
    
    // Tab Elements
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Form Elements
    this.profileForm = document.getElementById('profile-form');
    this.accountForm = document.getElementById('account-form');
    
    // User Configuration
    this.currentUser = null;
    this.userSettings = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // โหลดข้อมูลผู้ใช้และการตั้งค่า
    await this.loadUserSettings();
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listeners สำหรับปุ่ม Tab
    if (this.tabButtons) {
      this.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tab = button.getAttribute('data-tab');
          this.switchTab(tab);
        });
      });
    }
    
    // Event Listeners สำหรับฟอร์มโปรไฟล์
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }
    
    // Event Listeners สำหรับฟอร์มบัญชีผู้ใช้
    if (this.accountForm) {
      this.accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }
    
    // Event Listeners สำหรับปุ่มบันทึกการตั้งค่าการแจ้งเตือน
    const saveNotificationSettingsBtn = document.getElementById('save-notification-settings');
    if (saveNotificationSettingsBtn) {
      saveNotificationSettingsBtn.addEventListener('click', () => {
        this.handleSaveNotificationSettings();
      });
    }
    
    // Event Listeners สำหรับปุ่มบันทึกการตั้งค่าการแสดงผล
    const saveAppearanceSettingsBtn = document.getElementById('save-appearance-settings');
    if (saveAppearanceSettingsBtn) {
      saveAppearanceSettingsBtn.addEventListener('click', () => {
        this.handleSaveAppearanceSettings();
      });
    }
    
    // Event Listeners สำหรับปุ่มรีเซ็ตการตั้งค่าการแสดงผล
    const resetAppearanceSettingsBtn = document.getElementById('reset-appearance-settings');
    if (resetAppearanceSettingsBtn) {
      resetAppearanceSettingsBtn.addEventListener('click', () => {
        this.handleResetAppearanceSettings();
      });
    }
    
    // Event Listeners สำหรับปุ่มบันทึกการตั้งค่าทั่วไป
    const savePreferencesBtn = document.getElementById('save-preferences');
    if (savePreferencesBtn) {
      savePreferencesBtn.addEventListener('click', () => {
        this.handleSavePreferences();
      });
    }
    
    // Event Listeners สำหรับปุ่มรีเซ็ตการตั้งค่าทั่วไป
    const resetPreferencesBtn = document.getElementById('reset-preferences');
    if (resetPreferencesBtn) {
      resetPreferencesBtn.addEventListener('click', () => {
        this.handleResetPreferences();
      });
    }
    
    // Event Listeners สำหรับปุ่มดูประวัติการเข้าสู่ระบบ
    const viewLoginHistoryBtn = document.getElementById('view-login-history');
    if (viewLoginHistoryBtn) {
      viewLoginHistoryBtn.addEventListener('click', () => {
        this.handleViewLoginHistory();
      });
    }
    
    // Event Listeners สำหรับปุ่มเลือกไฟล์รูปโปรไฟล์
    const profileImageInput = document.getElementById('profile-image');
    const removeProfileImageBtn = document.getElementById('remove-profile-image');
    
    if (profileImageInput) {
      profileImageInput.addEventListener('change', () => {
        this.handleProfileImageChange();
      });
    }
    
    if (removeProfileImageBtn) {
      removeProfileImageBtn.addEventListener('click', () => {
        this.handleRemoveProfileImage();
      });
    }
    
    // Event Listeners สำหรับปุ่มเลือกธีม
    const themeOptions = document.querySelectorAll('.theme-option');
    if (themeOptions) {
      themeOptions.forEach(option => {
        option.addEventListener('click', () => {
          // ลบ class active จากทุกตัวเลือก
          themeOptions.forEach(opt => opt.classList.remove('active'));
          
          // เพิ่ม class active ให้กับตัวเลือกที่คลิก
          option.classList.add('active');
        });
      });
    }
    
    // Event Listeners สำหรับปุ่มเลือกการแสดงผลรายการ
    const displayOptions = document.querySelectorAll('.display-option');
    if (displayOptions) {
      displayOptions.forEach(option => {
        option.addEventListener('click', () => {
          // ลบ class active จากทุกตัวเลือก
          displayOptions.forEach(opt => opt.classList.remove('active'));
          
          // เพิ่ม class active ให้กับตัวเลือกที่คลิก
          option.classList.add('active');
        });
      });
    }
  }
  
  /**
   * แสดงสถานะกำลังโหลด
   */
  showLoading() {
    this.isLoading = true;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
  }
  
  /**
   * ซ่อนสถานะกำลังโหลด
   */
  hideLoading() {
    this.isLoading = false;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }
  
  /**
   * แสดงข้อความผิดพลาด
   * @param {string} message - ข้อความผิดพลาด
   */
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
      
      // ซ่อนข้อความหลังจาก 5 วินาที
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }
  
  /**
   * ซ่อนข้อความผิดพลาด
   */
  hideError() {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }
  
  /**
   * แสดงข้อความสำเร็จ
   * @param {string} message - ข้อความสำเร็จ
   */
  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.style.display = 'block';
      
      // ซ่อนข้อความหลังจาก 5 วินาที
      setTimeout(() => {
        this.hideSuccess();
      }, 5000);
    }
  }
  
  /**
   * ซ่อนข้อความสำเร็จ
   */
  hideSuccess() {
    if (this.successMessage) {
      this.successMessage.style.display = 'none';
    }
  }
  
  /**
   * สลับแท็บ
   * @param {string} tabName - ชื่อแท็บที่ต้องการสลับ
   */
  switchTab(tabName) {
    // ลบ class active จากทุกปุ่มและเนื้อหาแท็บ
    this.tabButtons.forEach(button => button.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));
    
    // เพิ่ม class active ให้กับปุ่มและเนื้อหาแท็บที่ต้องการ
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  }
  
  /**
   * โหลดข้อมูลผู้ใช้และการตั้งค่า
   */
  async loadUserSettings() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึงข้อมูลผู้ใช้ปัจจุบันจาก Mockup Service
      this.currentUser = await mockupService.getCurrentUser();
      
      // จำลองข้อมูลการตั้งค่าของผู้ใช้
      this.userSettings = {
        appearance: {
          theme: 'light',
          fontSize: 3,
          display: 'grid'
        },
        notifications: {
          app: true,
          email: true,
          customerFollowup: true,
          stock: true,
          promotion: true
        },
        preferences: {
          language: 'th',
          timeFormat: '24',
          saveSearchHistory: true,
          showRecentProducts: true,
          confirmDelete: true
        }
      };
      
      // แสดงข้อมูลผู้ใช้ในฟอร์ม
      this.populateUserForms();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า');
      console.error('Error loading user settings:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูลผู้ใช้ในฟอร์ม
   */
  populateUserForms() {
    if (!this.currentUser) return;
    
    // Form Elements - Profile
    const userNameInput = document.getElementById('user-name');
    const userEmailInput = document.getElementById('user-email');
    const userPhoneInput = document.getElementById('user-phone');
    const userPositionInput = document.getElementById('user-position');
    const userDepartmentInput = document.getElementById('user-department');
    
    // Form Elements - Account
    const userUsernameInput = document.getElementById('user-username');
    
    // Form Elements - Notifications
    const appNotificationsCheckbox = document.getElementById('app-notifications');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    const customerFollowupNotificationsCheckbox = document.getElementById('customer-followup-notifications');
    const stockNotificationsCheckbox = document.getElementById('stock-notifications');
    const promotionNotificationsCheckbox = document.getElementById('promotion-notifications');
    
    // Form Elements - Appearance
    const themeOptions = document.querySelectorAll('.theme-option');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const displayOptions = document.querySelectorAll('.display-option');
    
    // Form Elements - Preferences
    const languageSelect = document.getElementById('language-select');
    const timeFormatSelect = document.getElementById('time-format-select');
    const saveSearchHistoryCheckbox = document.getElementById('save-search-history');
    const showRecentProductsCheckbox = document.getElementById('show-recent-products');
    const confirmDeleteCheckbox = document.getElementById('confirm-delete');
    
    // แสดงข้อมูลโปรไฟล์
    if (userNameInput) userNameInput.value = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    if (userEmailInput) userEmailInput.value = this.currentUser.email;
    if (userPhoneInput) userPhoneInput.value = this.currentUser.phone;
    if (userPositionInput) userPositionInput.value = this.currentUser.position;
    if (userDepartmentInput) userDepartmentInput.value = this.currentUser.department;
    
    // แสดงข้อมูลบัญชี
    if (userUsernameInput) userUsernameInput.value = this.currentUser.username;
    
    // แสดงข้อมูลการแจ้งเตือน
    if (appNotificationsCheckbox) appNotificationsCheckbox.checked = this.userSettings.notifications.app;
    if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = this.userSettings.notifications.email;
    if (customerFollowupNotificationsCheckbox) customerFollowupNotificationsCheckbox.checked = this.userSettings.notifications.customerFollowup;
    if (stockNotificationsCheckbox) stockNotificationsCheckbox.checked = this.userSettings.notifications.stock;
    if (promotionNotificationsCheckbox) promotionNotificationsCheckbox.checked = this.userSettings.notifications.promotion;
    
    // แสดงข้อมูลการแสดงผล
    if (themeOptions) {
      themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === this.userSettings.appearance.theme) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    }
    
    if (fontSizeSlider) fontSizeSlider.value = this.userSettings.appearance.fontSize;
    
    if (displayOptions) {
      displayOptions.forEach(option => {
        if (option.getAttribute('data-display') === this.userSettings.appearance.display) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    }
    
    // แสดงข้อมูลการตั้งค่าทั่วไป
    if (languageSelect) languageSelect.value = this.userSettings.preferences.language;
    if (timeFormatSelect) timeFormatSelect.value = this.userSettings.preferences.timeFormat;
    if (saveSearchHistoryCheckbox) saveSearchHistoryCheckbox.checked = this.userSettings.preferences.saveSearchHistory;
    if (showRecentProductsCheckbox) showRecentProductsCheckbox.checked = this.userSettings.preferences.showRecentProducts;
    if (confirmDeleteCheckbox) confirmDeleteCheckbox.checked = this.userSettings.preferences.confirmDelete;
  }
  
  /**
   * จัดการการบันทึกข้อมูลโปรไฟล์
   */
  async handleSaveProfile() {
    try {
      this.showLoading();
      this.hideError();
      this.hideSuccess();
      
      // ดึงข้อมูลจากฟอร์ม
      const userName = document.getElementById('user-name').value;
      const userEmail = document.getElementById('user-email').value;
      const userPhone = document.getElementById('user-phone').value;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!userName || !userEmail) {
        throw new Error('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      }
      
      // จำลองการบันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // อัปเดตข้อมูลในตัวแปร
      const [firstName, ...lastNameParts] = userName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      this.currentUser.firstName = firstName;
      this.currentUser.lastName = lastName;
      this.currentUser.email = userEmail;
      this.currentUser.phone = userPhone;
      
      // แสดงข้อความสำเร็จ
      this.showSuccess('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลโปรไฟล์');
      console.error('Error saving profile:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการเปลี่ยนรหัสผ่าน
   */
  async handleChangePassword() {
    try {
      this.showLoading();
      this.hideError();
      this.hideSuccess();
      
      // ดึงข้อมูลจากฟอร์ม
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!currentPassword) {
        throw new Error('กรุณากรอกรหัสผ่านปัจจุบัน');
      }
      
      // ตรวจสอบรหัสผ่านใหม่หากมีการกรอก
      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน');
        }
        
        // ตรวจสอบความยาวรหัสผ่าน
        if (newPassword.length < 8) {
          throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        }
        
        // ตรวจสอบความซับซ้อนของรหัสผ่าน
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        
        if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars)) {
          throw new Error('รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข และอักขระพิเศษ');
        }
      }
      
      // จำลองการบันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ล้างค่าในฟอร์ม
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      
      // แสดงข้อความสำเร็จ
      this.showSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      console.error('Error changing password:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการบันทึกการตั้งค่าการแจ้งเตือน
   */
  async handleSaveNotificationSettings() {
    try {
      this.showLoading();
      this.hideError();
      this.hideSuccess();
      
      // ดึงข้อมูลจากฟอร์ม
      const appNotifications = document.getElementById('app-notifications').checked;
      const emailNotifications = document.getElementById('email-notifications').checked;
      const customerFollowupNotifications = document.getElementById('customer-followup-notifications').checked;
      const stockNotifications = document.getElementById('stock-notifications').checked;
      const promotionNotifications = document.getElementById('promotion-notifications').checked;
      
      // จำลองการบันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // อัปเดตข้อมูลในตัวแปร
      this.userSettings.notifications = {
        app: appNotifications,
        email: emailNotifications,
        customerFollowup: customerFollowupNotifications,
        stock: stockNotifications,
        promotion: promotionNotifications
      };
      
      // แสดงข้อความสำเร็จ
      this.showSuccess('บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว');
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าการแจ้งเตือน');
      console.error('Error saving notification settings:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการบันทึกการตั้งค่าการแสดงผล
   */
  async handleSaveAppearanceSettings() {
    try {
      this.showLoading();
      this.hideError();
      this.hideSuccess();
      
      // ดึงข้อมูลจากฟอร์ม
      const activeThemeOption = document.querySelector('.theme-option.active');
      const fontSizeSlider = document.getElementById('font-size-slider');
      const activeDisplayOption = document.querySelector('.display-option.active');
      
      const theme = activeThemeOption ? activeThemeOption.getAttribute('data-theme') : 'light';
      const fontSize = fontSizeSlider ? parseInt(fontSizeSlider.value) : 3;
      const display = activeDisplayOption ? activeDisplayOption.getAttribute('data-display') : 'grid';
      
      // จำลองการบันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // อัปเดตข้อมูลในตัวแปร
      this.userSettings.appearance = {
        theme,
        fontSize,
        display
      };
      
      // แสดงข้อความสำเร็จ
      this.showSuccess('บันทึกการตั้งค่าการแสดงผลเรียบร้อยแล้ว');
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าการแสดงผล');
      console.error('Error saving appearance settings:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการรีเซ็ตการตั้งค่าการแสดงผล
   */
  async handleResetAppearanceSettings() {
    try {
      this.showLoading();
      this.hideError();
      this.hideSuccess();
      
      // จำลองการรีเซ็ตข้อมูล
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // รีเซ็ตข้อมูลในตัวแปร
      this.userSettings.appearance = {
        theme: 'light',
        fontSize: 3,
        display: 'grid'
      };
      
      // อัปเดตการแสดงผลในฟอร์ม
      const themeOptions = document.querySelectorAll('.theme-option');
      if (themeOptions) {
        themeOptions.forEach(option => {
          if (option.getAttribute('data-theme') === 'light') {
            option.classList.add('active');
          } else {
            option.classList.remove('active');
          }
        });
      }
      
      const fontSizeSlider = document.getElementById('font-size-slider');
      if (fontSizeSlider) fontSizeSlider.value = 3;
      
      const displayOptions = document.querySelectorAll('.display-option');
      if (displayOptions) {
        displayOptions.forEach(option => {
          if (option.getAttribute('data-display') === 'grid') {
            option.classList.add('active');
          } else {
            option.classList.remove('active');
          }
        });
      }
      
      // แสดงข้อความสำเร็จ
      this.showSuccess('รีเซ็ตการตั้งค่าทั่วไปเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการรีเซ็ตการตั้งค่าทั่วไป');
      console.error('Error resetting preferences:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการดูประวัติการเข้าสู่ระบบ
   */
  handleViewLoginHistory() {
    // สร้างข้อมูลประวัติการเข้าสู่ระบบจำลอง
    const loginHistory = [
      {
        date: '20 เม.ย. 2568, 09:15 น.',
        device: 'Chrome บน Windows 10',
        ip: '203.145.92.168',
        location: 'กรุงเทพมหานคร, ประเทศไทย',
        status: 'สำเร็จ'
      },
      {
        date: '18 เม.ย. 2568, 14:22 น.',
        device: 'Safari บน iPhone',
        ip: '203.145.92.170',
        location: 'กรุงเทพมหานคร, ประเทศไทย',
        status: 'สำเร็จ'
      },
      {
        date: '15 เม.ย. 2568, 16:45 น.',
        device: 'Chrome บน Windows 10',
        ip: '203.145.92.168',
        location: 'กรุงเทพมหานคร, ประเทศไทย',
        status: 'สำเร็จ'
      },
      {
        date: '12 เม.ย. 2568, 11:05 น.',
        device: 'Firefox บน Windows 10',
        ip: '103.82.164.23',
        location: 'นนทบุรี, ประเทศไทย',
        status: 'ล้มเหลว'
      },
      {
        date: '10 เม.ย. 2568, 08:30 น.',
        device: 'Chrome บน Windows 10',
        ip: '203.145.92.168',
        location: 'กรุงเทพมหานคร, ประเทศไทย',
        status: 'สำเร็จ'
      }
    ];
    
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    // สร้าง HTML สำหรับประวัติการเข้าสู่ระบบ
    let loginHistoryHtml = '';
    loginHistory.forEach(history => {
      const statusClass = history.status === 'สำเร็จ' ? 'success' : 'error';
      
      loginHistoryHtml += `
        <tr>
          <td>${history.date}</td>
          <td>${history.device}</td>
          <td>${history.ip}</td>
          <td>${history.location}</td>
          <td><span class="status ${statusClass}">${history.status}</span></td>
        </tr>
      `;
    });
    
    // สร้าง HTML สำหรับ Modal
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>ประวัติการเข้าสู่ระบบ</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>วันที่และเวลา</th>
                  <th>อุปกรณ์</th>
                  <th>IP Address</th>
                  <th>ตำแหน่งที่ตั้ง</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${loginHistoryHtml}
              </tbody>
            </table>
          </div>
          
          <div class="form-help mt-4">
            <p><i class="fas fa-info-circle"></i> หากพบการเข้าสู่ระบบที่น่าสงสัย กรุณาเปลี่ยนรหัสผ่านทันที</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ปิด
          </button>
        </div>
      </div>
    `;
    
    // เพิ่ม Modal ไปยัง body
    document.body.appendChild(modal);
    
    // ตั้งค่า event listeners สำหรับปุ่มปิด Modal
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
  }
  
  /**
   * จัดการการเปลี่ยนรูปโปรไฟล์
   */
  handleProfileImageChange() {
    const profileImageInput = document.getElementById('profile-image');
    if (!profileImageInput?.files?.length) return;
    
    const file = profileImageInput.files[0];
    
    // ตรวจสอบประเภทไฟล์
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      this.showError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF)');
      return;
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('ขนาดไฟล์ไม่ควรเกิน 5MB');
      return;
    }
    
    // จำลองการอัปโหลดรูปภาพ
    const reader = new FileReader();
    reader.onload = (e) => {
      // อัปเดตรูปโปรไฟล์
      const profileAvatars = document.querySelectorAll('.profile-avatar');
      profileAvatars.forEach(avatar => {
        // ลบตัวอักษรเดิม
        avatar.querySelector('span').style.display = 'none';
        
        // ตรวจสอบว่ามีรูปภาพอยู่แล้วหรือไม่
        let img = avatar.querySelector('img');
        if (!img) {
          // สร้าง img element ใหม่
          img = document.createElement('img');
          avatar.appendChild(img);
        }
        
        // กำหนดรูปภาพ
        img.src = e.target.result;
        img.style.display = 'block';
      });
      
      this.showSuccess('อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว');
    };
    
    reader.readAsDataURL(file);
  }
  
  /**
   * จัดการการลบรูปโปรไฟล์
   */
  handleRemoveProfileImage() {
    // ลบรูปโปรไฟล์
    const profileAvatars = document.querySelectorAll('.profile-avatar');
    profileAvatars.forEach(avatar => {
      // ลบรูปภาพ
      const img = avatar.querySelector('img');
      if (img) {
        img.style.display = 'none';
      }
      
      // แสดงตัวอักษรแทน
      const span = avatar.querySelector('span');
      if (span) {
        span.style.display = 'block';
      }
    });
    
    // ล้างค่าใน input file
    const profileImageInput = document.getElementById('profile-image');
    if (profileImageInput) {
      profileImageInput.value = '';
    }
    
    this.showSuccess('ลบรูปโปรไฟล์เรียบร้อยแล้ว');
  }
}

// สร้าง instance ของ SettingsController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const settingsController = new SettingsController();
});

export default SettingsController