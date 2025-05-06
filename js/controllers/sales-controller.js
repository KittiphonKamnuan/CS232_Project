/**
 * sales-controller.js
 * Controller สำหรับจัดการข้อมูลการขาย
 * ปรับปรุงให้ใช้ dataService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

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
    
    // ตัวแปรเก็บข้อมูลสถิติ
    this.statistics = null;
    
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
   * โหลดข้อมูลสถิติและรายงานการขาย
   */
  async loadSalesData() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึงข้อมูลสถิติจาก Mockup Service
      this.statistics = await dataService.getStatistics();
      
      // ดึงข้อมูลการขายตามช่วงวันที่
      const salesData = await dataService.getSales(this.filters);
      
      // แสดงข้อมูล Sales Overview
      this.renderSalesOverview();
      
      // แสดงข้อมูล Sales Pipeline
      this.renderSalesPipeline();
      
      // แสดงข้อมูล Top Products
      this.renderTopProducts();
      
      // แสดงข้อมูล Sales Activities
      this.renderSalesActivities(salesData);
      
      // สร้างแผนภูมิยอดขายรายเดือน
      this.createMonthlySalesChart();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการขาย');
      console.error('Error loading sales data:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูล Sales Overview
   */
  renderSalesOverview() {
    if (!this.salesOverviewContainer || !this.statistics) return;
    
    const salesOverview = this.statistics.salesOverview;
    
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
  renderSalesPipeline() {
    if (!this.salesPipelineContainer || !this.statistics) return;
    
    const salesPipeline = this.statistics.salesPipeline;
    
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
        case 'สอบถามข้อมูล': stageClass = 'pipeline-inquiry'; break;
        case 'ลูกค้าสนใจ': stageClass = 'pipeline-interested'; break;
        case 'ส่งใบเสนอราคา': stageClass = 'pipeline-quotation'; break;
        case 'ต่อรองราคา': stageClass = 'pipeline-negotiation'; break;
        case 'ยืนยันการสั่งซื้อ': stageClass = 'pipeline-confirmed'; break;
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
  renderTopProducts() {
    if (!this.topProductsContainer || !this.statistics) return;
    
    const topProducts = this.statistics.topProducts;
    
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
   * @param {Array} salesData - ข้อมูลการขาย
   */
  renderSalesActivities(salesData) {
    if (!this.salesActivitiesContainer || !salesData) return;
    
    // เรียงลำดับรายการขายตามวันที่ล่าสุด
    const sortedSales = [...salesData].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 5); // เลือกเฉพาะ 5 รายการแรก
    
    // ถ้าไม่มีข้อมูล
    if (sortedSales.length === 0) {
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
    
    sortedSales.forEach(sale => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const saleDate = new Date(sale.date);
      const formattedDate = `${saleDate.getDate()} ${this.getThaiMonth(saleDate.getMonth())} ${saleDate.getFullYear() + 543}, ${this.formatTime(saleDate)}`;
      
      // กำหนด CSS class ตามสถานะ
      let statusClass = '';
      switch (sale.status) {
        case 'สอบถามข้อมูล': statusClass = 'info'; break;
        case 'ลูกค้าสนใจ': statusClass = 'info'; break;
        case 'ส่งใบเสนอราคา': statusClass = 'warning'; break;
        case 'ต่อรองราคา': statusClass = 'warning'; break;
        case 'ยืนยันการสั่งซื้อ': statusClass = 'success'; break;
        case 'ส่งมอบสินค้า': statusClass = 'success'; break;
        case 'บริการหลังการขาย': statusClass = 'success'; break;
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
              <a href="sale-details.html?id=${sale.id}" class="btn btn-sm btn-outline">
                <i class="fas fa-eye"></i> ดูรายละเอียด
              </a>
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
  createMonthlySalesChart() {
    if (!this.statistics) return;
    
    const chartCanvas = document.getElementById('monthly-sales-chart');
    if (!chartCanvas) return;
    
    // ตรวจสอบว่ามี Chart.js หรือไม่
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // ข้อมูลสำหรับแผนภูมิ
    const salesByMonth = this.statistics.salesByMonth;
    
    // สร้างแผนภูมิ
    this.monthlySalesChart = new Chart(chartCanvas, {
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
    alert('กำลังเปิดรายงานเพิ่มเติม...');
    // ในสถานการณ์จริงจะมีการเปิดหน้ารายงานเพิ่มเติม
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