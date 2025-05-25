/**
 * sales-controller.js
 * Controller สำหรับจัดการข้อมูลการขาย
 * อัปเดตให้ใช้ข้อมูลจริงจาก API GetAllStatusTracking
 */

import dataService from '../services/data-service.js';

class SalesController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // Element ที่เกี่ยวข้องกับรายงานการขาย
    this.salesOverviewContainer = document.getElementById('sales-overview');
    this.salesPipelineContainer = document.getElementById('sales-pipeline');
    this.topProductsContainer = document.getElementById('top-products');
    this.salesActivitiesContainer = document.getElementById('sales-activities');
    
    // Element สำหรับแผนภูมิยอดขายรายเดือน
    this.monthlySalesChart = null;
    
    // Element สำหรับการกรองข้อมูลตามวันที่
    this.startDateInput = document.getElementById('start-date');
    this.endDateInput = document.getElementById('end-date');
    this.applyDateRangeButton = document.getElementById('apply-date-range');
    
    // Element สำหรับดูรายงานเพิ่มเติม
    this.viewMoreReportsButton = document.getElementById('view-more-reports');
    
    // ตัวแปรสำหรับการกรองข้อมูล
    this.filters = {
      dateFrom: null,
      dateTo: null
    };
    
    // ตัวแปรเก็บข้อมูลจริงจาก API
    this.customers = [];
    this.products = [];
    this.statusTrackingData = [];
    
    // กำหนด 5 สถานะหลัก
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
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // ตั้งค่าวันที่เริ่มต้นเป็นวันแรกของเดือนปัจจุบัน
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filters.dateFrom = firstDayOfMonth.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
    
    // ตั้งค่าค่าเริ่มต้นให้กับ input วันที่
    if (this.startDateInput) this.startDateInput.value = this.filters.dateFrom;
    if (this.endDateInput) this.endDateInput.value = this.filters.dateTo;
    
    // โหลดข้อมูลสถิติและรายงานการขาย
    await this.loadSalesData();
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listener สำหรับปุ่มกรองตามช่วงวันที่
    if (this.applyDateRangeButton) {
      this.applyDateRangeButton.addEventListener('click', () => {
        this.handleApplyDateRange();
      });
    }
    
    // Event Listener สำหรับปุ่มดูรายงานเพิ่มเติม
    if (this.viewMoreReportsButton) {
      this.viewMoreReportsButton.addEventListener('click', () => {
        this.handleViewMoreReports();
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
   * โหลดข้อมูลสถิติและรายงานการขายจาก API จริง
   */
  async loadSalesData() {
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
        console.log('Loaded customers for sales:', this.customers.length);
      } else {
        console.error('Failed to load customers:', customersResult.reason);
        this.customers = [];
      }
      
      // จัดการผลลัพธ์สินค้า
      if (productsResult.status === 'fulfilled') {
        this.products = productsResult.value || [];
        console.log('Loaded products for sales:', this.products.length);
      } else {
        console.error('Failed to load products:', productsResult.reason);
        this.products = [];
      }
      
      // จัดการผลลัพธ์ Status Tracking
      if (statusTrackingResult.status === 'fulfilled') {
        this.statusTrackingData = statusTrackingResult.value || [];
        console.log('Loaded status tracking data:', this.statusTrackingData.length);
      } else {
        console.error('Failed to load status tracking:', statusTrackingResult.reason);
        this.statusTrackingData = [];
      }
      
      // คำนวณสถิติจากข้อมูลจริง
      const statistics = this.calculateSalesStatistics();
      
      // แสดงข้อมูล Sales Overview
      this.renderSalesOverview(statistics);
      
      // แสดงข้อมูล Sales Pipeline
      this.renderSalesPipeline(statistics);
      
      // แสดงข้อมูล Top Products
      this.renderTopProducts(statistics);
      
      // แสดงข้อมูล Sales Activities
      this.renderSalesActivities(statistics);
      
      // สร้างแผนภูมิยอดขายรายเดือน
      this.createMonthlySalesChart(statistics);
      
    } catch (error) {
      this.showError('เกิดข้อผิดพลาดในการโหลดข้อมูลการขาย: ' + error.message);
      console.error('Error loading sales data:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * กรองข้อมูล Status Tracking ตามช่วงวันที่
   */
  filterStatusTrackingByDate(data) {
    if (!this.filters.dateFrom || !this.filters.dateTo) {
      return data;
    }
    
    const fromDate = new Date(this.filters.dateFrom);
    const toDate = new Date(this.filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // ตั้งเป็นสิ้นวัน
    
    return data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= fromDate && itemDate <= toDate;
    });
  }
  
  /**
   * คำนวณสถิติการขายจากข้อมูล Status Tracking จริง
   */
  calculateSalesStatistics() {
    // กรองข้อมูลตามช่วงวันที่
    const filteredData = this.filterStatusTrackingByDate(this.statusTrackingData);
    
    // คำนวณสถิติพื้นฐาน
    const totalCustomers = this.customers.length;
    const totalProducts = this.products.length;
    const totalStatusRecords = filteredData.length;
    
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
    
    // วิเคราะห์ข้อมูล Status Tracking
    filteredData.forEach(item => {
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
    
    // เป้าหมายยอดขาย (จำลอง)
    const daysDiff = Math.ceil((new Date(this.filters.dateTo) - new Date(this.filters.dateFrom)) / (1000 * 60 * 60 * 24));
    const targetAmount = 500000 * (daysDiff / 30); // เป้าหมาย 500k ต่อเดือน
    const completionRate = Math.min(Math.round((totalSalesAmount / targetAmount) * 100), 100);
    
    // สร้าง Sales Pipeline Data
    const pipelineData = [
      { 
        status: 'ลูกค้าสนใจสินค้า', 
        count: statusCounts['ลูกค้าสนใจสินค้า'], 
        amount: statusAmounts['ลูกค้าสนใจสินค้า'] 
      },
      { 
        status: 'รอชำระเงิน', 
        count: statusCounts['รอชำระเงิน'], 
        amount: statusAmounts['รอชำระเงิน'] 
      },
      { 
        status: 'ชำระเงินแล้ว', 
        count: statusCounts['ชำระเงินแล้ว'], 
        amount: statusAmounts['ชำระเงินแล้ว'] 
      },
      { 
        status: 'ส่งมอบสินค้า', 
        count: statusCounts['ส่งมอบสินค้า'], 
        amount: statusAmounts['ส่งมอบสินค้า'] 
      },
      { 
        status: 'บริการหลังการขาย', 
        count: statusCounts['บริการหลังการขาย'], 
        amount: statusAmounts['บริการหลังการขาย'] 
      }
    ];
    
    // สร้างข้อมูลสินค้าขายดีจากข้อมูลจริง
    const topProducts = this.calculateTopProductsFromStatusTracking(filteredData);
    
    // สร้างข้อมูลกิจกรรมการขาย
    const salesActivities = this.generateSalesActivitiesFromStatusTracking(filteredData);
    
    // สร้างข้อมูลยอดขายรายเดือน
    const salesByMonth = this.generateMonthlySalesFromStatusTracking();
    
    return {
      salesOverview: {
        totalSales: totalSalesCount,
        totalAmount: totalSalesAmount,
        averageOrderValue: averageOrderValue,
        completionRate: completionRate,
        conversionRate: conversionRate,
        totalCustomers: totalCustomers,
        totalProducts: totalProducts
      },
      salesPipeline: pipelineData,
      topProducts: topProducts,
      salesActivities: salesActivities,
      salesByMonth: salesByMonth
    };
  }
  
  /**
   * คำนวณสินค้าขายดีจากข้อมูล Status Tracking
   */
  calculateTopProductsFromStatusTracking(filteredData) {
    // สร้าง Map เพื่อรวมข้อมูลสินค้า
    const productMap = new Map();
    
    filteredData.forEach(item => {
      const productId = item.product_id;
      const productName = item.product_name;
      const quantity = item.quantity || 1;
      const revenue = (item.product_price || 0) * quantity;
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId);
        existing.unitsSold += quantity;
        existing.revenue += revenue;
      } else {
        productMap.set(productId, {
          id: productId,
          name: productName,
          unitsSold: quantity,
          revenue: revenue,
          profitMargin: Math.floor(Math.random() * 20) + 10 // จำลองกำไร
        });
      }
    });
    
    // แปลงเป็น Array และเรียงลำดับ
    return Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }
  
  /**
   * สร้างข้อมูลกิจกรรมการขายจาก Status Tracking
   */
  generateSalesActivitiesFromStatusTracking(filteredData) {
    // เรียงลำดับตามเวลาล่าสุด
    const sortedData = [...filteredData]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10); // แสดง 10 รายการล่าสุด
    
    return sortedData.map(item => ({
      id: item.state_id,
      date: item.created_at,
      status: this.statusMapping[item.customer_status] || 'ลูกค้าสนใจสินค้า',
      customerName: item.customer_name,
      items: [{
        productName: item.product_name,
        quantity: item.quantity || 1
      }],
      total: (item.product_price || 0) * (item.quantity || 1),
      notes: item.notes || ''
    }));
  }
  
  /**
   * สร้างข้อมูลยอดขายรายเดือนจาก Status Tracking
   */
  generateMonthlySalesFromStatusTracking() {
    const months = [];
    const currentDate = new Date();
    
    // สร้างข้อมูล 6 เดือนย้อนหลัง
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const monthName = this.getThaiMonth(date.getMonth());
      
      // กรองข้อมูลตามเดือน
      const monthlyData = this.statusTrackingData.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= date && itemDate < nextMonth;
      });
      
      // คำนวณยอดขายของเดือน
      const monthlyAmount = monthlyData.reduce((sum, item) => {
        return sum + ((item.product_price || 0) * (item.quantity || 1));
      }, 0);
      
      months.push({
        month: monthName,
        amount: monthlyAmount
      });
    }
    
    return months;
  }
  
  /**
   * แสดงข้อมูล Sales Overview
   */
  renderSalesOverview(statistics) {
    if (!this.salesOverviewContainer || !statistics) return;
    
    const salesOverview = statistics.salesOverview;
    
    // สร้าง HTML สำหรับ Sales Overview
    const html = `
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-content">
          <h3>${salesOverview.totalSales}</h3>
          <p>จำนวนการขาย</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <h3>฿${salesOverview.totalAmount.toLocaleString()}</h3>
          <p>ยอดขายรวม</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon warning">
          <i class="fas fa-chart-pie"></i>
        </div>
        <div class="stat-content">
          <h3>${salesOverview.completionRate}%</h3>
          <p>เป้าหมายเดือนนี้</p>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${salesOverview.completionRate}%"></div>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon info">
          <i class="fas fa-calculator"></i>
        </div>
        <div class="stat-content">
          <h3>฿${salesOverview.averageOrderValue.toLocaleString()}</h3>
          <p>มูลค่าเฉลี่ยต่อออเดอร์</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>${salesOverview.conversionRate}%</h3>
          <p>อัตราการปิดการขาย</p>
        </div>
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.salesOverviewContainer.innerHTML = html;
  }
  
  /**
   * แสดงข้อมูล Sales Pipeline
   */
  renderSalesPipeline(statistics) {
    if (!this.salesPipelineContainer || !statistics) return;
    
    const salesPipeline = statistics.salesPipeline;
    
    // หายอดรวมทั้งหมด
    const totalCount = salesPipeline.reduce((total, stage) => total + stage.count, 0);
    const totalAmount = salesPipeline.reduce((total, stage) => total + stage.amount, 0);
    
    // สร้าง HTML สำหรับ Sales Pipeline
    let html = '';
    
    salesPipeline.forEach(stage => {
      // คำนวณเปอร์เซ็นต์
      const countPercent = totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0;
      const amountPercent = totalAmount > 0 ? Math.round((stage.amount / totalAmount) * 100) : 0;
      
      // กำหนด CSS class ตามสถานะ
      let stageClass = '';
      switch (stage.status) {
        case 'ลูกค้าสนใจสินค้า': stageClass = 'pipeline-interested'; break;
        case 'รอชำระเงิน': stageClass = 'pipeline-payment-pending'; break;
        case 'ชำระเงินแล้ว': stageClass = 'pipeline-paid'; break;
        case 'ส่งมอบสินค้า': stageClass = 'pipeline-delivered'; break;
        case 'บริการหลังการขาย': stageClass = 'pipeline-aftersale'; break;
        default: stageClass = ''; break;
      }
      
      html += `
        <div class="pipeline-stage ${stageClass}">
          <div class="pipeline-header">
            <h3>${stage.status}</h3>
            <span class="pipeline-count">${stage.count}</span>
          </div>
          <div class="pipeline-body">
            <div class="pipeline-amount">฿${stage.amount.toLocaleString()}</div>
            <div class="pipeline-percent">${amountPercent}%</div>
          </div>
          <div class="pipeline-footer">
            <div class="pipeline-progress" style="width: ${countPercent}%"></div>
          </div>
        </div>
      `;
    });
    
    // แสดงผลลัพธ์
    this.salesPipelineContainer.innerHTML = html;
  }
  
  /**
   * แสดงข้อมูล Top Products
   */
  renderTopProducts(statistics) {
    if (!this.topProductsContainer || !statistics) return;
    
    const topProducts = statistics.topProducts;
    
    if (topProducts.length === 0) {
      this.topProductsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>ไม่มีข้อมูลสินค้าขายดีในช่วงเวลาที่เลือก</p>
        </div>
      `;
      return;
    }
    
    // สร้าง HTML สำหรับตาราง Top Products
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>สินค้า</th>
            <th>จำนวนที่ขายได้</th>
            <th>ยอดขาย</th>
            <th>กำไรขั้นต้น</th>
            <th>แนวโน้ม</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // สร้าง HTML สำหรับแต่ละสินค้า
    topProducts.forEach(product => {
      html += `
        <tr>
          <td>
            <div class="product-brief">
              <span>${product.name}</span>
            </div>
          </td>
          <td>${product.unitsSold} เครื่อง</td>
          <td>฿${product.revenue.toLocaleString()}</td>
          <td>${product.profitMargin}%</td>
          <td>
            <div class="trend-icon">
              <i class="fas fa-arrow-up trend-up"></i>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    // แสดงผลลัพธ์
    this.topProductsContainer.innerHTML = html;
  }
  
  /**
   * แสดงข้อมูล Sales Activities
   */
  renderSalesActivities(statistics) {
    if (!this.salesActivitiesContainer || !statistics) return;
    
    const salesActivities = statistics.salesActivities;
    
    // ถ้าไม่มีข้อมูล
    if (salesActivities.length === 0) {
      this.salesActivitiesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <p>ไม่มีกิจกรรมการขายในช่วงวันที่ที่เลือก</p>
        </div>
      `;
      return;
    }
    
    // สร้าง HTML สำหรับ Timeline
    let html = '';
    
    salesActivities.forEach(sale => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const saleDate = new Date(sale.date);
      const formattedDate = `${saleDate.getDate()} ${this.getThaiMonth(saleDate.getMonth())} ${saleDate.getFullYear() + 543}, ${this.formatTime(saleDate)}`;
      
      // กำหนด CSS class ตามสถานะ
      let statusClass = '';
      switch (sale.status) {
        case 'ลูกค้าสนใจสินค้า': statusClass = 'pipeline-interested'; break;
        case 'รอชำระเงิน': statusClass = 'pipeline-payment-pending'; break;
        case 'ชำระเงินแล้ว': statusClass = 'pipeline-paid'; break;
        case 'ส่งมอบสินค้า': statusClass = 'pipeline-delivered'; break;
        case 'บริการหลังการขาย': statusClass = 'pipeline-aftersale'; break;
        default: statusClass = ''; break;
      }
      
      // รายการสินค้า
      const itemsText = sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ');
      
      html += `
        <div class="timeline-item">
          <div class="timeline-point ${statusClass}"></div>
          <div class="timeline-content">
            <h3>${sale.status}</h3>
            <p class="timeline-items">สินค้า: ${itemsText}</p>
            <p class="timeline-amount">มูลค่า: ฿${sale.total.toLocaleString()}</p>
            ${sale.notes ? `<p class="timeline-notes">หมายเหตุ: ${sale.notes}</p>` : ''}
            <div class="timeline-actions">
              <button class="btn btn-sm btn-outline" onclick="alert('รายละเอียดการขาย ID: ${sale.id}')">
                <i class="fas fa-eye"></i> ดูรายละเอียด
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    // แสดงผลลัพธ์
    this.salesActivitiesContainer.innerHTML = html;
  }
  
  /**
   * สร้างแผนภูมิยอดขายรายเดือน
   */
  createMonthlySalesChart(statistics) {
    if (!statistics) return;
    
    const chartCanvas = document.getElementById('monthly-sales-chart');
    if (!chartCanvas) return;
    
    // ตรวจสอบว่ามี Chart.js หรือไม่
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // ข้อมูลสำหรับแผนภูมิ
    const salesByMonth = statistics.salesByMonth;
    
    // ลบแผนภูมิเดิมถ้ามี
    if (this.monthlySalesChart) {
      this.monthlySalesChart.destroy();
    }
    
    // สร้างแผนภูมิ
    this.monthlySalesChart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: salesByMonth.map(item => item.month),
        datasets: [{
          label: 'ยอดขาย (บาท)',
          data: salesByMonth.map(item => item.amount),
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
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
   * จัดการการกรองข้อมูลตามช่วงวันที่
   */
  handleApplyDateRange() {
    // ดึงค่าจาก input วันที่
    const startDate = this.startDateInput?.value;
    const endDate = this.endDateInput?.value;
    
    // ตรวจสอบว่ามีการระบุวันที่หรือไม่
    if (!startDate || !endDate) {
      alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    
    // ตรวจสอบว่าวันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
    if (startDate > endDate) {
      alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
      return;
    }
    
    // อัปเดตตัวกรองข้อมูล
    this.filters.dateFrom = startDate;
    this.filters.dateTo = endDate;
    
    // โหลดข้อมูลสถิติและรายงานการขายใหม่
    this.loadSalesData();
  }
  
  /**
   * จัดการการดูรายงานเพิ่มเติม
   */
  handleViewMoreReports() {
    // เปิดหน้าลูกค้าทั้งหมดเพื่อดูข้อมูลเพิ่มเติม
    window.location.href = 'customer-list.html';
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
}

// สร้าง instance ของ SalesController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const salesController = new SalesController();
});

export default SalesController;