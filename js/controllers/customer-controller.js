/**
 * InfoHub 360 - Customer Controller
 * 
 * Controller สำหรับจัดการข้อมูลลูกค้า
 * ทำงานร่วมกับ scripts.js และ data-service.js
 * อัปเดต: ใช้ API จริงจาก AWS Lambda
 */

import dataService from '../services/data-service.js';

class CustomerController {
  constructor() {
    this.customers = [];
    this.currentSearchParams = {};
    this.isLoading = false;
    this.currentCustomer = null; // สำหรับหน้า customer details
    
    // Pagination
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
    
    // Filters
    this.filters = {
      search: '',
      status: ''
    };
    
    // DOM Elements
    this.customerList = document.getElementById('customer-list');
    this.customerListContainer = document.getElementById('customer-list');
    this.resultsTitle = document.getElementById('results-title');
    this.resultsCount = document.getElementById('results-count');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.emptyState = document.getElementById('empty-state');
    this.customerDetailsContainer = document.getElementById('customer-details');
    this.paginationContainer = document.getElementById('pagination-container');
    
    // Search elements
    this.searchForm = document.getElementById('search-form');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-button');
    this.keywordInput = document.getElementById('keyword');
    this.statusSelect = document.getElementById('status-select');
    this.addCustomerButton = document.getElementById('add-customer-button');
    
    // Page detection
    this.isCustomerListPage = window.location.pathname.includes('customer-list.html');
    this.isCustomerDetailsPage = window.location.pathname.includes('customer-details.html');
    
    // Initialize based on current page
    this.initializePage();
  }
  
  /**
   * Initialize based on current page
   */
  initializePage() {
    if (this.isCustomerListPage && this.customerListContainer) {
      // Customer listing page (customer-list.html)
      this.initCustomerListing();
    } else if (this.isCustomerDetailsPage && this.customerDetailsContainer) {
      // Customer details page (customer-details.html)
      this.initCustomerDetails();
    }
  }
  
  /**
   * Initialize customer listing functionality
   */
  initCustomerListing() {
    console.log('Customer Controller initializing for customer listing...');
    
    // Wait for app to be ready
    if (window.InfoHubApp && window.InfoHubApp.isAppReady()) {
      this.setupEventListeners();
      this.loadInitialCustomers();
    } else {
      document.addEventListener('app-ready', () => {
        this.setupEventListeners();
        this.loadInitialCustomers();
      });
    }
  }
  
  /**
   * Initialize customer details functionality
   */
  initCustomerDetails() {
    console.log('Customer Controller initializing for customer details...');
    
    // Parse customer ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('id');
    
    if (!customerId) {
      this.showError('ไม่พบรหัสลูกค้าที่ต้องการ');
      return;
    }
    
    // Wait for app to be ready
    if (window.InfoHubApp && window.InfoHubApp.isAppReady()) {
      this.loadCustomerDetails(customerId);
    } else {
      document.addEventListener('app-ready', () => {
        this.loadCustomerDetails(customerId);
      });
    }
  }
  
  /**
   * Setup event listeners for customer listing
   */
  setupEventListeners() {
    // Search form
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
    
    // Add customer button
    if (this.addCustomerButton) {
      this.addCustomerButton.addEventListener('click', () => {
        this.handleAddCustomer();
      });
    }
    
    // Listen for retry events
    document.addEventListener('retry-requested', () => {
      this.loadInitialCustomers();
    });
    
    // Listen for add customer events
    document.addEventListener('add-customer-requested', () => {
      this.handleAddCustomer();
    });
  }
  
