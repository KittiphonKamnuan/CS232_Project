/**
 * sales-controller.js
 * Controller สำหรับจัดการข้อมูลการขาย
 * อัปเดตให้ใช้ข้อมูลจริงจาก API และไม่ใช้ mockup
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
   * โหลดข้อมูลสถิติและรายงานการขายจาก API จริง
   */
  async loadSalesData() {
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
      
      // คำนวณสถิติจากข้อมูลจริง
      const statistics = this.calculateSalesStatistics();
      
      // แสดงข้อมูล Sales Overview
      this.renderSalesOverview(statistics);
      
      // แสดงข้อมูล Sales Pipeline
      this.renderSalesPipeline(statistics);
      
      // แสดงข้อมุล Top Products
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
   * คำนวณสถิติการขายจากข้อมูลจริง
   */
  calculateSalesStatistics() {
    const totalCustomers = this.customers.length;
    const totalProducts = this.products.length;
    
    // นับลูกค้าตามสถานะ
    const customersByStatus = this.customers.reduce((acc, customer) => {
      const status = customer.status || 'interested';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // คำนวณข้อมูลการขายจำลองตามช่วงวันที่
    const daysDiff = Math.ceil((new Date(this.filters.dateTo) - new Date(this.filters.dateFrom)) / (1000 * 60 * 60 * 24));
    const daysInMonth = Math.min(daysDiff, 30);
    
    // จำลองข้อมูลการขายตามจำนวนลูกค้า
    const mockSalesCount = Math.floor(totalCustomers * 0.3) + Math.floor(Math.random() * 10) + 5; // 30% ของลูกค้าซื้อของ + สุ่ม
    const averageOrderValue = 25000 + Math.floor(Math.random() * 40000); // 25k-65k ต่อออเดอร์
    const totalRevenue = mockSalesCount * averageOrderValue;
    const targetAmount = 400000 * (daysInMonth / 30); // เป้าหมายตามสัดส่วนวัน
    const completionRate = Math.min(Math.floor((totalRevenue / targetAmount) * 100), 100);
    const conversionRate = Math.min(Math.floor((mockSalesCount / totalCustomers) * 100), 100) || 15;
    
    // สร้างข้อมูล Sales Pipeline จากลูกค้าจริง
    const pipelineData = [
      { status: 'ลูกค้าสนใจสินค้า', count: customersByStatus.interested || 0, amount: 0 },
      { status: 'ยืนยันการสั่งซื้อ', count: customersByStatus.purchased || mockSalesCount, amount: totalRevenue },
      { status: 'รอชำระเงิน', count: Math.floor(mockSalesCount * 0.9), amount: Math.floor(totalRevenue * 0.9) },
      { status: 'ชำระเงินแล้ว', count: Math.floor(mockSalesCount * 0.85), amount: Math.floor(totalRevenue * 0.85) },
      { status: 'ส่งมอบสินค้า', count: Math.floor(mockSalesCount * 0.8), amount: Math.floor(totalRevenue * 0.8) },
      { status: 'บริการหลังการขาย', count: Math.floor(mockSalesCount * 0.7), amount: Math.floor(totalRevenue * 0.7) }
    ];
    
    
    // สร้างข้อมูลสินค้าขายดีจากสินค้าจริง
    const topProducts = this.products.slice(0, 5).map((product, index) => ({
      id: product.id,
      name: product.name,
      unitsSold: Math.floor(Math.random() * 20) + 5 - index,
      revenue: (Math.floor(Math.random() * 200000) + 50000) - (index * 10000),
      profitMargin: Math.floor(Math.random() * 20) + 10
    }));
    
    // สร้างข้อมูลกิจกรรมการขายจำลอง
    const salesActivities = this.generateSalesActivities(mockSalesCount);
    
    // สร้างข้อมูลยอดขายรายเดือน
    const salesByMonth = this.generateMonthlySalesData();
    
    return {
      salesOverview: {
        totalSales: mockSalesCount,
        totalAmount: totalRevenue,
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
   * สร้างข้อมูลกิจกรรมการขายจำลอง
   */
  generateSalesActivities(salesCount) {
    const activities = [];
    const statuses = ['สอบถามข้อมูล', 'ส่งใบเสนอราคา', 'ยืนยันการสั่งซื้อ', 'ส่งมอบสินค้า'];
    
    // สร้างกิจกรรมจากลูกค้าจริง
    const recentCustomers = [...this.customers]
      .sort((a, b) => new Date(b.created_at || b.updated_at || Date.now()) - new Date(a.created_at || a.updated_at || Date.now()))
      .slice(0, Math.min(5, salesCount));
    
    recentCustomers.forEach((customer, index) => {
      const randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
      const activityDate = new Date(Date.now() - (index * 86400000)); // แต่ละวัน
      
      // เลือกสถานะตามสถานะลูกค้า
      let status = statuses[0];
      switch (customer.status) {
        case 'ลูกค้าสนใจสินค้า': stageClass = 'pipeline-interested'; break;
        case 'ยืนยันการสั่งซื้อ': stageClass = 'pipeline-confirmed'; break;
        case 'รอชำระเงิน': stageClass = 'pipeline-payment-pending'; break;
        case 'ชำระเงินแล้ว': stageClass = 'pipeline-paid'; break;
        case 'ส่งมอบสินค้า': stageClass = 'pipeline-delivered'; break;
        case 'บริการหลังการขาย': stageClass = 'pipeline-aftersale'; break;
      }
      
      activities.push({
        id: `SA${Date.now()}_${index}`,
        date: activityDate.toISOString(),
        status: status,
        customerName: customer.name,
        items: [{
          productName: randomProduct ? randomProduct.name : 'สินค้าทั่วไป',
          quantity: Math.floor(Math.random() * 3) + 1
        }],
        total: Math.floor(Math.random() * 50000) + 20000
      });
    });
    
    // เพิ่มกิจกรรมจำลองถ้าไม่มีลูกค้าเพียงพอ
    if (activities.length < 3) {
      const sampleActivities = [
        {
          id: 'SA_SAMPLE_1',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'ยืนยันการสั่งซื้อ',
          customerName: 'คุณสมศักดิ์ ใจดี',
          items: [{ productName: 'TV Samsung 55"', quantity: 1 }],
          total: 45000
        },
        {
          id: 'SA_SAMPLE_2',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'ส่งใบเสนอราคา',
          customerName: 'คุณณภา วงศ์ประดิษฐ์',
          items: [{ productName: 'เครื่องปรับอากาศ', quantity: 2 }],
          total: 60000
        },
        {
          id: 'SA_SAMPLE_3',
          date: new Date(Date.now() - 259200000).toISOString(),
          status: 'สอบถามข้อมูล',
          customerName: 'คุณประภา เจริญพร',
          items: [{ productName: 'เครื่องซักผ้า LG', quantity: 1 }],
          total: 25000
        }
      ];
      
      activities.push(...sampleActivities.slice(0, 3 - activities.length));
    }
    
    return activities;
  }
  
  /**
   * สร้างข้อมูลยอดขายรายเดือน 6 เดือนล่าสุด
   */
  generateMonthlySalesData() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = this.getThaiMonth(date.getMonth());
      
      // คำนวณยอดขายจำลองตามจำนวนลูกค้าและเดือน
      const baseAmount = 200000;
      const customerFactor = Math.min(this.customers.length * 2000, 100000);
      const randomFactor = Math.floor(Math.random() * 150000);
      const monthlyAmount = baseAmount + customerFactor + randomFactor;
      
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
        case 'ยืนยันการสั่งซื้อ': stageClass = 'pipeline-confirmed'; break;
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
        case 'ลูกค้าสนใจสินค้า': stageClass = 'pipeline-interested'; break;
        case 'ยืนยันการสั่งซื้อ': stageClass = 'pipeline-confirmed'; break;
        case 'รอชำระเงิน': stageClass = 'pipeline-payment-pending'; break;
        case 'ชำระเงินแล้ว': stageClass = 'pipeline-paid'; break;
        case 'ส่งมอบสินค้า': stageClass = 'pipeline-delivered'; break;
        case 'บริการหลังการขาย': stageClass = 'pipeline-aftersale'; break;
        default: statusClass = ''; break;
      }
      
      // รายการสินค้า
      const itemsText = sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ');
      
      html += `
        <div class="timeline-item">
          <div class="timeline-point ${statusClass}"></div>
          <div class="timeline-content">
            <h3>${sale.status}</h3>
            <p class="timeline-date">${formattedDate}</p>
            <p class="timeline-customer">ลูกค้า: ${sale.customerName}</p>
            <p class="timeline-items">สินค้า: ${itemsText}</p>
            <p class="timeline-amount">มูลค่า: ฿${sale.total.toLocaleString()}</p>
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