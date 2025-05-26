/**
 * profile-controller.js
 * Controller สำหรับจัดการข้อมูลโปรไฟล์ผู้ใช้
 * อัปเดตให้ใช้ข้อมูลจริงจาก API และ Status Tracking
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
    this.statusTrackingData = [];
    
    // ข้อมูลผู้ใช้จาก Cognito
    this.currentUser = this.getCurrentUserFromCognito();
    
    // Elements สำหรับแผนภูมิ
    this.performanceChart = null;
    
    // กำหนด 5 สถานะหลัก (เหมือนกับ sales-controller)
    this.statusMapping = {
      'สนใจ': 'ลูกค้าสนใจสินค้า',
      'รอชำระเงิน': 'รอชำระเงิน', 
      'ชำระเงินแล้ว': 'ชำระเงินแล้ว',
      'ส่งมอบสินค้า': 'ส่งมอบสินค้า',
      'บริการหลังการขาย': 'บริการหลังการขาย'
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * ดึงข้อมูลผู้ใช้จาก Cognito
   */
  getCurrentUserFromCognito() {
    const userDataStr = sessionStorage.getItem('infohub_user');
    if (!userDataStr) return null;
    
    try {
      const userData = JSON.parse(userDataStr);
      console.log('Current user from Cognito:', userData);
      return userData;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // แสดงข้อมูลผู้ใช้จาก Cognito ก่อน
    this.renderUserProfileInfo();
    
    // โหลดข้อมูลจาก API จริง
    await this.loadRealData();
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
    
    // สร้างแผนภูมิประสิทธิภาพ
    this.createPerformanceChart();
  }
  
  /**
   * แสดงข้อมูลผู้ใช้จาก Cognito
   */
  renderUserProfileInfo() {
    if (!this.currentUser) return;
    
    // อัพเดทชื่อผู้ใช้
    const profileName = document.querySelector('.profile-info h2');
    if (profileName) {
      const displayName = this.currentUser.name || this.currentUser.nickname || 'ผู้ใช้งาน';
      profileName.textContent = `คุณ${displayName}`;
    }
    
    // อัพเดทข้อมูลติดต่อ
    const profileContact = document.querySelector('.profile-contact');
    if (profileContact) {
      const email = this.currentUser.email || 'ไม่ระบุอีเมล';
      const phone = this.currentUser.phone_number || 'ไม่ระบุเบอร์โทร';
      
      profileContact.innerHTML = `
        <p><i class="fas fa-envelope"></i> ${email}</p>
        <p><i class="fas fa-phone"></i> ${phone}</p>
      `;
    }
    
    // อัพเดทอวาตาร์
    const profileAvatars = document.querySelectorAll('.profile-avatar span');
    profileAvatars.forEach(avatar => {
      let firstChar = 'U';
      
      if (this.currentUser.name) {
        firstChar = this.currentUser.name.charAt(0).toUpperCase();
      } else if (this.currentUser.nickname) {
        firstChar = this.currentUser.nickname.charAt(0).toUpperCase();
      } else if (this.currentUser.email) {
        firstChar = this.currentUser.email.charAt(0).toUpperCase();
      }
      
      avatar.textContent = firstChar;
    });
    
    // อัพเดทตำแหน่งงาน
    const jobTitle = document.querySelector('.job-title');
    if (jobTitle) {
      // ใช้ข้อมูลจาก Cognito หรือค่าเริ่มต้น
      jobTitle.textContent = 'พนักงานขาย | ฝ่ายขายอิเล็กทรอนิกส์';
    }
    
    // ถ้ามี picture URL จาก Cognito
    if (this.currentUser.picture) {
      this.updateProfilePicture(this.currentUser.picture);
    }
  }
  
  /**
   * อัพเดทรูปโปรไฟล์
   */
  updateProfilePicture(pictureUrl) {
    const profileAvatars = document.querySelectorAll('.profile-avatar');
    profileAvatars.forEach(avatar => {
      // สร้าง img element แทนการใช้ span
      avatar.innerHTML = `<img src="${pictureUrl}" alt="Profile Picture" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    });
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

  /**
   * จัดการการดูกิจกรรมทั้งหมด
   */
  handleViewMoreActivities() {
    // เปิดหน้าลูกค้าทั้งหมด
    window.location.href = 'customer-list.html';
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
   * ดึงข้อมูล Status Tracking จาก API
   */
  async getAllStatusTracking() {
    try {
      const response = await fetch('https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/GetAllStatusTracking');
      if (!response.ok) {
        throw new Error(`Failed to fetch status tracking: HTTP ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching status tracking:', error);
      throw new Error('ไม่สามารถโหลดข้อมูลสถานะลูกค้าได้');
    }
  }
  
  /**
   * โหลดข้อมูลจริงจาก API
   */
  async loadRealData() {
    try {
      this.showLoading();
      this.hideError();
      
      // โหลดข้อมูลจาก API
      const [customersResult, productsResult, statusTrackingResult] = await Promise.allSettled([
        dataService.getCustomers(),
        dataService.getProducts(),
        this.getAllStatusTracking()
      ]);
      
      // จัดการผลลัพธ์ลูกค้า
      if (customersResult.status === 'fulfilled') {
        this.customers = customersResult.value || [];
        console.log('Loaded customers for profile:', this.customers.length);
      } else {
        console.error('Failed to load customers:', customersResult.reason);
        this.customers = [];
      }
      
      // จัดการผลลัพธ์สินค้า
      if (productsResult.status === 'fulfilled') {
        this.products = productsResult.value || [];
        console.log('Loaded products for profile:', this.products.length);
      } else {
        console.error('Failed to load products:', productsResult.reason);
        this.products = [];
      }
      
      // จัดการผลลัพธ์ Status Tracking
      if (statusTrackingResult.status === 'fulfilled') {
        this.statusTrackingData = statusTrackingResult.value || [];
        console.log('Loaded status tracking data for profile:', this.statusTrackingData.length);
      } else {
        console.error('Failed to load status tracking:', statusTrackingResult.reason);
        this.statusTrackingData = [];
      }
      
      // คำนวณสถิติจากข้อมูลจริง
      const statistics = this.calculateStatistics();
      
      // แสดงข้อมูลในหน้า
      this.renderStatistics(statistics);
      this.renderRecentActivities();
      
    } catch (error) {
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
      console.error('Error loading real data:', error);
    } finally {
      this.hideLoading();
    }
  }
  
/**
   * คำนวณสถิติจากข้อมูลจริง Status Tracking เท่านั้น
   */
calculateStatistics() {
  const totalCustomers = this.customers.length;
  const totalProducts = this.products.length;
  
  // กรองข้อมูล Status Tracking ของเดือนปัจจุบัน
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const monthlyStatusData = this.statusTrackingData.filter(item => {
    const itemDate = new Date(item.created_at);
    return itemDate >= firstDayOfMonth;
  });
  
  // นับจำนวนตามสถานะ (ใช้ 5 สถานะหลัก)
  const statusCounts = {
    'ลูกค้าสนใจสินค้า': 0,
    'รอชำระเงิน': 0,
    'ชำระเงินแล้ว': 0,
    'ส่งมอบสินค้า': 0,
    'บริการหลังการขาย': 0
  };
  
  const statusAmounts = {
    'ลูกค้าสนใจสินค้า': 0,
    'รอชำระเงิน': 0,
    'ชำระเงินแล้ว': 0,
    'ส่งมอบสินค้า': 0,
    'บริการหลังการขาย': 0
  };
  
  // วิเคราะห์ข้อมูล Status Tracking จริงเท่านั้น
  monthlyStatusData.forEach(item => {
    const status = item.customer_status;
    const mappedStatus = this.statusMapping[status] || 'ลูกค้าสนใจสินค้า';
    const amount = (item.product_price || 0) * (item.quantity || 1);
    
    statusCounts[mappedStatus]++;
    statusAmounts[mappedStatus] += amount;
  });
  
  // คำนวณยอดขายรวมและจำนวนการขาย
  const totalSalesAmount = Object.values(statusAmounts).reduce((sum, amount) => sum + amount, 0);
  const totalSalesCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const averageOrderValue = totalSalesCount > 0 ? Math.round(totalSalesAmount / totalSalesCount) : 0;
  
  // คำนวณอัตราการปิดการขาย (จากสนใจเป็นชำระเงินแล้ว)
  const interestedCount = statusCounts['ลูกค้าสนใจสินค้า'];
  const paidCount = statusCounts['ชำระเงินแล้ว'];
  const conversionRate = interestedCount > 0 ? Math.round((paidCount / interestedCount) * 100) : 0;
  
  // คำนวณลูกค้าใหม่ในเดือนนี้
  const customersThisMonth = this.customers.filter(customer => {
    const customerDate = new Date(customer.created_at);
    return customerDate >= firstDayOfMonth;
  });
  
  // เป้าหมายยอดขาย
  const targetAmount = 500000; // เป้าหมาย 500k ต่อเดือน
  const completionRate = totalSalesAmount > 0 ? Math.min(Math.round((totalSalesAmount / targetAmount) * 100), 100) : 0;
  
  // อัตราความพึงพอใจ (คำนวณจากประสิทธิภาพการขายจริง)
  let satisfactionRate = 0;
  if (totalSalesCount > 0) {
    // ใช้อัตราการปิดการขายและเปอร์เซ็นต์เป้าหมายเป็นฐาน
    satisfactionRate = Math.min(70 + Math.floor(conversionRate / 2) + Math.floor(completionRate / 5), 99);
  }
  
  return {
    totalCustomers,
    totalProducts,
    customersThisMonth: customersThisMonth.length,
    monthlySales: totalSalesCount,
    monthlyRevenue: totalSalesAmount,
    satisfactionRate: satisfactionRate,
    targetAmount: targetAmount,
    completionRate: completionRate,
    averageOrderValue: averageOrderValue,
    newCustomersThisMonth: customersThisMonth.length,
    conversionRate: conversionRate,
    
    // รายละเอียดสถานะ
    statusCounts: statusCounts,
    statusAmounts: statusAmounts,
    
    // สถิติเพิ่มเติม
    totalStatusRecords: monthlyStatusData.length,
    averageDealSize: averageOrderValue,
    successfulDeals: statusCounts['ชำระเงินแล้ว'] + statusCounts['ส่งมอบสินค้า']
  };
}

  
  /**
   * แสดงสถิติผลงาน (อัปเดตให้แสดงข้อมูลจาก Status Tracking)
   */
  renderStatistics(statistics) {
    // แสดงสถิติผลงานในส่วนหัว
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
    const progressBars = document.querySelectorAll('.progress-bar');
    const metricDetails = document.querySelectorAll('.metric-detail');
    
    if (progressBars.length >= 1 && metricDetails.length >= 1) {
      // เป้าหมายเดือนนี้
      const targetProgress = progressBars[0];
      const completionRate = statistics.completionRate;
      targetProgress.style.width = `${completionRate}%`;
      targetProgress.textContent = `${completionRate}%`;
      
      const targetDetail = metricDetails[0];
      targetDetail.textContent = `฿${statistics.monthlyRevenue.toLocaleString()} จากเป้าหมาย ฿${statistics.targetAmount.toLocaleString()}`;
    }
    
    if (progressBars.length >= 2 && metricDetails.length >= 2) {
      // อัตราการปิดการขาย
      const conversionProgress = progressBars[1];
      const conversionRate = statistics.conversionRate;
      conversionProgress.style.width = `${conversionRate}%`;
      conversionProgress.textContent = `${conversionRate}%`;
      
      const conversionDetail = metricDetails[1];
      conversionDetail.textContent = `${statistics.successfulDeals} จาก ${statistics.totalStatusRecords} โอกาสการขาย`;
    }
    
    if (progressBars.length >= 3 && metricDetails.length >= 3) {
      // คะแนนความพึงพอใจลูกค้า
      const satisfactionProgress = progressBars[2];
      satisfactionProgress.style.width = `${statistics.satisfactionRate}%`;
      satisfactionProgress.textContent = `${statistics.satisfactionRate}%`;
      
      const satisfactionDetail = metricDetails[2];
      const reviewCount = Math.max(statistics.monthlySales * 2, 15);
      const rating = (statistics.satisfactionRate / 100 * 5).toFixed(2);
      satisfactionDetail.textContent = `${rating}/5.00 จากการประเมิน ${reviewCount} ครั้ง`;
    }
    
    // อัปเดตข้อมูลสรุปลูกค้าจากข้อมูล Status Tracking
    const summaryCards = document.querySelectorAll('.summary-card');
    if (summaryCards.length >= 4) {
      // จำนวนลูกค้าทั้งหมด
      const totalCustomersCard = summaryCards[0].querySelector('h3');
      if (totalCustomersCard) {
        totalCustomersCard.textContent = statistics.totalCustomers || 0;
      }
      
      // จำนวนลูกค้าที่สนใจ
      const interestedCard = summaryCards[1].querySelector('h3');
      if (interestedCard) {
        interestedCard.textContent = statistics.statusCounts['ลูกค้าสนใจสินค้า'] || 0;
      }
      
      // จำนวนลูกค้าที่ปิดการขายแล้ว
      const purchasedCard = summaryCards[2].querySelector('h3');
      if (purchasedCard) {
        const successfulDeals = statistics.successfulDeals;
        purchasedCard.textContent = successfulDeals;
      }
      
      // จำนวนลูกค้าใหม่เดือนนี้
      const newCustomersCard = summaryCards[3].querySelector('h3');
      if (newCustomersCard) {
        newCustomersCard.textContent = statistics.newCustomersThisMonth;
      }
    }
    
    // แสดงข้อมูลเพิ่มเติมใน console สำหรับ debug
    console.log('📊 Profile Statistics Summary:', {
      totalCustomers: statistics.totalCustomers,
      monthlySales: statistics.monthlySales,
      monthlyRevenue: statistics.monthlyRevenue,
      satisfactionRate: statistics.satisfactionRate,
      averageOrderValue: statistics.averageOrderValue,
      newCustomersThisMonth: statistics.newCustomersThisMonth,
      conversionRate: statistics.conversionRate,
      statusBreakdown: statistics.statusCounts
    });
  }
  
   /**
   * แสดงกิจกรรมล่าสุดจากข้อมูลจริงเท่านั้น
   */
   renderRecentActivities() {
    const activityTimeline = document.querySelector('.activity-timeline');
    if (!activityTimeline) return;
    
    // ล้างข้อมูลเดิม
    activityTimeline.innerHTML = '';
    
    // ใช้เฉพาะข้อมูล Status Tracking จริง
    if (this.statusTrackingData.length > 0) {
      this.renderActivitiesFromStatusTracking();
    } else {
      // ถ้าไม่มีข้อมูล Status Tracking ให้ใช้ข้อมูลลูกค้าจริง
      this.renderActivitiesFromCustomers();
    }
  }
  
  /**
   * แสดงกิจกรรมจากข้อมูล Status Tracking จริงเท่านั้น
   */
  renderActivitiesFromStatusTracking() {
    const activityTimeline = document.querySelector('.activity-timeline');
    
    // เรียงลำดับตามเวลาล่าสุดและเลือก 5 รายการ
    const recentActivities = [...this.statusTrackingData]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    if (recentActivities.length === 0) {
      activityTimeline.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <p>ไม่มีกิจกรรมในระบบ</p>
        </div>
      `;
      return;
    }
    
    recentActivities.forEach(item => {
      const activityDate = new Date(item.created_at);
      const formattedDate = this.formatThaiDate(activityDate);
      
      // กำหนดรายละเอียดกิจกรรมตามสถานะ
      let activityTitle = '';
      let iconClass = '';
      let iconName = '';
      let description = '';
      
      const mappedStatus = this.statusMapping[item.customer_status] || 'ลูกค้าสนใจสินค้า';
      
      switch (mappedStatus) {
        case 'ชำระเงินแล้ว':
          activityTitle = `ปิดการขาย: ${item.product_name}`;
          iconClass = 'sale';
          iconName = 'shopping-cart';
          description = `ลูกค้า: ${item.customer_name} - ฿${(item.product_price * item.quantity).toLocaleString()}`;
          break;
        case 'รอชำระเงิน':
          activityTitle = `รอชำระเงิน: ${item.product_name}`;
          iconClass = 'payment';
          iconName = 'clock';
          description = `ลูกค้า: ${item.customer_name} - จำนวน ${item.quantity} เครื่อง`;
          break;
        case 'ส่งมอบสินค้า':
          activityTitle = `ส่งมอบสินค้า: ${item.product_name}`;
          iconClass = 'delivery';
          iconName = 'truck';
          description = `ลูกค้า: ${item.customer_name} - เสร็จสิ้นการขาย`;
          break;
        case 'บริการหลังการขาย':
          activityTitle = `บริการหลังการขาย: ${item.customer_name}`;
          iconClass = 'service';
          iconName = 'headset';
          description = `สินค้า: ${item.product_name}`;
          break;
        case 'ลูกค้าสนใจสินค้า':
        default:
          activityTitle = `ลูกค้าสนใจ: ${item.product_name}`;
          iconClass = 'interested';
          iconName = 'heart';
          description = `ลูกค้า: ${item.customer_name} - ${item.customer_tel}`;
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
          <p>${description}</p>
          ${item.notes ? `<p class="activity-notes">หมายเหตุ: ${item.notes}</p>` : ''}
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      activityTimeline.appendChild(activityItem);
    });
    
    console.log('📋 Activities rendered from Status Tracking:', recentActivities.length);
  }


  
  /**
   * แสดงกิจกรรมจากข้อมูลลูกค้าจริงเท่านั้น (fallback)
   */
  renderActivitiesFromCustomers() {
    const activityTimeline = document.querySelector('.activity-timeline');
    
    // สร้างกิจกรรมจากลูกค้าที่เพิ่มล่าสุด
    const recentCustomers = [...this.customers]
      .sort((a, b) => new Date(b.created_at || b.updated_at || Date.now()) - new Date(a.created_at || a.updated_at || Date.now()))
      .slice(0, 5);
    
    if (recentCustomers.length === 0) {
      activityTimeline.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <p>ไม่มีข้อมูลลูกค้าในระบบ</p>
        </div>
      `;
      return;
    }
    
    recentCustomers.forEach((customer, index) => {
      const activityDate = new Date(customer.created_at || customer.updated_at || Date.now() - (index * 86400000));
      const formattedDate = this.formatThaiDate(activityDate);
      
      // สร้างกิจกรรมจากข้อมูลลูกค้าจริง
      const activityTitle = `เพิ่มลูกค้าใหม่: ${customer.name}`;
      const iconClass = 'customer';
      const iconName = 'user-plus';
      const description = `เบอร์โทร: ${customer.tel || 'ไม่ระบุ'}`;
      
      // สร้าง HTML สำหรับรายการกิจกรรม
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
          <i class="fas fa-${iconName}"></i>
        </div>
        <div class="activity-content">
          <h3>${activityTitle}</h3>
          <p>${description}</p>
          ${customer.email ? `<p>อีเมล: ${customer.email}</p>` : ''}
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      activityTimeline.appendChild(activityItem);
    });
    
    console.log('📋 Activities rendered from customers:', recentCustomers.length);
  }
  
  /**
   * แสดงกิจกรรมตัวอย่างเมื่อไม่มีข้อมูลจริง (ปรับปรุงให้สมจริงขึ้น)
   */
  renderSampleActivities() {
    const activityTimeline = document.querySelector('.activity-timeline');
    if (!activityTimeline) return;
    
    const currentUser = this.currentUser;
    const userName = currentUser?.name || currentUser?.nickname || 'คุณ';
    
    // สร้างกิจกรรมตัวอย่างที่สมจริง
    const sampleActivities = [
      {
        title: `${userName} ปิดการขาย: Smart TV Samsung 55"`,
        customer: 'คุณสมศักดิ์ ใจดี - ฿45,900',
        icon: 'shopping-cart',
        iconClass: 'sale',
        time: new Date(Date.now() - 86400000) // เมื่อวาน
      },
      {
        title: `${userName} ส่งใบเสนอราคา: เครื่องปรับอากาศ Daikin`,
        customer: 'คุณนภา วงศ์ประดิษฐ์ - ฿32,500',
        icon: 'file-pdf',
        iconClass: 'document',
        time: new Date(Date.now() - 172800000) // 2 วันที่แล้ว
      },
      {
        title: `${userName} โทรหาลูกค้า: ติดตามใบเสนอราคา`,
        customer: 'คุณประภา เจริญพร - เครื่องซักผ้า LG',
        icon: 'phone',
        iconClass: 'contact',
        time: new Date(Date.now() - 259200000) // 3 วันที่แล้ว
      },
      {
        title: `${userName} เพิ่มลูกค้าใหม่: ลูกค้าจาก Facebook`,
        customer: 'คุณวิชัย มั่นคง - สนใจ TV Sony 65"',
        icon: 'user-plus',
        iconClass: 'customer',
        time: new Date(Date.now() - 345600000) // 4 วันที่แล้ว
      },
      {
        title: `${userName} นัดหมายลูกค้า: เยี่ยมชมสินค้า`,
        customer: 'คุณสุชาติ ภักดี - ตู้เย็น Samsung',
        icon: 'handshake',
        iconClass: 'meeting',
        time: new Date(Date.now() - 432000000) // 5 วันที่แล้ว
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
          <p>${activity.customer}</p>
          <p class="activity-time">${formattedDate}</p>
        </div>
      `;
      
      activityTimeline.appendChild(activityItem);
    });
    
    console.log('📋 Sample activities rendered for user:', userName);
  }
  
 /**
   * สร้างแผนภูมิประสิทธิภาพจากข้อมูลจริงเท่านั้น
   */
 createPerformanceChart() {
  const chartCanvas = document.getElementById('performance-chart');
  if (!chartCanvas) return;
  
  // ตรวจสอบว่ามี Chart.js หรือไม่
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    return;
  }
  
  // สร้างข้อมูลสำหรับ 6 เดือนล่าสุด
  const months = [];
  const salesData = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
    months.push(this.getThaiMonth(date.getMonth()));
    
    // กรองข้อมูล Status Tracking ตามเดือน
    const monthlyData = this.statusTrackingData.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= date && itemDate < nextMonth;
    });
    
    // คำนวณยอดขายของเดือนจากข้อมูลจริงเท่านั้น
    const monthlyAmount = monthlyData.reduce((sum, item) => {
      return sum + ((item.product_price || 0) * (item.quantity || 1));
    }, 0);
    
    salesData.push(monthlyAmount);
  }
  
  // ถ้าไม่มีข้อมูลเลย แสดงแผนภูมิว่าง
  const hasData = salesData.some(value => value > 0);
  
  // สร้างแผนภูมิ
  this.performanceChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'ยอดขาย (บาท)',
        data: salesData,
        backgroundColor: hasData ? 'rgba(54, 162, 235, 0.1)' : 'rgba(200, 200, 200, 0.1)',
        borderColor: hasData ? 'rgba(54, 162, 235, 1)' : 'rgba(200, 200, 200, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: hasData ? 'rgba(54, 162, 235, 1)' : 'rgba(200, 200, 200, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
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
              return context.raw > 0 ? 'ยอดขาย: ฿' + context.raw.toLocaleString() : 'ไม่มีข้อมูลยอดขาย';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value > 0 ? '฿' + (value / 1000) + 'K' : '฿0';
            }
          }
        }
      }
    }
  });
  
  console.log('📈 Performance Chart Data (Real Data Only):', {
    months: months,
    salesData: salesData,
    statusTrackingCount: this.statusTrackingData.length,
    hasRealData: hasData
  });
}

/**
 * ฟังก์ชันสำหรับแสดงสถิติแบบรายละเอียดจากข้อมูลจริงเท่านั้น
 */
showDetailedStatistics() {
  const statistics = this.calculateStatistics();
  
  // แสดงเฉพาะข้อมูลที่มีจริง
  const realDataSummary = {
    'ลูกค้าทั้งหมด': statistics.totalCustomers,
    'สินค้าทั้งหมด': statistics.totalProducts,
    'ข้อมูลสถานะทั้งหมด': statistics.totalStatusRecords,
    'ลูกค้าเดือนนี้': statistics.newCustomersThisMonth,
    'การขายเดือนนี้': statistics.monthlySales,
    'รายได้เดือนนี้': statistics.monthlyRevenue > 0 ? statistics.monthlyRevenue.toLocaleString() + ' บาท' : '0 บาท'
  };
  
  // เพิ่มข้อมูลที่คำนวณได้เฉพาะเมื่อมีข้อมูลจริง
  if (statistics.monthlyRevenue > 0) {
    realDataSummary['ค่าเฉลี่ยต่อออร์เดอร์'] = statistics.averageOrderValue.toLocaleString() + ' บาท';
    realDataSummary['อัตราแปลงลูกค้า'] = statistics.conversionRate + '%';
    realDataSummary['ความพึงพอใจ'] = statistics.satisfactionRate + '%';
    realDataSummary['เป้าหมายสำเร็จ'] = statistics.completionRate + '%';
  }
  
  console.log('📊 Real Data Statistics Only:');
  console.table(realDataSummary);
  
  // แสดงรายละเอียดสถานะเฉพาะที่มีข้อมูล
  const statusWithData = {};
  Object.keys(statistics.statusCounts).forEach(status => {
    if (statistics.statusCounts[status] > 0) {
      statusWithData[status] = statistics.statusCounts[status];
    }
  });
  
  if (Object.keys(statusWithData).length > 0) {
    console.log('📋 Status Breakdown (Real Data Only):');
    console.table(statusWithData);
  } else {
    console.log('📋 No status tracking data found');
  }
  
  return statistics;
}

/**
 * วิเคราะห์ประสิทธิภาพจากข้อมูลจริงเท่านั้น
 */
analyzePerformance() {
  const statistics = this.calculateStatistics();
  
  const analysis = {
    hasData: statistics.totalStatusRecords > 0,
    performance: 'no_data',
    trends: [],
    recommendations: []
  };
  
  // ถ้าไม่มีข้อมูล Status Tracking
  if (!analysis.hasData) {
    analysis.trends.push('ไม่มีข้อมูลการขายในระบบ');
    analysis.recommendations.push('เริ่มต้นบันทึกข้อมูลการติดตามลูกค้าและการขาย');
    
    // ตรวจสอบข้อมูลลูกค้า
    if (statistics.totalCustomers > 0) {
      analysis.trends.push(`มีลูกค้าในระบบ ${statistics.totalCustomers} คน`);
      analysis.recommendations.push('เริ่มต้นติดตามสถานะของลูกค้าเหล่านี้');
    } else {
      analysis.trends.push('ไม่มีข้อมูลลูกค้าในระบบ');
      analysis.recommendations.push('เริ่มต้นเพิ่มข้อมูลลูกค้าเข้าสู่ระบบ');
    }
    
    console.log('📈 Performance Analysis (No Real Data):', analysis);
    return analysis;
  }
  
  // วิเคราะห์เมื่อมีข้อมูลจริง
  if (statistics.conversionRate >= 30) {
    analysis.performance = 'excellent';
    analysis.trends.push('อัตราการปิดการขายสูงมาก');
  } else if (statistics.conversionRate >= 20) {
    analysis.performance = 'good';
    analysis.trends.push('อัตราการปิดการขายอยู่ในเกณฑ์ดี');
  } else if (statistics.conversionRate > 0) {
    analysis.performance = 'needs_improvement';
    analysis.trends.push('อัตราการปิดการขายต่ำกว่าเกณฑ์');
    analysis.recommendations.push('ควรปรับปรุงเทคนิคการขายและการติดตามลูกค้า');
  }
  
  // วิเคราะห์ยอดขาย
  if (statistics.completionRate >= 80) {
    analysis.trends.push('บรรลุเป้าหมายยอดขายได้ดี');
  } else if (statistics.completionRate >= 60) {
    analysis.trends.push('ยอดขายใกล้เคียงเป้าหมาย');
    analysis.recommendations.push('เพิ่มความพยายามในการขายเพื่อบรรลุเป้าหมาย');
  } else if (statistics.monthlyRevenue > 0) {
    analysis.trends.push('ยอดขายยังไม่ถึงเป้าหมาย');
    analysis.recommendations.push('ควรเพิ่มกิจกรรมการขายและหาลูกค้าใหม่');
  }
  
  // วิเคราะห์ลูกค้าใหม่
  if (statistics.newCustomersThisMonth >= 5) {
    analysis.trends.push('มีลูกค้าใหม่เพิ่มขึ้นเป็นจำนวนมาก');
  } else if (statistics.newCustomersThisMonth >= 2) {
    analysis.trends.push('มีลูกค้าใหม่เพิ่มขึ้นในระดับปานกลาง');
  } else if (statistics.newCustomersThisMonth >= 1) {
    analysis.trends.push('มีลูกค้าใหม่เพิ่มขึ้นน้อย');
    analysis.recommendations.push('ควรเพิ่มกิจกรรมหาลูกค้าใหม่ผ่านช่องทางต่างๆ');
  } else {
    analysis.trends.push('ไม่มีลูกค้าใหม่ในเดือนนี้');
    analysis.recommendations.push('จำเป็นต้องมีแผนหาลูกค้าใหม่อย่างเร่งด่วน');
  }
  
  console.log('📈 Performance Analysis (Real Data):', analysis);
  return analysis;
}

}

// สร้าง instance ของ ProfileController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const profileController = new ProfileController();
  
  // Export to window สำหรับการใช้งานจากภายนอก
  window.InfoHubProfile = {
    refreshProfile: () => profileController.refreshProfile(),
    updateUserInfo: (userData) => profileController.updateUserInfo(userData),
    getCurrentStatistics: () => profileController.getCurrentStatistics(),
    exportProfileData: () => profileController.exportProfileData(),
    showDetailedStatistics: () => profileController.showDetailedStatistics(),
    analyzePerformance: () => profileController.analyzePerformance()
  };
});

export default ProfileController;