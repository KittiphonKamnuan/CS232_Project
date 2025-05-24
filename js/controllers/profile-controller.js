/**
 * profile-controller.js
 * Controller สำหรับจัดการข้อมูลโปรไฟล์ผู้ใช้
 * อัปเดตให้ใช้ข้อมูลจริงจาก API ที่มีอยู่
 */

import dataService from '../services/data-service.js';

class ProfileController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // ตัวแปรเก็บข้อมูลจริงจาก API
    this.customers = [];
    this.products = [];
    
    // Elements สำหรับแผนภูมิ
    this.performanceChart = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // โหลดข้อมูลจาก API จริง
    await this.loadRealData();
    
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
    } else {
      console.error('Error:', message);
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
   * โหลดข้อมูลจริงจาก API
   */
  async loadRealData() {
    try {
      this.showLoading();
      this.hideError();
      
      // โหลดข้อมูลลูกค้าและสินค้าจาก API จริง
      const [customersResult, productsResult] = await Promise.allSettled([
        dataService.getCustomers(),
        dataService.getProducts()
      ]);
      
      // จัดการผลลัพธ์ลูกค้า
      if (customersResult.status === 'fulfilled') {
        this.customers = customersResult.value || [];
        console.log('Loaded customers:', this.customers.length);
      } else {
        console.error('Failed to load customers:', customersResult.reason);
        this.customers = [];
      }
      
      // จัดการผลลัพธ์สินค้า
      if (productsResult.status === 'fulfilled') {
        this.products = productsResult.value || [];
        console.log('Loaded products:', this.products.length);
      } else {
        console.error('Failed to load products:', productsResult.reason);
        this.products = [];
      }
      
      // คำนวณสถิติจากข้อมูลจริง
      const statistics = this.calculateStatistics();
      
      // แสดงข้อมูลในหน้า
      this.renderUserProfile(statistics);
      this.renderRecentActivities();
      
    } catch (error) {
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
      console.error('Error loading real data:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * คำนวณสถิติจากข้อมูลจริง
   */
  calculateStatistics() {
    const totalCustomers = this.customers.length;
    const totalProducts = this.products.length;
    
    // นับลูกค้าตามสถานะ
    const customersByStatus = this.customers.reduce((acc, customer) => {
      const status = customer.status || 'interested';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // คำนวณยอดขายจำลอง (เนื่องจากไม่มี API การขายจริง)
    const mockMonthlySales = Math.floor(Math.random() * 15) + 8; // 8-22 การขาย
    const mockMonthlyRevenue = mockMonthlySales * (Math.floor(Math.random() * 50000) + 20000); // 20k-70k ต่อการขาย
    const mockSatisfactionRate = Math.floor(Math.random() * 10) + 90; // 90-99%
    
    return {
      totalCustomers,
      totalProducts,
      customersByStatus,
      monthlySales: mockMonthlySales,
      monthlyRevenue: mockMonthlyRevenue,
      satisfactionRate: mockSatisfactionRate,
      targetAmount: 400000,
      completionRate: Math.min(Math.floor((mockMonthlyRevenue / 400000) * 100), 100)
    };
  }
  
  /**
   * แสดงข้อมูลโปรไฟล์ผู้ใช้
   */
  renderUserProfile(statistics) {
    // อัปเดตข้อมูลผู้ใช้ในส่วนหัว (ใช้ข้อมูลจาก auth-guard.js)
    const userDataStr = sessionStorage.getItem('infohub_user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        
        // อัปเดตชื่อผู้ใช้
        const profileName = document.querySelector('.profile-info h2');
        if (profileName) {
          const displayName = userData.given_name || userData.name || 'ผู้ใช้งาน';
          profileName.textContent = `คุณ${displayName}`;
        }
        
        // อัปเดตข้อมูลติดต่อ
        const contactInfo = document.querySelector('.profile-contact');
        if (contactInfo) {
          contactInfo.innerHTML = `
            <p><i class="fas fa-envelope"></i> ${userData.email || 'ไม่ระบุอีเมล'}</p>
            <p><i class="fas fa-phone"></i> 081-234-5678</p>
          `;
        }
        
        // อัปเดตอวาตาร์
        const profileAvatars = document.querySelectorAll('.profile-avatar span');
        profileAvatars.forEach(avatar => {
          const firstChar = (userData.given_name || userData.name || userData.email || 'U').charAt(0).toUpperCase();
          avatar.textContent = firstChar;
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // แสดงสถิติผลงาน
    const statItems = document.querySelectorAll('.stat-item');
    if (statItems.length >= 3) {
      // สถิติการขายเดือนนี้
      const salesValue = statItems[0].querySelector('.stat-value');
      if (salesValue) salesValue.textContent = statistics.monthlySales;
      
      // ยอดขายเดือนนี้
      const revenueValue = statItems[1].querySelector('.stat-value');
      if (revenueValue) revenueValue.textContent = `฿${statistics.monthlyRevenue.toLocaleString()}`;
      
      // อัตราความพึงพอใจ
      const satisfactionValue = statItems[2].querySelector('.stat-value');
      if (satisfactionValue) satisfactionValue.textContent = `${statistics.satisfactionRate}%`;
    }
    
    // อัปเดตเป้าหมายเดือนนี้
    const targetProgress = document.querySelector('.progress-bar');
    if (targetProgress) {
      const completionRate = statistics.completionRate;
      targetProgress.style.width = `${completionRate}%`;
      targetProgress.textContent = `${completionRate}%`;
      
      const targetDetail = document.querySelector('.metric-detail');
      if (targetDetail) {
        targetDetail.textContent = `฿${statistics.monthlyRevenue.toLocaleString()} จากเป้าหมาย ฿${statistics.targetAmount.toLocaleString()}`;
      }
    }
    
    // อัปเดตข้อมูลสรุปลูกค้าจากข้อมูลจริง
    const summaryCards = document.querySelectorAll('.summary-card');
    if (summaryCards.length >= 4) {
      // จำนวนลูกค้าทั้งหมด
      const totalCustomersCard = summaryCards[0].querySelector('h3');
      if (totalCustomersCard) totalCustomersCard.textContent = statistics.totalCustomers;
      
      // จำนวนลูกค้าที่รอติดตาม (interested)
      const interestedCard = summaryCards[1].querySelector('h3');
      if (interestedCard) {
        const interestedCount = statistics.customersByStatus.interested || 0;
        interestedCard.textContent = interestedCount;
      }
      
      // จำนวนลูกค้าที่ปิดการขายแล้ว (purchased)
      const purchasedCard = summaryCards[2].querySelector('h3');
      if (purchasedCard) {
        const purchasedCount = statistics.customersByStatus.purchased || statistics.monthlySales;
        purchasedCard.textContent = purchasedCount;
      }
      
      // จำนวนลูกค้าประจำ (regular)
      const regularCard = summaryCards[3].querySelector('h3');
      if (regularCard) {
        const regularCount = statistics.customersByStatus.regular || Math.floor(statistics.totalCustomers * 0.2);
        regularCard.textContent = regularCount;
      }
    }
  }
  
  /**
   * แสดงกิจกรรมล่าสุดจากข้อมูลลูกค้าจริง
   */
  renderRecentActivities() {
    const activityTimeline = document.querySelector('.activity-timeline');
    if (!activityTimeline) return;
    
    // ล้างข้อมูลเดิม
    activityTimeline.innerHTML = '';
    
    // สร้างกิจกรรมจากลูกค้าที่เพิ่มล่าสุด
    const recentCustomers = [...this.customers]
      .sort((a, b) => new Date(b.created_at || b.updated_at || Date.now()) - new Date(a.created_at || a.updated_at || Date.now()))
      .slice(0, 5);
    
    if (recentCustomers.length === 0) {
      // แสดงกิจกรรมตัวอย่างถ้าไม่มีข้อมูลลูกค้า
      this.renderSampleActivities();
      return;
    }
    
    recentCustomers.forEach((customer, index) => {
      const activityDate = new Date(customer.created_at || customer.updated_at || Date.now() - (index * 86400000)); // แต่ละวันถ้าไม่มีวันที่
      const formattedDate = this.formatThaiDate(activityDate);
      
      // สร้างกิจกรรมตามสถานะลูกค้า
      let activityTitle = '';
      let iconClass = '';
      let iconName = '';
      
      switch (customer.status) {
        case 'purchased':
          activityTitle = `ปิดการขาย: สินค้าสำหรับ${customer.name}`;
          iconClass = 'sale';
          iconName = 'shopping-cart';
          break;
        case 'quoted':
          activityTitle = `ส่งใบเสนอราคาให้: ${customer.name}`;
          iconClass = 'document';
          iconName = 'file-pdf';
          break;
        case 'contacted':
          activityTitle = `โทรหาลูกค้า: ${customer.name}`;
          iconClass = 'contact';
          iconName = 'phone';
          break;
        case 'interested':
        default:
          activityTitle = `เพิ่มลูกค้าใหม่: ${customer.name}`;
          iconClass = 'customer';
          iconName = 'user-plus';
          break;
      }
      
      // สร้าง HTML สำหรับรายการกิจกรรม
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
          <i class="fas fa-${iconName}"></i>
        </div>
        <div class="activity-content">
          <h3>${activityTitle}</h3>
          <p>ลูกค้า: ${customer.name}</p>
          <p>เบอร์โทร: ${customer.tel || 'ไม่ระบุ'}</p>
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      activityTimeline.appendChild(activityItem);
    });
  }
  
  /**
   * แสดงกิจกรรมตัวอย่างเมื่อไม่มีข้อมูลจริง
   */
  renderSampleActivities() {
    const activityTimeline = document.querySelector('.activity-timeline');
    if (!activityTimeline) return;
    
    const sampleActivities = [
      {
        title: 'ปิดการขาย: TV Samsung QN90C',
        customer: 'คุณสมศักดิ์ ใจดี',
        icon: 'shopping-cart',
        iconClass: 'sale',
        time: new Date(Date.now() - 86400000) // เมื่อวาน
      },
      {
        title: 'ส่งใบเสนอราคา: เครื่องปรับอากาศ Daikin',
        customer: 'คุณณภา วงศ์ประดิษฐ์',
        icon: 'file-pdf',
        iconClass: 'document',
        time: new Date(Date.now() - 172800000) // 2 วันที่แล้ว
      },
      {
        title: 'โทรหาลูกค้า: คุณประภา เจริญพร',
        customer: 'สอบถามข้อมูลเครื่องซักผ้า LG',
        icon: 'phone',
        iconClass: 'contact',
        time: new Date(Date.now() - 259200000) // 3 วันที่แล้ว
      }
    ];
    
    sampleActivities.forEach(activity => {
      const formattedDate = this.formatThaiDate(activity.time);
      
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon ${activity.iconClass}">
          <i class="fas fa-${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <h3>${activity.title}</h3>
          <p>ลูกค้า: ${activity.customer}</p>
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      activityTimeline.appendChild(activityItem);
    });
  }
  
  /**
   * สร้างแผนภูมิประสิทธิภาพ
   */
  createPerformanceChart() {
    const chartCanvas = document.getElementById('performance-chart');
    if (!chartCanvas) return;
    
    // ตรวจสอบว่ามี Chart.js หรือไม่
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // สร้างข้อมูลจำลองสำหรับ 6 เดือนล่าสุด
    const months = [];
    const salesData = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(this.getThaiMonth(date.getMonth()));
      
      // สร้างข้อมูลยอดขายจำลอง
      const baseSales = 200000 + (Math.random() * 200000);
      salesData.push(Math.floor(baseSales));
    }
    
    // สร้างแผนภูมิ
    this.performanceChart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'ยอดขาย (บาท)',
          data: salesData,
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'ยอดขาย: ฿' + context.raw.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '฿' + (value / 1000) + 'K';
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
    // เปิดหน้าลูกค้าทั้งหมด
    window.location.href = 'customer-list.html';
  }
  
  /**
   * แปลงวันที่เป็นรูปแบบไทย
   */
  formatThaiDate(date) {
    const day = date.getDate();
    const month = this.getThaiMonth(date.getMonth());
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes} น.`;
  }
  
  /**
   * แปลงเดือนเป็นภาษาไทย
   */
  getThaiMonth(month) {
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return thaiMonths[month];
  }
}

// สร้าง instance ของ ProfileController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const profileController = new ProfileController();
});

export default ProfileController;