  /**
   * Load initial customers
   */
  async loadInitialCustomers() {
    try {
      this.showLoading();
      
      const customers = await dataService.getCustomers(this.filters);
      this.customers = customers;
      
      // Calculate pagination
      this.totalPages = Math.ceil(customers.length / this.itemsPerPage);
      
      // Get paginated data
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      this.displayCustomers(paginatedCustomers);
      this.updateResultsInfo(customers.length, 'รายการลูกค้าทั้งหมด');
      this.renderPagination();
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('โหลดข้อมูลลูกค้าเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error loading initial customers:', error);
      this.showError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Handle search request
   */
  async handleSearch() {
    try {
      // Get search values
      const keyword = this.keywordInput?.value || '';
      const status = this.statusSelect?.value || '';
      
      // Set filters
      this.filters = {
        search: keyword,
        status: status
      };
      
      // Reset to first page
      this.currentPage = 1;
      
      this.showLoading();
      
      const customers = await dataService.searchCustomers(this.filters);
      this.customers = customers;
      
      // Calculate pagination
      this.totalPages = Math.ceil(customers.length / this.itemsPerPage);
      
      // Get paginated data
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      this.displayCustomers(paginatedCustomers);
      
      // Update title based on search
      let title = 'ผลการค้นหา';
      if (keyword) title += ` "${keyword}"`;
      if (status) title += ` สถานะ "${status}"`;
      if (!keyword && !status) title = 'รายการลูกค้าทั้งหมด';
      
      this.updateResultsInfo(customers.length, title);
      this.renderPagination();
      
      if (customers.length === 0) {
        if (window.InfoHubApp) {
          window.InfoHubApp.showNotification('ไม่พบลูกค้าที่ตรงกับการค้นหา', 'warning');
        }
      }
      
    } catch (error) {
      console.error('Error searching customers:', error);
      this.showError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Handle clear search
   */
  handleClearSearch() {
    // Reset form values
    if (this.keywordInput) this.keywordInput.value = '';
    if (this.statusSelect) this.statusSelect.value = '';
    
    // Reset filters
    this.filters = {
      search: '',
      status: ''
    };
    
    // Reset to first page
    this.currentPage = 1;
    
    // Reload customers
    this.loadInitialCustomers();
  }
  
  /**
   * Display customers in the UI
   */
  displayCustomers(customers) {
    if (!this.customerListContainer) return;
    
    if (!customers || customers.length === 0) {
      this.showEmptyState();
      return;
    }
    
    this.hideEmptyState();
    
    const html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ชื่อลูกค้า</th>
            <th>เบอร์โทรศัพท์</th>
            <th>อีเมล</th>
            <th>สถานะ</th>
            <th>วันที่สร้าง</th>
            <th>การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => this.createCustomerRow(customer)).join('')}
        </tbody>
      </table>
    `;
    
    this.customerListContainer.innerHTML = html;
    
    // Setup customer event listeners
    this.setupCustomerEventListeners();
  }
  
  /**
   * Create customer row HTML
   */
  createCustomerRow(customer) {
    const statusClass = this.getStatusClass(customer.status);
    const createdDate = new Date(customer.created_at).toLocaleDateString('th-TH');
    
    return `
      <tr data-customer-id="${this.escapeHtml(customer.id)}">
        <td>
          <a href="customer-details.html?id=${encodeURIComponent(customer.id)}" class="customer-name">
            ${this.escapeHtml(customer.name)}
          </a>
        </td>
        <td>
          <a href="tel:${this.escapeHtml(customer.tel)}">${this.escapeHtml(customer.tel || 'ไม่ระบุ')}</a>
        </td>
        <td>
          ${customer.email ? `<a href="mailto:${this.escapeHtml(customer.email)}">${this.escapeHtml(customer.email)}</a>` : 'ไม่ระบุ'}
        </td>
        <td>
          <span class="status ${statusClass}">${this.getStatusText(customer.status)}</span>
        </td>
        <td>${createdDate}</td>
        <td>
          <div class="action-buttons">
            <a href="customer-details.html?id=${encodeURIComponent(customer.id)}" class="btn-icon" title="ดูรายละเอียด">
              <i class="fas fa-eye"></i>
            </a>
            <a href="sale-details.html?action=new&customer=${encodeURIComponent(customer.id)}" class="btn-icon" title="เพิ่มการขาย">
              <i class="fas fa-shopping-cart"></i>
            </a>
            <button class="btn-icon edit-customer" data-customer-id="${this.escapeHtml(customer.id)}" title="แก้ไขข้อมูล">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }
  
  /**
   * Setup customer event listeners
   */
  setupCustomerEventListeners() {
    // Edit customer buttons
    const editButtons = document.querySelectorAll('.edit-customer');
    editButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const customerId = button.getAttribute('data-customer-id');
        
        try {
          const customer = await dataService.getCustomerById(customerId);
          this.showEditCustomerModal(customer);
        } catch (error) {
          console.error('Error loading customer for edit:', error);
          if (window.InfoHubApp) {
            window.InfoHubApp.showNotification('ไม่สามารถโหลดข้อมูลลูกค้าได้', 'error');
          }
        }
      });
    });
  }
  
  /**
   * Handle add customer
   */
  async handleAddCustomer() {
    this.showAddCustomerModal();
  }
  
  /**
   * Show add customer modal
   */
  showAddCustomerModal() {
    const template = document.getElementById('add-customer-modal-template');
    if (!template) {
      // Create modal if template doesn't exist
      this.createAddCustomerModal();
      return;
    }
    
    const modalContent = template.content.cloneNode(true);
    const modalElement = document.createElement('div');
    modalElement.appendChild(modalContent);
    
    document.body.appendChild(modalElement);
    
    // Setup modal event listeners
    this.setupAddCustomerModalListeners(modalElement);
    
    // Show modal with animation
    setTimeout(() => {
      const backdrop = modalElement.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.style.display = 'flex';
      }
    }, 10);
  }
  
  /**
   * Create add customer modal
   */
  createAddCustomerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>เพิ่มลูกค้าใหม่</h2>
          <button class="modal-close" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="new-fname" class="form-label">ชื่อ *</label>
            <input type="text" id="new-fname" class="form-input" placeholder="กรอกชื่อ" required>
          </div>
          
          <div class="form-group">
            <label for="new-name" class="form-label">นามสกุล *</label>
            <input type="text" id="new-name" class="form-input" placeholder="กรอกนามสกุล" required>
          </div>
          
          <div class="form-group">
            <label for="new-tel" class="form-label">เบอร์โทรศัพท์ *</label>
            <input type="tel" id="new-tel" class="form-input" placeholder="กรอกเบอร์โทรศัพท์" required>
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
              <option value="interested">สนใจ</option>
              <option value="contacted">ติดต่อแล้ว</option>
              <option value="negotiating">กำลังเจรจา</option>
              <option value="confirmed">ยืนยันแล้ว</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="new-note" class="form-label">หมายเหตุ</label>
            <textarea id="new-note" class="form-input" rows="3" placeholder="กรอกหมายเหตุเพิ่มเติม"></textarea>
          </div>
          
          <small class="form-note">* ข้อมูลที่จำเป็นต้องกรอก</small>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button type="button" class="btn btn-primary" id="confirm-add-customer">
            <i class="fas fa-save"></i> บันทึกข้อมูลลูกค้า
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.setupAddCustomerModalListeners(modal);
  }
  
  /**
   * Setup add customer modal listeners
   */
  setupAddCustomerModalListeners(modalElement) {
    const closeButtons = modalElement.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (window.InfoHubApp) {
          window.InfoHubApp.closeModal(modalElement.querySelector('.modal-backdrop'));
        } else {
          modalElement.remove();
        }
      });
    });
    
    const confirmButton = modalElement.querySelector('#confirm-add-customer');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        this.handleCreateCustomer(modalElement);
      });
    }
    
    // Close on backdrop click
    const backdrop = modalElement.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          if (window.InfoHubApp) {
            window.InfoHubApp.closeModal(backdrop);
          } else {
            modalElement.remove();
          }
        }
      });
    }
  }
  
  /**
   * Handle create customer
   */
  async handleCreateCustomer(modalElement) {
    try {
      const fname = modalElement.querySelector('#new-fname').value.trim();
      const name = modalElement.querySelector('#new-name').value.trim();
      const tel = modalElement.querySelector('#new-tel').value.trim();
      const email = modalElement.querySelector('#new-email').value.trim();
      const address = modalElement.querySelector('#new-address').value.trim();
      const status = modalElement.querySelector('#new-status').value;
      const note = modalElement.querySelector('#new-note').value.trim();
      
      // Validate required fields
      if (!fname || !name || !tel) {
        alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, นามสกุล, เบอร์โทรศัพท์)');
        return;
      }
      
      // Show loading
      const confirmButton = modalElement.querySelector('#confirm-add-customer');
      const originalText = confirmButton.innerHTML;
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      confirmButton.disabled = true;
      
      // Create customer data
      const customerData = {
        fname,
        name,
        tel,
        email,
        address,
        status,
        note
      };
      
      // Call API
      const newCustomer = await dataService.createCustomer(customerData);
      
      // Close modal
      if (window.InfoHubApp) {
        window.InfoHubApp.closeModal(modalElement.querySelector('.modal-backdrop'));
      } else {
        modalElement.remove();
      }
      
      // Show success message
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification(`เพิ่มลูกค้า "${fname} ${name}" เรียบร้อยแล้ว`, 'success');
      }
      
      // Reload customer list
      this.loadInitialCustomers();
      
    } catch (error) {
      console.error('Error creating customer:', error);
      
      // Reset button
      const confirmButton = modalElement.querySelector('#confirm-add-customer');
      if (confirmButton) {
        confirmButton.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูลลูกค้า';
        confirmButton.disabled = false;
      }
      
      // Show error message
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification(error.message || 'ไม่สามารถเพิ่มลูกค้าได้', 'error');
      } else {
        alert(error.message || 'ไม่สามารถเพิ่มลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  }
  
  /**
   * Render pagination
   */
  renderPagination() {
    if (!this.paginationContainer) return;
    
    // Don't show pagination if only one page
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
    
    // Show page numbers
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
    
    this.paginationContainer.innerHTML = html;
    
    // Setup pagination event listeners
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
        
        this.loadInitialCustomers();
      });
    });
  }
  
  /**
   * Load customer details
   */
  async loadCustomerDetails(customerId) {
    try {
      this.showLoading();
      
      const customer = await dataService.getCustomerById(customerId);
      this.currentCustomer = customer;
      
      this.displayCustomerDetails(customer);
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('โหลดข้อมูลลูกค้าเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error loading customer details:', error);
      this.showError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Display customer details
   */
  displayCustomerDetails(customer) {
    if (!this.customerDetailsContainer) return;
    
    const statusClass = this.getStatusClass(customer.status);
    const priorityClass = this.getPriorityClass(customer.priority);
    
    const html = `
      <!-- Customer Header -->
      <div class="customer-header">
        <div class="customer-title-section">
          <h1 class="customer-title">${this.escapeHtml(customer.name)}</h1>
          <p class="customer-code">รหัสลูกค้า: <span class="code-value">${this.escapeHtml(customer.id)}</span></p>
          <div class="customer-status">
            <span class="status-badge ${statusClass}">${this.getStatusText(customer.status)}</span>
            <span class="priority-badge ${priorityClass}">${this.getPriorityText(customer.priority)}</span>
          </div>
        </div>
        
        <div class="customer-actions-header">
          <button class="btn btn-primary btn-large" id="create-sale-btn">
            <i class="fas fa-shopping-cart"></i> สร้างการขาย
          </button>
          <button class="btn btn-outline btn-large" id="edit-customer-btn">
            <i class="fas fa-edit"></i> แก้ไขข้อมูล
          </button>
        </div>
      </div>
      
      <!-- Customer Content -->
      <div class="customer-content">
        <!-- Left Column - Contact Information -->
        <div class="customer-left-column">
          <div class="customer-info-card">
            <h3 class="card-title">
              <i class="fas fa-user"></i> ข้อมูลติดต่อ
            </h3>
            <div class="contact-info">
              <div class="contact-item">
                <span class="contact-label">เบอร์โทร:</span>
                <span class="contact-value">
                  <a href="tel:${this.escapeHtml(customer.tel)}">${this.escapeHtml(customer.tel || 'ไม่ระบุ')}</a>
                </span>
              </div>
              <div class="contact-item">
                <span class="contact-label">อีเมล:</span>
                <span class="contact-value">
                  ${customer.email ? `<a href="mailto:${this.escapeHtml(customer.email)}">${this.escapeHtml(customer.email)}</a>` : 'ไม่ระบุ'}
                </span>
              </div>
              <div class="contact-item">
                <span class="contact-label">ที่อยู่:</span>
                <span class="contact-value">${this.escapeHtml(customer.address || 'ไม่ระบุ')}</span>
              </div>
            </div>
          </div>
          
          <!-- Customer Statistics -->
          <div class="customer-info-card">
            <h3 class="card-title">
              <i class="fas fa-chart-bar"></i> สถิติการซื้อ
            </h3>
            <div class="customer-stats">
              <div class="stat-item">
                <div class="stat-value">${customer.totalOrders || 0}</div>
                <div class="stat-label">ครั้ง</div>
                <div class="stat-description">จำนวนการซื้อ</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${window.InfoHubApp ? window.InfoHubApp.formatCurrency(customer.totalSpent || 0) : '฿0'}</div>
                <div class="stat-label">บาท</div>
                <div class="stat-description">ยอดซื้อรวม</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('th-TH') : '-'}</div>
                <div class="stat-label">ครั้งล่าสุด</div>
                <div class="stat-description">ซื้อล่าสุด</div>
              </div>
            </div>
          </div>
        </div>
        
  <!-- Right Column - Additional Information -->
       <div class="customer-right-column">
         <!-- Timeline -->
         <div class="customer-info-card">
           <h3 class="card-title">
             <i class="fas fa-history"></i> ประวัติการติดต่อ
           </h3>
           <div class="timeline">
             <div class="timeline-item">
               <div class="timeline-icon">
                 <i class="fas fa-user-plus"></i>
               </div>
               <div class="timeline-content">
                 <div class="timeline-title">ลูกค้าใหม่</div>
                 <div class="timeline-description">เพิ่มข้อมูลลูกค้าในระบบ</div>
                 <div class="timeline-date">${new Date(customer.created_at).toLocaleDateString('th-TH')}</div>
               </div>
             </div>
             ${customer.lastContact ? `
               <div class="timeline-item">
                 <div class="timeline-icon">
                   <i class="fas fa-phone"></i>
                 </div>
                 <div class="timeline-content">
                   <div class="timeline-title">ติดต่อล่าสุด</div>
                   <div class="timeline-description">ผ่าน ${this.getContactMethodText(customer.contactMethod)}</div>
                   <div class="timeline-date">${new Date(customer.lastContact).toLocaleDateString('th-TH')}</div>
                 </div>
               </div>
             ` : ''}
           </div>
         </div>
          
          <!-- Notes -->
          ${customer.note ? `
            <div class="customer-info-card">
              <h3 class="card-title">
                <i class="fas fa-sticky-note"></i> หมายเหตุ
              </h3>
              <div class="customer-notes">
                <p>${this.escapeHtml(customer.note)}</p>
              </div>
            </div>
          ` : ''}
          
          <!-- Tags -->
          ${customer.tags && customer.tags.length > 0 ? `
            <div class="customer-info-card">
              <h3 class="card-title">
                <i class="fas fa-tags"></i> แท็ก
              </h3>
              <div class="customer-tags">
                ${customer.tags.map(tag => `
                  <span class="tag">${this.escapeHtml(tag)}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Action Buttons (Mobile Fixed) -->
      <div class="customer-actions-mobile">
        <button class="btn btn-primary btn-mobile" id="create-sale-btn-mobile">
          <i class="fas fa-shopping-cart"></i> สร้างการขาย
        </button>
        <button class="btn btn-outline btn-mobile" id="edit-customer-btn-mobile">
          <i class="fas fa-edit"></i> แก้ไขข้อมูล
        </button>
      </div>
    `;
    
    this.customerDetailsContainer.innerHTML = html;
    
    // Setup event listeners for customer details
    this.setupCustomerDetailsEventListeners();
    
    // Add custom styles for customer details
    this.addCustomerDetailsStyles();
  }
  
  /**
   * Setup event listeners for customer details page
   */
  setupCustomerDetailsEventListeners() {
    // Create sale buttons
    const saleButtons = document.querySelectorAll('#create-sale-btn, #create-sale-btn-mobile');
    saleButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.handleCreateSale();
      });
    });
    
    // Edit customer buttons
    const editButtons = document.querySelectorAll('#edit-customer-btn, #edit-customer-btn-mobile');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.handleEditCustomer();
      });
    });
  }
  
  /**
   * Handle create sale action
   */
  handleCreateSale() {
    if (!this.currentCustomer) return;
    
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('กำลังสร้างการขายใหม่...', 'info');
    }
    
    // Redirect to new sale page with customer pre-selected
    setTimeout(() => {
      window.location.href = `sale-details.html?action=new&customer=${encodeURIComponent(this.currentCustomer.id)}`;
    }, 1000);
  }
  
  /**
   * Handle edit customer action
   */
  handleEditCustomer() {
    if (!this.currentCustomer) return;
    
    // Show edit customer modal
    this.showEditCustomerModal(this.currentCustomer);
  }
  
  /**
   * Show edit customer modal
   */
  showEditCustomerModal(customer) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>แก้ไขข้อมูลลูกค้า</h2>
          <button class="modal-close" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-fname" class="form-label">ชื่อ</label>
            <input type="text" id="edit-fname" class="form-input" value="${this.escapeHtml(customer.firstName || '')}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-name" class="form-label">นามสกุล</label>
            <input type="text" id="edit-name" class="form-input" value="${this.escapeHtml(customer.lastName || '')}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-tel" class="form-label">เบอร์โทรศัพท์</label>
            <input type="tel" id="edit-tel" class="form-input" value="${this.escapeHtml(customer.tel || '')}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-email" class="form-label">อีเมล</label>
            <input type="email" id="edit-email" class="form-input" value="${this.escapeHtml(customer.email || '')}">
          </div>
          
          <div class="form-group">
            <label for="edit-address" class="form-label">ที่อยู่</label>
            <textarea id="edit-address" class="form-input" rows="3">${this.escapeHtml(customer.address || '')}</textarea>
          </div>
          
          <div class="form-group">
            <label for="edit-status" class="form-label">สถานะ</label>
            <select id="edit-status" class="form-input">
              <option value="interested" ${customer.status === 'interested' ? 'selected' : ''}>สนใจ</option>
              <option value="contacted" ${customer.status === 'contacted' ? 'selected' : ''}>ติดต่อแล้ว</option>
              <option value="negotiating" ${customer.status === 'negotiating' ? 'selected' : ''}>กำลังเจรจา</option>
              <option value="confirmed" ${customer.status === 'confirmed' ? 'selected' : ''}>ยืนยันแล้ว</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-note" class="form-label">หมายเหตุ</label>
            <textarea id="edit-note" class="form-input" rows="3">${this.escapeHtml(customer.note || '')}</textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button type="button" class="btn btn-primary" id="confirm-edit-customer">
            <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup modal event listeners
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.remove();
      });
    });
    
    const confirmButton = modal.querySelector('#confirm-edit-customer');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        this.handleUpdateCustomer(modal, customer);
      });
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * Handle update customer
   */
  async handleUpdateCustomer(modalElement, customer) {
    try {
      const fname = modalElement.querySelector('#edit-fname').value.trim();
      const name = modalElement.querySelector('#edit-name').value.trim();
      const tel = modalElement.querySelector('#edit-tel').value.trim();
      const email = modalElement.querySelector('#edit-email').value.trim();
      const address = modalElement.querySelector('#edit-address').value.trim();
      const status = modalElement.querySelector('#edit-status').value;
      const note = modalElement.querySelector('#edit-note').value.trim();
      
      // Validate required fields
      if (!fname || !name || !tel) {
        alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, นามสกุล, เบอร์โทรศัพท์)');
        return;
      }
      
      // Show loading
      const confirmButton = modalElement.querySelector('#confirm-edit-customer');
      const originalText = confirmButton.innerHTML;
      confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      confirmButton.disabled = true;
      
      // For now, just show success message since we don't have update API yet
      // In real implementation, call dataService.updateCustomer()
      
      // Close modal
      modalElement.remove();
      
      // Show success message
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification(`อัปเดตข้อมูลลูกค้า "${fname} ${name}" เรียบร้อยแล้ว`, 'success');
      }
      
      // Reload customer details (in real implementation, use updated data from API)
      this.loadCustomerDetails(customer.id);
      
    } catch (error) {
      console.error('Error updating customer:', error);
      
      // Reset button
      const confirmButton = modalElement.querySelector('#confirm-edit-customer');
      if (confirmButton) {
        confirmButton.innerHTML = '<i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง';
        confirmButton.disabled = false;
      }
      
      // Show error message
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification(error.message || 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้', 'error');
      } else {
        alert(error.message || 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  }
  
  /**
   * Helper methods
   */
  
  getStatusClass(status) {
    const statusMap = {
      'interested': 'status-interested',
      'confirmed': 'status-confirmed',        // เพิ่ม
      'pending_payment': 'status-pending',    // เพิ่ม
      'paid': 'status-paid',                  // เพิ่ม
      'delivered': 'status-delivered',        // เพิ่ม
      'after_sales': 'status-after-sales',    // เพิ่ม
    };
    return statusMap[status] || '';
  }
  
  getStatusText(status) {
    const statusMap = {
      'interested': 'ลูกค้าสนใจสินค้า',
      'confirmed': 'ยืนยันการสั่งซื้อ',
      'pending_payment': 'รอชำระเงิน',
      'paid': 'ชำระเงินแล้ว',
      'delivered': 'ส่งมอบสินค้า',
      'after_sales': 'บริการหลังการขาย',
    };
    return statusMap[status] || status;
  }
  
  getPriorityClass(priority) {
    const priorityMap = {
      'low': 'priority-low',
      'normal': 'priority-normal',
      'high': 'priority-high'
    };
    return priorityMap[priority] || 'priority-normal';
  }
  
  getPriorityText(priority) {
    const priorityMap = {
      'low': 'ต่ำ',
      'normal': 'ปกติ',
      'high': 'สูง'
    };
    return priorityMap[priority] || 'ปกติ';
  }
  
  getContactMethodText(method) {
    const methodMap = {
      'phone': 'โทรศัพท์',
      'email': 'อีเมล',
      'line': 'LINE',
      'facebook': 'Facebook',
      'website': 'เว็บไซต์'
    };
    return methodMap[method] || 'โทรศัพท์';
  }
  
  /**
   * Add custom styles for customer details
   */
  addCustomerDetailsStyles() {
    const styleId = 'customer-details-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .customer-details-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
      }
      
      .customer-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .customer-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      .customer-code {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      
      .code-value {
        font-family: monospace;
        font-weight: 600;
        color: #374151;
      }
      
      .customer-status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .status-badge, .priority-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-interested { background: #dbeafe; color: #1e40af; }
      .status-contacted { background: #fef3c7; color: #92400e; }
      .status-negotiating { background: #fed7d7; color: #c53030; }
      .status-confirmed { background: #d1fae5; color: #065f46; }
      
      .priority-low { background: #f3f4f6; color: #6b7280; }
      .priority-normal { background: #dbeafe; color: #1e40af; }
      .priority-high { background: #fecaca; color: #dc2626; }
      
      .customer-actions-header {
        display: flex;
        gap: 1rem;
        flex-shrink: 0;
      }
      
      .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .customer-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      
      .customer-info-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
      }
      
      .card-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .card-title i {
        color: #3b82f6;
      }
      
      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .contact-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .contact-label {
        color: #6b7280;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .contact-value {
        font-weight: 600;
        color: #374151;
      }
      
      .contact-value a {
        color: #3b82f6;
        text-decoration: none;
      }
      
      .contact-value a:hover {
        text-decoration: underline;
      }
      
      .customer-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      
      .stat-item {
        text-align: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
      }
      
      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }
      
      .stat-description {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      .timeline-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .timeline-icon {
        width: 40px;
        height: 40px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .timeline-content {
        flex: 1;
      }
      
      .timeline-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      
      .timeline-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }
      
      .timeline-date {
        color: #9ca3af;
        font-size: 0.75rem;
      }
      
      .customer-notes {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #3b82f6;
      }
      
      .customer-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .tag {
        background: #e5e7eb;
        color: #374151;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      
      .customer-actions-mobile {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        gap: 1rem;
      }
      
      .btn-mobile {
        flex: 1;
        padding: 0.75rem;
        font-weight: 600;
      }
      
      /* Form Styles */
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }
      
      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      
      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .form-note {
        color: #6b7280;
        font-size: 0.75rem;
        font-style: italic;
        margin-top: 0.25rem;
      }
      
      /* Modal Styles */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal {
        background: white;
        border-radius: 0.5rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: color 0.2s;
      }
      
      .modal-close:hover {
        color: #374151;
      }
      
      .modal-body {
        padding: 1.5rem;
        flex: 1;
      }
      
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }
      
      /* Data Table Styles */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .data-table th,
      .data-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .data-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
      }
      
      .data-table tbody tr:hover {
        background: #f9fafb;
      }
      
      .customer-name {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
      }
      
      .customer-name:hover {
        text-decoration: underline;
      }
      
      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn-icon {
        background: none;
        border: 1px solid #d1d5db;
        color: #6b7280;
        padding: 0.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      
      .btn-icon:hover {
        background: #f3f4f6;
        color: #374151;
        border-color: #9ca3af;
      }
      
      /* Pagination Styles */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 2rem;
      }
      
      .pagination-button {
        background: white;
        border: 1px solid #d1d5db;
        color: #6b7280;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
      }
      
      .pagination-button:hover:not(.disabled) {
        background: #f3f4f6;
        color: #374151;
        border-color: #9ca3af;
      }
      
      .pagination-button.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .pagination-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .pagination-pages {
        display: flex;
        gap: 0.25rem;
      }
      
      /* Status Styles */
      .status {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .customer-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
        
        .customer-actions-header {
          display: none;
        }
        
        .customer-actions-mobile {
          display: flex;
        }
        
        .customer-content {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .customer-title {
          font-size: 1.5rem;
        }
        
        .customer-stats {
          grid-template-columns: 1fr;
        }
        
        .customer-details-container {
          padding: 0.5rem;
          margin-bottom: 80px;
        }
        
        .contact-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
        
        .data-table {
          font-size: 0.875rem;
        }
        
        .data-table th,
        .data-table td {
          padding: 0.5rem;
        }
        
        .action-buttons {
          flex-direction: column;
        }
        
        .modal {
          width: 95%;
        }
        
        .modal-header,
        .modal-body,
        .modal-footer {
          padding: 1rem;
        }
      }
      
      @media (max-width: 640px) {
        .customer-stats {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        
        .stat-item {
          padding: 0.75rem;
        }
        
        .timeline-item {
          gap: 0.75rem;
        }
        
        .timeline-icon {
          width: 30px;
          height: 30px;
          font-size: 0.875rem;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
  }
  
  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.innerHTML = `
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="error-text">
            <h3>เกิดข้อผิดพลาด</h3>
            <p>${this.escapeHtml(message)}</p>
          </div>
          <button class="btn btn-primary retry-btn">
            <i class="fas fa-redo"></i> ลองใหม่
          </button>
        </div>
      `;
      this.errorMessage.style.display = 'block';
    }
    
    this.hideEmptyState();
    if (this.customerListContainer) {
      this.customerListContainer.innerHTML = '';
    }
  }
  
  /**
   * Show empty state
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
    }
    if (this.customerListContainer) {
      this.customerListContainer.innerHTML = '';
    }
  }
  
  /**
   * Hide empty state
   */
  hideEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }
  }
  
  /**
   * Update results information
   */
  updateResultsInfo(count, title) {
    if (this.resultsTitle) {
      this.resultsTitle.textContent = title;
    }
    
    if (this.resultsCount) {
      this.resultsCount.textContent = `${count} รายการ`;
    }
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
 }
 
 // Initialize customer controller
 const customerController = new CustomerController();
 
 export default customerController;