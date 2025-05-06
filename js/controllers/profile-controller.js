/**
 * profile-controller.js
 * Controller สำหรับจัดการข้อมูลโปรไฟล์ผู้ใช้
 * ปรับปรุงให้ใช้ MockupService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

class ProfileController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // ตัวแปรเก็บข้อมูลผู้ใช้
    this.currentUser = null;
    
    // ตัวแปรเก็บข้อมูลสถิติ
    this.statistics = null;
    
    // Elements สำหรับแผนภูมิ
    this.performanceChart = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // โหลดข้อมูลผู้ใช้ปัจจุบัน
    await this.loadUserProfile();
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
    
    // สร้างแผนภูมิประสิทธิภาพ
    this.createPerformanceChart();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listener สำหรับปุ่มแสดงกิจกรรมทั้งหมด
    const viewMoreActivitiesButton = document.getElementById('view-more-activities');
    if (viewMoreActivitiesButton) {
      viewMoreActivitiesButton.addEventListener('click', () => {
        this.handleViewMoreActivities();
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
   * โหลดข้อมูลโปรไฟล์ผู้ใช้
   */
  async loadUserProfile() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึงข้อมูลผู้ใช้ปัจจุบันจาก Mockup Service
      this.currentUser = await mockupService.getCurrentUser();
      
      // ดึงข้อมูลสถิติจาก Mockup Service
      this.statistics = await mockupService.getStatistics();
      
      // ดึงรายการขายล่าสุดของผู้ใช้
      const sales = await mockupService.getSales();
      
      // แสดงข้อมูลโปรไฟล์
      this.renderUserProfile();
      
      // แสดงกิจกรรมล่าสุด
      this.renderRecentActivities(sales);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์');
      console.error('Error loading user profile:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูลโปรไฟล์ผู้ใช้
   */
  renderUserProfile() {
    if (!this.currentUser) return;
    
    // แสดงข้อมูลผู้ใช้ในส่วนหัวของโปรไฟล์
    const profileInfo = document.querySelector('.profile-info');
    if (profileInfo) {
      const fullName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      const jobTitle = `${this.currentUser.position} | ${this.currentUser.department}`;
      
      profileInfo.querySelector('h2').textContent = fullName;
      profileInfo.querySelector('.job-title').textContent = jobTitle;
      
      const contactInfo = profileInfo.querySelector('.profile-contact');
      if (contactInfo) {
        contactInfo.innerHTML = `
          <p><i class="fas fa-envelope"></i> ${this.currentUser.email}</p>
          <p><i class="fas fa-phone"></i> ${this.currentUser.phone}</p>
        `;
      }
    }
    
    // แสดงตัวอักษรแรกของชื่อในอวาตาร์
    const profileAvatars = document.querySelectorAll('.profile-avatar');
    profileAvatars.forEach(avatar => {
      const firstChar = this.currentUser.firstName.charAt(0);
      avatar.querySelector('span').textContent = firstChar;
    });
    
    // แสดงสถิติผลงาน
    if (this.statistics) {
      const statItems = document.querySelectorAll('.stat-item');
      if (statItems.length >= 3) {
        // สถิติการขายเดือนนี้
        statItems[0].querySelector('.stat-value').textContent = this.statistics.salesOverview.totalSales;
        
        // ยอดขายเดือนนี้
        statItems[1].querySelector('.stat-value').textContent = `฿${this.statistics.salesOverview.totalAmount.toLocaleString()}`;
        
        // อัตราความพึงพอใจ
        statItems[2].querySelector('.stat-value').textContent = `${this.statistics.salesOverview.conversionRate}%`;
      }
      
      // อัปเดตเป้าหมายเดือนนี้
      const targetProgress = document.querySelector('.progress-bar');
      if (targetProgress) {
        const completionRate = this.statistics.salesOverview.completionRate;
        targetProgress.style.width = `${completionRate}%`;
        targetProgress.textContent = `${completionRate}%`;
        
        const targetDetail = document.querySelector('.metric-detail');
        if (targetDetail) {
          targetDetail.textContent = `฿${this.statistics.salesOverview.totalAmount.toLocaleString()} จากเป้าหมาย ฿${this.statistics.salesOverview.targetAmount.toLocaleString()}`;
        }
      }
      
      // อัปเดตข้อมูลสรุปลูกค้า
      const summaryCards = document.querySelectorAll('.summary-card');
      if (summaryCards.length >= 4) {
        // จำนวนลูกค้าทั้งหมด
        summaryCards[0].querySelector('h3').textContent = '24';
        
        // จำนวนลูกค้าที่รอติดตาม
        summaryCards[1].querySelector('h3').textContent = '8';
        
        // จำนวนลูกค้าที่ปิดการขายแล้ว
        summaryCards[2].querySelector('h3').textContent = `${this.statistics.salesOverview.totalSales}`;
        
        // จำนวนลูกค้าประจำ
        summaryCards[3].querySelector('h3').textContent = '4';
      }
    }
  }
  
  /**
   * แสดงกิจกรรมล่าสุด
   * @param {Array} sales - รายการขายล่าสุด
   */
  renderRecentActivities(sales) {
    const activityTimeline = document.querySelector('.activity-timeline');
    if (!activityTimeline || !sales || sales.length === 0) return;
    
    // เรียงลำดับรายการขายตามวันที่ล่าสุด
    const sortedSales = [...sales].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 5); // เลือกเฉพาะ 5 รายการแรก
    
    // ล้างข้อมูลเดิม
    activityTimeline.innerHTML = '';
    
    // สร้างรายการกิจกรรมล่าสุด
    sortedSales.forEach(sale => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const saleDate = new Date(sale.date);
      const formattedDate = `${saleDate.getDate()} ${this.getThaiMonth(saleDate.getMonth())} ${saleDate.getFullYear() + 543}, ${this.formatTime(saleDate)}`;
      
      // กำหนดไอคอนตามสถานะการขาย
      let iconClass = '';
      switch (sale.status) {
        case 'ยืนยันการสั่งซื้อ': iconClass = 'sale'; break;
        case 'ส่งใบเสนอราคา': iconClass = 'document'; break;
        case 'สอบถามข้อมูล': iconClass = 'contact'; break;
        case 'ลูกค้าสนใจ': iconClass = 'customer'; break;
        default: iconClass = 'meeting'; break;
      }
      
      // กำหนดข้อความหัวข้อตามสถานะการขาย
      let activityTitle = '';
      switch (sale.status) {
        case 'ยืนยันการสั่งซื้อ': 
          activityTitle = `ปิดการขาย: ${sale.items[0].productName}`;
          break;
        case 'ส่งใบเสนอราคา': 
          activityTitle = `ส่งใบเสนอราคา: ${sale.items[0].productName}`;
          break;
        case 'สอบถามข้อมูล': 
          activityTitle = `สอบถามข้อมูล: ${sale.items[0].productName}`;
          break;
        case 'ลูกค้าสนใจ': 
          activityTitle = `ลูกค้าสนใจ: ${sale.items[0].productName}`;
          break;
        default: 
          activityTitle = `กิจกรรม: ${sale.items[0].productName}`;
          break;
      }
      
      // สร้าง HTML สำหรับรายการกิจกรรม
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
          <i class="fas fa-${this.getActivityIcon(sale.status)}"></i>
        </div>
        <div class="activity-content">
          <h3>${activityTitle}</h3>
          <p>ลูกค้า: ${sale.customerName}</p>
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      // เพิ่มรายการกิจกรรมไปยัง timeline
      activityTimeline.appendChild(activityItem);
    });
  }
  
  /**
   * สร้างแผนภูมิประสิทธิภาพ
   */
  createPerformanceChart() {
    if (!this.statistics) return;
    
    const chartCanvas = document.getElementById('performance-chart');
    if (!chartCanvas) return;
    
    // ตรวจสอบว่ามี Chart.js หรือไม่
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // ข้อมูลสำหรับแผนภูมิ
    const salesByMonth = this.statistics.salesByMonth;
    
    // สร้างแผนภูมิ
    this.performanceChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: salesByMonth.map(item => item.month),
        datasets: [{
          label: 'ยอดขาย (บาท)',
          data: salesByMonth.map(item => item.amount),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '฿' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return '฿' + context.raw.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * จัดการการดูกิจกรรมทั้งหมด
   */
  handleViewMoreActivities() {
    alert('กำลังเปิดหน้ากิจกรรมทั้งหมด...');
    // ในสถานการณ์จริงจะมีการเปิดหน้ากิจกรรมทั้งหมด
  }
  
  /**
   * แปลงเดือนเป็นภาษาไทย
   * @param {number} month - เดือน (0-11)
   * @returns {string} - ชื่อเดือนภาษาไทย
   */
  getThaiMonth(month) {
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return thaiMonths[month];
  }
  
  /**
   * แปลงเวลาเป็นรูปแบบ HH:MM น.
   * @param {Date} date - วันที่และเวลา
   * @returns {string} - เวลาในรูปแบบ HH:MM น.
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} น.`;
  }
  
  /**
   * ดึงไอคอนตามสถานะการขาย
   * @param {string} status - สถานะการขาย
   * @returns {string} - ชื่อไอคอน
   */
  getActivityIcon(status) {
    switch (status) {
      case 'ยืนยันการสั่งซื้อ': return 'shopping-cart';
      case 'ส่งใบเสนอราคา': return 'file-pdf';
      case 'สอบถามข้อมูล': return 'phone';
      case 'ลูกค้าสนใจ': return 'user-plus';
      default: return 'handshake';
    }
  }
}

// สร้าง instance ของ ProfileController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const profileController = new ProfileController();
});

export default ProfileController;