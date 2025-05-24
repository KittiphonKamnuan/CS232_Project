/**
 * customer-controller.js
 * Controller สำหรับจัดการข้อมูลลูกค้า
 * ปรับปรุงให้ใช้ dataService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';

class CustomerController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // ตรวจสอบว่าเป็นหน้า customer-list หรือ customer-details
    this.isCustomerListPage = window.location.pathname.includes('customer-list.html');
    this.isCustomerDetailsPage = window.location.pathname.includes('customer-details.html');
    
    // Element ที่เกี่ยวข้องกับรายการลูกค้า
    this.customerListContainer = document.getElementById('customer-list');
    this.paginationContainer = document.getElementById('pagination-container');
    
    // Element ที่เกี่ยวข้องกับรายละเอียดลูกค้า
    this.customerDetailsContainer = document.getElementById('customer-details');
    
    // Element สำหรับการค้นหา
    this.searchForm = document.getElementById('search-form');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-button');
    this.keywordInput = document.getElementById('keyword');
    this.statusSelect = document.getElementById('status-select');
    
    // Element สำหรับการเพิ่มลูกค้า
    this.addCustomerButton = document.getElementById('add-customer-button');
    
    // ตัวแปรสำหรับการแบ่งหน้า
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
    
    // ตัวแปรสำหรับการกรองข้อมูล
    this.filters = {
      search: '',
      status: ''
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  init() {
    // โหลดข้อมูลตามหน้าที่กำลังเข้าชม
    if (this.isCustomerListPage) {
      this.loadCustomerList();
      this.setupEventListeners();
    } else if (this.isCustomerDetailsPage) {
      this.loadCustomerDetails();
    }
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listener สำหรับการค้นหา
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }
    
    if (this.searchButton) {
      this.searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }
    
    if (this.clearButton) {
      this.clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClearSearch();
      });
    }
    
    // Event Listener สำหรับการเพิ่มลูกค้า
    if (this.addCustomerButton) {
      this.addCustomerButton.addEventListener('click', () => {
        this.handleAddCustomer();
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
   * โหลดข้อมูลรายการลูกค้า
   */
  async loadCustomerList() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึงข้อมูลลูกค้าจาก Mockup Service
      const customers = await dataService.getCustomers(this.filters);
      
      // คำนวณจำนวนหน้าทั้งหมด
      this.totalPages = Math.ceil(customers.length / this.itemsPerPage);
      
      // แบ่งหน้าข้อมูล
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      // แสดงข้อมูลลูกค้า
      this.renderCustomerList(paginatedCustomers);
      
      // แสดงการแบ่งหน้า
      this.renderPagination();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดรายการลูกค้า');
      console.error('Error loading customer list:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.customerListContainer) {
        this.customerListContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>ไม่พบข้อมูลลูกค้า</p>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * โหลดข้อมูลรายละเอียดลูกค้า
   */
  async loadCustomerDetails() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึง ID ลูกค้าจาก URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get('id');
      
      if (!customerId) {
        throw new Error('ไม่พบรหัสลูกค้า');
      }
      
      // ดึงข้อมูลลูกค้าจาก Mockup Service
      const customer = await dataService.getCustomerById(customerId);
      
      // ดึงข้อมูลการขายของลูกค้า
      const customerSales = await dataService.getSales({ customerId });
      
      // ดึงข้อมูลเอกสารของลูกค้า
      const customerDocuments = await dataService.getDocuments({ customerId });
      
      // แสดงข้อมูลลูกค้า
      this.renderCustomerDetails(customer, customerSales, customerDocuments);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า');
      console.error('Error loading customer details:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.customerDetailsContainer) {
        this.customerDetailsContainer.innerHTML = `
          <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>ไม่พบข้อมูลลูกค้า</p>
            <a href="customer-list.html" class="btn btn-primary">กลับไปยังรายการลูกค้า</a>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูลรายการลูกค้า
   * @param {Array} customers - รายการลูกค้า
   */
  renderCustomerList(customers) {
    if (!this.customerListContainer) return;
    
    // ตรวจสอบว่ามีข้อมูลลูกค้าหรือไม่
    if (!customers || customers.length === 0) {
      this.customerListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      `;
      return;
    }
    
    // สร้าง HTML สำหรับตารางรายการลูกค้า
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ชื่อลูกค้า</th>
            <th>เบอร์โทรศัพท์</th>
            <th>อีเมล</th>
            <th>สถานะ</th>
            <th>วันที่ติดต่อล่าสุด</th>
            <th>การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // สร้าง HTML สำหรับแต่ละลูกค้า
    customers.forEach(customer => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const lastContactDate = new Date(customer.lastContact);
      const formattedDate = `${lastContactDate.getDate()}/${lastContactDate.getMonth() + 1}/${lastContactDate.getFullYear() + 543}`;
      
      // กำหนด CSS class ตามสถานะ
      let statusClass = '';
      switch (customer.status) {
        case 'สอบถามข้อมูล': statusClass = 'status-inquiry'; break;
        case 'ลูกค้าสนใจ': statusClass = 'status-interested'; break;
        case 'ส่งใบเสนอราคา': statusClass = 'status-quotation'; break;
        case 'ต่อรองราคา': statusClass = 'status-negotiation'; break;
        case 'ยืนยันการสั่งซื้อ': statusClass = 'status-confirmed'; break;
        case 'ส่งมอบสินค้า': statusClass = 'status-delivered'; break;
        case 'บริการหลังการขาย': statusClass = 'status-aftersale'; break;
        default: statusClass = ''; break;
      }
      
      html += `
        <tr>
          <td>
            <a href="customer-details.html?id=${customer.id}" class="customer-name">
              ${customer.name}
            </a>
          </td>
          <td>${customer.phone}</td>
          <td>${customer.email}</td>
          <td><span class="status ${statusClass}">${customer.status}</span></td>
          <td>${formattedDate}</td>
          <td>
            <div class="action-buttons">
              <a href="customer-details.html?id=${customer.id}" class="btn-icon" title="ดูรายละเอียด">
                <i class="fas fa-eye"></i>
              </a>
              <a href="sale-details.html?action=new&customer=${customer.id}" class="btn-icon" title="เพิ่มการขาย">
                <i class="fas fa-shopping-cart"></i>
              </a>
              <button class="btn-icon send-email" data-customer-id="${customer.id}" title="ส่งอีเมล">
                <i class="fas fa-envelope"></i>
              </button>
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
    this.customerListContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มส่งอีเมล
    const sendEmailButtons = document.querySelectorAll('.send-email');
    sendEmailButtons.forEach(button => {
      button.addEventListener('click', () => {
        const customerId = button.getAttribute('data-customer-id');
        alert(`ส่งอีเมลไปยังลูกค้ารหัส ${customerId}`);
      });
    });
  }
  
  /**
   * แสดงการแบ่งหน้า
   */
  renderPagination() {
    if (!this.paginationContainer) return;
    
    // ไม่แสดงการแบ่งหน้าถ้ามีเพียงหน้าเดียว
    if (this.totalPages <= 1) {
      this.paginationContainer.innerHTML = '';
      return;
    }
    
    let html = `
      <div class="pagination">
        <button class="pagination-button ${this.currentPage === 1 ? 'disabled' : ''}" 
                ${this.currentPage === 1 ? 'disabled' : ''} 
                data-page="prev">
          <i class="fas fa-chevron-left"></i> ก่อนหน้า
        </button>
        
        <div class="pagination-pages">
    `;
    
    // แสดงเลขหน้า
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="pagination-button ${i === this.currentPage ? 'active' : ''}" 
                data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    html += `
        </div>
        
        <button class="pagination-button ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                data-page="next">
          ถัดไป <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.paginationContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มแบ่งหน้า
    const paginationButtons = document.querySelectorAll('.pagination-button');
    paginationButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        
        const page = button.getAttribute('data-page');
        
        if (page === 'prev') {
          this.currentPage--;
        } else if (page === 'next') {
          this.currentPage++;
        } else {
          this.currentPage = parseInt(page);
        }
        
        this.loadCustomerList();
      });
    });
  }
  
  /**
   * แสดงข้อมูลรายละเอียดลูกค้า
   * @param {Object} customer - ข้อมูลลูกค้า
   * @param {Array} sales - รายการขายของลูกค้า
   * @param {Array} documents - รายการเอกสารของลูกค้า
   */
  async renderCustomerDetails(customer, sales, documents) {
    if (!this.customerDetailsContainer) return;
    
    // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
    const dateCreated = new Date(customer.dateCreated);
    const formattedDateCreated = `${dateCreated.getDate()}/${dateCreated.getMonth() + 1}/${dateCreated.getFullYear() + 543}`;
    
    const lastContact = new Date(customer.lastContact);
    const formattedLastContact = `${lastContact.getDate()}/${lastContact.getMonth() + 1}/${lastContact.getFullYear() + 543}`;
    
    // กำหนด CSS class ตามสถานะ
    let statusClass = '';
    switch (customer.status) {
      case 'สอบถามข้อมูล': statusClass = 'status-inquiry'; break;
      case 'ลูกค้าสนใจ': statusClass = 'status-interested'; break;
      case 'ส่งใบเสนอราคา': statusClass = 'status-quotation'; break;
      case 'ต่อรองราคา': statusClass = 'status-negotiation'; break;
      case 'ยืนยันการสั่งซื้อ': statusClass = 'status-confirmed'; break;
      case 'ส่งมอบสินค้า': statusClass = 'status-delivered'; break;
      case 'บริการหลังการขาย': statusClass = 'status-aftersale'; break;
      default: statusClass = ''; break;
    }
    
    // สร้าง HTML แท็กจากข้อมูล tags ของลูกค้า
    const tagsHtml = customer.tags ? customer.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    
    // ดึงข้อมูลสินค้าที่สนใจ
    const interestedProductsHtml = await this.renderInterestedProducts(customer.interestedProducts);
    
    // สร้าง HTML สำหรับรายละเอียดลูกค้า
    const html = `
      <div class="customer-details">
        <div class="customer-header">
          <div class="customer-info">
            <h1>${customer.name}</h1>
            <p class="customer-id">รหัสลูกค้า: ${customer.id}</p>
            <div class="customer-status">
              <span class="status ${statusClass}">${customer.status}</span>
              ${tagsHtml}
            </div>
          </div>
          
          <div class="customer-actions">
            <button class="btn btn-primary" id="create-sale-btn">
              <i class="fas fa-shopping-cart"></i> สร้างการขาย
            </button>
            <button class="btn btn-outline" id="update-status-btn">
              <i class="fas fa-sync-alt"></i> อัปเดตสถานะ
            </button>
            <button class="btn btn-outline" id="edit-customer-btn">
              <i class="fas fa-edit"></i> แก้ไขข้อมูล
            </button>
          </div>
        </div>
        
        <div class="customer-content">
          <div class="customer-details-grid">
            <!-- ข้อมูลติดต่อ -->
            <div class="detail-card">
              <div class="card-header">
                <h2><i class="fas fa-address-card"></i> ข้อมูลติดต่อ</h2>
              </div>
              <div class="card-body">
                <p><strong>เบอร์โทรศัพท์:</strong> <a href="tel:${customer.phone}">${customer.phone}</a></p>
                <p><strong>อีเมล:</strong> <a href="mailto:${customer.email}">${customer.email}</a></p>
                <p><strong>ที่อยู่:</strong> ${customer.address}</p>
                <div class="contact-actions">
                  <button class="btn btn-sm btn-outline">
                    <i class="fas fa-phone"></i> โทร
                  </button>
                  <button class="btn btn-sm btn-outline">
                    <i class="fas fa-envelope"></i> อีเมล
                  </button>
                  <button class="btn btn-sm btn-outline">
                    <i class="fab fa-line"></i> LINE
                  </button>
                </div>
              </div>
            </div>
            
            <!-- ข้อมูลการติดตาม -->
            <div class="detail-card">
              <div class="card-header">
                <h2><i class="fas fa-history"></i> ข้อมูลการติดตาม</h2>
              </div>
              <div class="card-body">
                <p><strong>วันที่เพิ่มข้อมูล:</strong> ${formattedDateCreated}</p>
                <p><strong>วันที่ติดต่อล่าสุด:</strong> ${formattedLastContact}</p>
                <p><strong>สถานะปัจจุบัน:</strong> <span class="status ${statusClass}">${customer.status}</span></p>
                <p><strong>บันทึกเพิ่มเติม:</strong></p>
                <div class="customer-notes">${customer.notes || 'ไม่มีบันทึก'}</div>
              </div>
            </div>
            
            <!-- สินค้าที่สนใจ -->
            <div class="detail-card">
              <div class="card-header">
                <h2><i class="fas fa-star"></i> สินค้าที่สนใจ</h2>
              </div>
              <div class="card-body">
                <div class="interested-products">
                  ${interestedProductsHtml}
                </div>
              </div>
            </div>
            
            <!-- การวิเคราะห์ลูกค้า -->
            <div class="detail-card">
              <div class="card-header">
                <h2><i class="fas fa-chart-pie"></i> การวิเคราะห์ลูกค้า</h2>
              </div>
              <div class="card-body">
                <p><strong>ประเภทลูกค้า:</strong> ${customer.tags?.includes('ลูกค้าประจำ') ? 'ลูกค้าประจำ' : 'ลูกค้าใหม่'}</p>
                <p><strong>มูลค่าการซื้อทั้งหมด:</strong> ${this.calculateTotalSales(sales)} บาท</p>
                <p><strong>จำนวนครั้งที่ซื้อ:</strong> ${sales.length} ครั้ง</p>
                <p><strong>โอกาสปิดการขาย:</strong> ${this.calculateSalesProbability(customer.status)}%</p>
              </div>
            </div>
          </div>
          
          <!-- ประวัติการขาย -->
          <div class="card">
            <h2><i class="fas fa-shopping-cart"></i> ประวัติการขาย</h2>
            
            ${this.renderSalesHistory(sales)}
          </div>
          
          <!-- เอกสารที่เกี่ยวข้อง -->
          <div class="card">
            <h2><i class="fas fa-file-alt"></i> เอกสารที่เกี่ยวข้อง</h2>
            
            ${this.renderDocuments(documents)}
          </div>
          
          <!-- บันทึกและการติดตาม -->
          <div class="card">
            <h2><i class="fas fa-comments"></i> บันทึกและการติดตาม</h2>
            
            <div class="follow-up-form">
              <textarea placeholder="เพิ่มบันทึกหรือการติดตามใหม่..."></textarea>
              <button class="btn btn-primary">
                <i class="fas fa-plus"></i> เพิ่มบันทึก
              </button>
            </div>
            
            <div class="follow-up-list">
              <!-- จะมีการเพิ่มข้อมูลจริงในอนาคต -->
              <div class="empty-state">
                <i class="fas fa-comment-alt"></i>
                <p>ไม่มีบันทึกการติดตาม</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.customerDetailsContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มต่างๆ
    document.getElementById('create-sale-btn')?.addEventListener('click', () => {
      window.location.href = `sale-details.html?action=new&customer=${customer.id}`;
    });
    
    document.getElementById('update-status-btn')?.addEventListener('click', () => {
      this.showUpdateStatusModal(customer);
    });
    
    document.getElementById('edit-customer-btn')?.addEventListener('click', () => {
      this.showEditCustomerModal(customer);
    });
  }
  
  /**
   * สร้าง HTML สำหรับรายการสินค้าที่สนใจ
   * @param {Array} productIds - รายการรหัสสินค้าที่สนใจ
   * @returns {string} - HTML string
   */
  async renderInterestedProducts(productIds) {
    if (!productIds || productIds.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-star"></i>
          <p>ไม่มีสินค้าที่สนใจ</p>
        </div>
      `;
    }
    
    try {
      // สร้าง HTML สำหรับแต่ละสินค้าที่สนใจ
      let html = '';
      
      for (const productId of productIds) {
        try {
          // ดึงข้อมูลสินค้าจาก Mockup Service
          const product = await dataService.getProductById(productId);
          
          html += `
            <div class="interested-product">
              <div class="product-image">
                <img src="${product.images[0] || '/api/placeholder/50/50'}" alt="${product.name}">
              </div>
              <div class="product-info">
                <a href="product-details.html?id=${product.id}" class="product-name">${product.name}</a>
                <p class="product-price">฿${product.price.toLocaleString()}</p>
              </div>
            </div>
          `;
        } catch (error) {
          // ถ้าไม่พบสินค้า ข้ามไป
          console.error(`Error loading product ${productId}:`, error);
        }
      }
      
      return html || `
        <div class="empty-state">
          <i class="fas fa-star"></i>
          <p>ไม่สามารถโหลดข้อมูลสินค้าที่สนใจ</p>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering interested products:', error);
      return `
        <div class="empty-state">
          <i class="fas fa-star"></i>
          <p>ไม่สามารถโหลดข้อมูลสินค้าที่สนใจ</p>
        </div>
      `;
    }
  }
  
  /**
   * สร้าง HTML สำหรับประวัติการขาย
   * @param {Array} sales - รายการขาย
   * @returns {string} - HTML string
   */
  renderSalesHistory(sales) {
    if (!sales || sales.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <p>ไม่มีประวัติการขาย</p>
        </div>
      `;
    }
    
    let html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>รหัสการขาย</th>
              <th>วันที่</th>
              <th>สินค้า</th>
              <th>ยอดรวม</th>
              <th>สถานะ</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // สร้าง HTML สำหรับแต่ละรายการขาย
    sales.forEach(sale => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const saleDate = new Date(sale.date);
      const formattedDate = `${saleDate.getDate()}/${saleDate.getMonth() + 1}/${saleDate.getFullYear() + 543}`;
      
      // รายการสินค้าย่อ
      const productsText = sale.items.map(item => item.productName).join(', ');
      
      // กำหนด CSS class ตามสถานะ
      let statusClass = '';
      switch (sale.status) {
        case 'สอบถามข้อมูล': statusClass = 'status-inquiry'; break;
        case 'ลูกค้าสนใจ': statusClass = 'status-interested'; break;
        case 'ส่งใบเสนอราคา': statusClass = 'status-quotation'; break;
        case 'ต่อรองราคา': statusClass = 'status-negotiation'; break;
        case 'ยืนยันการสั่งซื้อ': statusClass = 'status-confirmed'; break;
        case 'ส่งมอบสินค้า': statusClass = 'status-delivered'; break;
        case 'บริการหลังการขาย': statusClass = 'status-aftersale'; break;
        default: statusClass = ''; break;
      }
      
      html += `
        <tr>
          <td><a href="sale-details.html?id=${sale.id}">${sale.id}</a></td>
          <td>${formattedDate}</td>
          <td>${productsText}</td>
          <td>฿${sale.total.toLocaleString()}</td>
          <td><span class="status ${statusClass}">${sale.status}</span></td>
          <td>
            <div class="action-buttons">
              <a href="sale-details.html?id=${sale.id}" class="btn-icon" title="ดูรายละเอียด">
                <i class="fas fa-eye"></i>
              </a>
              <button class="btn-icon update-sale-status" data-sale-id="${sale.id}" title="อัปเดตสถานะ">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    return html;
  }
  
  /**
   * สร้าง HTML สำหรับเอกสารที่เกี่ยวข้อง
   * @param {Array} documents - รายการเอกสาร
   * @returns {string} - HTML string
   */
  renderDocuments(documents) {
    if (!documents || documents.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>ไม่มีเอกสารที่เกี่ยวข้อง</p>
        </div>
      `;
    }
    
    let html = `
      <div class="document-grid">
    `;
    
    // สร้าง HTML สำหรับแต่ละเอกสาร
    documents.forEach(doc => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const docDate = new Date(doc.date);
      const formattedDate = `${docDate.getDate()}/${docDate.getMonth() + 1}/${docDate.getFullYear() + 543}`;
      
      // กำหนดไอคอนตามประเภทเอกสาร
      let iconClass = '';
      switch (doc.type) {
        case 'ใบเสนอราคา': iconClass = 'fas fa-file-invoice-dollar'; break;
        case 'ใบสั่งซื้อ': iconClass = 'fas fa-file-signature'; break;
        case 'ใบเสร็จรับเงิน': iconClass = 'fas fa-file-invoice'; break;
        case 'สเปคสินค้า': iconClass = 'fas fa-file-alt'; break;
        case 'คู่มือการใช้งาน': iconClass = 'fas fa-book'; break;
        default: iconClass = 'fas fa-file'; break;
      }
      
      html += `
        <div class="document-item">
          <div class="document-icon">
            <i class="${iconClass}"></i>
          </div>
          <div class="document-info">
            <h3>${doc.title}</h3>
            <p class="document-date">${formattedDate}</p>
            <p class="document-size">${doc.fileSize}</p>
          </div>
          <div class="document-actions">
            <button class="btn-icon view-document" data-document-id="${doc.id}" title="ดูเอกสาร">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon download-document" data-document-id="${doc.id}" title="ดาวน์โหลด">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    html += `
      </div>
    `;
    
    return html;
  }
  
  /**
   * คำนวณมูลค่าการซื้อทั้งหมดของลูกค้า
   * @param {Array} sales - รายการขาย
   * @returns {string} - มูลค่าการซื้อที่จัดรูปแบบแล้ว
   */
  calculateTotalSales(sales) {
    if (!sales || sales.length === 0) return '0';
    
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    return total.toLocaleString();
  }
  
  /**
   * คำนวณโอกาสปิดการขายตามสถานะของลูกค้า
   * @param {string} status - สถานะของลูกค้า
   * @returns {number} - เปอร์เซ็นต์โอกาสปิดการขาย
   */
  calculateSalesProbability(status) {
    switch (status) {
      case 'สอบถามข้อมูล': return 20;
      case 'ลูกค้าสนใจ': return 40;
      case 'ส่งใบเสนอราคา': return 60;
      case 'ต่อรองราคา': return 75;
      case 'ยืนยันการสั่งซื้อ': return 95;
      case 'ส่งมอบสินค้า': return 100;
      case 'บริการหลังการขาย': return 100;
      default: return 0;
    }
  }
  
  /**
   * แสดง Modal สำหรับการอัปเดตสถานะลูกค้า
   * @param {Object} customer - ข้อมูลลูกค้า
   */
  showUpdateStatusModal(customer) {
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    // กำหนดตัวเลือกสถานะ
    const statusOptions = [
      'สอบถามข้อมูล',
      'ลูกค้าสนใจ',
      'ส่งใบเสนอราคา',
      'ต่อรองราคา',
      'ยืนยันการสั่งซื้อ',
      'ส่งมอบสินค้า',
      'บริการหลังการขาย'
    ];
    
    // สร้าง HTML สำหรับ Modal
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>อัปเดตสถานะลูกค้า</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="status-select" class="form-label">เลือกสถานะใหม่</label>
            <select id="status-select" class="form-input">
              ${statusOptions.map(status => `
                <option value="${status}" ${status === customer.status ? 'selected' : ''}>${status}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="status-note" class="form-label">หมายเหตุ</label>
            <textarea id="status-note" class="form-input" rows="3" placeholder="เพิ่มรายละเอียดเกี่ยวกับการเปลี่ยนสถานะ..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="status-notify" class="form-label">แจ้งเตือน</label>
            <div class="checkbox-group">
              <input type="checkbox" id="notify-customer" checked>
              <label for="notify-customer">แจ้งให้ลูกค้าทราบเกี่ยวกับการเปลี่ยนสถานะ</label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button class="btn btn-primary" id="confirm-update-status">
            <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง
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
    
    // ตั้งค่า event listeners สำหรับปุ่มยืนยันการอัปเดตสถานะ
    const confirmButton = modal.querySelector('#confirm-update-status');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        // ในที่นี้เราจะจำลองการอัปเดตสถานะ
        // ในสถานการณ์จริงควรมีการส่งข้อมูลไปยังเซิร์ฟเวอร์
        const newStatus = modal.querySelector('#status-select').value;
        const note = modal.querySelector('#status-note').value;
        const notify = modal.querySelector('#notify-customer').checked;
        
        alert(`อัปเดตสถานะลูกค้าเป็น "${newStatus}" เรียบร้อยแล้ว${notify ? ' และส่งการแจ้งเตือนไปยังลูกค้า' : ''}`);
        
        // ปิด Modal
        document.body.removeChild(modal);
        
        // โหลดข้อมูลลูกค้าใหม่อีกครั้ง
        this.loadCustomerDetails();
      });
    }
  }
  
  /**
   * แสดง Modal สำหรับการแก้ไขข้อมูลลูกค้า
   * @param {Object} customer - ข้อมูลลูกค้า
   */
  showEditCustomerModal(customer) {
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    // สร้าง HTML สำหรับ Modal
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>แก้ไขข้อมูลลูกค้า</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-name" class="form-label">ชื่อลูกค้า</label>
            <input type="text" id="edit-name" class="form-input" value="${customer.name}">
          </div>
          
          <div class="form-group">
            <label for="edit-phone" class="form-label">เบอร์โทรศัพท์</label>
            <input type="tel" id="edit-phone" class="form-input" value="${customer.phone}">
          </div>
          
          <div class="form-group">
            <label for="edit-email" class="form-label">อีเมล</label>
            <input type="email" id="edit-email" class="form-input" value="${customer.email}">
          </div>
          
          <div class="form-group">
            <label for="edit-address" class="form-label">ที่อยู่</label>
            <textarea id="edit-address" class="form-input" rows="3">${customer.address}</textarea>
          </div>
          
          <div class="form-group">
            <label for="edit-notes" class="form-label">บันทึกเพิ่มเติม</label>
            <textarea id="edit-notes" class="form-input" rows="3">${customer.notes || ''}</textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button class="btn btn-primary" id="confirm-edit-customer">
            <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง
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
    
    // ตั้งค่า event listeners สำหรับปุ่มยืนยันการแก้ไขข้อมูล
    const confirmButton = modal.querySelector('#confirm-edit-customer');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        // ในที่นี้เราจะจำลองการแก้ไขข้อมูล
        // ในสถานการณ์จริงควรมีการส่งข้อมูลไปยังเซิร์ฟเวอร์
        const name = modal.querySelector('#edit-name').value;
        const phone = modal.querySelector('#edit-phone').value;
        const email = modal.querySelector('#edit-email').value;
        const address = modal.querySelector('#edit-address').value;
        const notes = modal.querySelector('#edit-notes').value;
        
        alert(`บันทึกการเปลี่ยนแปลงข้อมูลลูกค้า "${name}" เรียบร้อยแล้ว`);
        
        // ปิด Modal
        document.body.removeChild(modal);
        
        // โหลดข้อมูลลูกค้าใหม่อีกครั้ง
        this.loadCustomerDetails();
      });
    }
  }
  
  /**
   * จัดการการค้นหาลูกค้า
   */
  handleSearch() {
    // ดึงค่าจากฟอร์มค้นหา
    const keyword = this.keywordInput?.value || '';
    const status = this.statusSelect?.value || '';
    
    // กำหนดตัวกรองข้อมูล
    this.filters = {
      search: keyword,
      status: status
    };
    
    // รีเซ็ตหน้าปัจจุบันเป็นหน้าแรก
    this.currentPage = 1;
    
    // โหลดข้อมูลลูกค้าใหม่อีกครั้ง
    this.loadCustomerList();
  }
  
  /**
   * จัดการการล้างการค้นหา
   */
  handleClearSearch() {
    // รีเซ็ตค่าในฟอร์มค้นหา
    if (this.keywordInput) this.keywordInput.value = '';
    if (this.statusSelect) this.statusSelect.value = '';
    
    // รีเซ็ตตัวกรองข้อมูล
    this.filters = {
      search: '',
      status: ''
    };
    
    // รีเซ็ตหน้าปัจจุบันเป็นหน้าแรก
    this.currentPage = 1;
    
    // โหลดข้อมูลลูกค้าใหม่อีกครั้ง
    this.loadCustomerList();
  }
  
  /**
   * จัดการการเพิ่มลูกค้าใหม่
   */
  handleAddCustomer() {
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    // สร้าง HTML สำหรับ Modal
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>เพิ่มลูกค้าใหม่</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="new-name" class="form-label">ชื่อลูกค้า</label>
            <input type="text" id="new-name" class="form-input" placeholder="กรอกชื่อลูกค้า" required>
          </div>
          
          <div class="form-group">
            <label for="new-phone" class="form-label">เบอร์โทรศัพท์</label>
            <input type="tel" id="new-phone" class="form-input" placeholder="กรอกเบอร์โทรศัพท์" required>
          </div>
          
          <div class="form-group">
            <label for="new-email" class="form-label">อีเมล</label>
            <input type="email" id="new-email" class="form-input" placeholder="กรอกอีเมล">
          </div>
          
          <div class="form-group">
            <label for="new-address" class="form-label">ที่อยู่</label>
            <textarea id="new-address" class="form-input" rows="3" placeholder="กรอกที่อยู่"></textarea>
          </div>
          
          <div class="form-group">
            <label for="new-status" class="form-label">สถานะ</label>
            <select id="new-status" class="form-input">
              <option value="สอบถามข้อมูล">สอบถามข้อมูล</option>
              <option value="ลูกค้าสนใจ">ลูกค้าสนใจ</option>
              <option value="ส่งใบเสนอราคา">ส่งใบเสนอราคา</option>
              <option value="ต่อรองราคา">ต่อรองราคา</option>
              <option value="ยืนยันการสั่งซื้อ">ยืนยันการสั่งซื้อ</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="new-notes" class="form-label">บันทึกเพิ่มเติม</label>
            <textarea id="new-notes" class="form-input" rows="3" placeholder="กรอกบันทึกเพิ่มเติม"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button class="btn btn-primary" id="confirm-add-customer">
            <i class="fas fa-save"></i> บันทึกข้อมูลลูกค้า
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
    
    // ตั้งค่า event listeners สำหรับปุ่มยืนยันการเพิ่มลูกค้า
    const confirmButton = modal.querySelector('#confirm-add-customer');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        // ในที่นี้เราจะจำลองการเพิ่มลูกค้า
        // ในสถานการณ์จริงควรมีการส่งข้อมูลไปยังเซิร์ฟเวอร์
        const name = modal.querySelector('#new-name').value;
        const phone = modal.querySelector('#new-phone').value;
        const email = modal.querySelector('#new-email').value;
        const address = modal.querySelector('#new-address').value;
        const status = modal.querySelector('#new-status').value;
        const notes = modal.querySelector('#new-notes').value;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !phone) {
          alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ของลูกค้า');
          return;
        }
        
        alert(`เพิ่มลูกค้า "${name}" เรียบร้อยแล้ว`);
        
        // ปิด Modal
        document.body.removeChild(modal);
        
        // โหลดข้อมูลลูกค้าใหม่อีกครั้ง
        this.loadCustomerList();
      });
    }
  }
}

// สร้าง instance ของ CustomerController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const customerController = new CustomerController();
});

export default CustomerController;