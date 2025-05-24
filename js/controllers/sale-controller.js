/**
 * InfoHub 360 - Sale Controller
 * 
 * Controller สำหรับจัดการข้อมูลรายละเอียดการขาย
 * ปรับปรุงให้ใช้ข้อมูลจริงจาก API เท่านั้น
 */

import dataService from '../services/data-service.js';

class SaleController {
  constructor() {
    this.isLoading = false;
    this.saleData = null;
    this.products = [];
    this.customers = [];
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.saleDetailsContainer = document.getElementById('sale-details');
    this.retryButton = document.getElementById('retry-button');
    
    // Determine page mode
    this.isNewSaleMode = false;
    this.isEditMode = false;
    this.productIdFromUrl = null;
    this.customerIdFromUrl = null;
    this.saleIdFromUrl = null;
    
    // Initialize only if on sale details page
    if (this.saleDetailsContainer) {
      this.init();
    }
  }
  
  /**
   * Initialize sale controller
   */
  async init() {
    console.log('Sale Controller initializing...');
    
    // Parse URL parameters
    this.parseUrlParameters();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data based on mode
    if (this.isNewSaleMode) {
      await this.initNewSaleMode();
    } else if (this.saleIdFromUrl) {
      await this.loadSaleDetails(this.saleIdFromUrl);
    } else {
      this.showError('ไม่พบข้อมูลการขายที่ต้องการ');
    }
  }
  
  /**
   * Parse URL parameters to determine mode
   */
  parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const action = urlParams.get('action');
    this.productIdFromUrl = urlParams.get('product');
    this.customerIdFromUrl = urlParams.get('customer'); 
    this.saleIdFromUrl = urlParams.get('id');
    
    if (action === 'new') {
      this.isNewSaleMode = true;
      console.log('New sale mode detected');
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Retry button
    if (this.retryButton) {
      this.retryButton.addEventListener('click', () => {
        if (this.isNewSaleMode) {
          this.initNewSaleMode();
        } else if (this.saleIdFromUrl) {
          this.loadSaleDetails(this.saleIdFromUrl);
        }
      });
    }
    
    // Listen for retry events from scripts.js
    document.addEventListener('retry-requested', () => {
      if (this.isNewSaleMode) {
        this.initNewSaleMode();
      } else if (this.saleIdFromUrl) {
        this.loadSaleDetails(this.saleIdFromUrl);
      }
    });
  }
  
  /**
   * Initialize new sale mode
   */
  async initNewSaleMode() {
    try {
      this.showLoading();
      
      // Load products data
      await this.loadProducts();
      
      // Load specific product if provided
      let selectedProduct = null;
      if (this.productIdFromUrl) {
        try {
          selectedProduct = await dataService.getProductById(this.productIdFromUrl);
          console.log('Loaded selected product:', selectedProduct);
        } catch (error) {
          console.warn('Could not load specific product:', error);
          if (window.InfoHubApp) {
            window.InfoHubApp.showNotification('ไม่สามารถโหลดข้อมูลสินค้าที่เลือกได้', 'warning');
          }
        }
      }
      
      // Skip customer loading for now since API is not ready
      // Set up mock customers for demo
      this.setupMockCustomers();
      
      // Render new sale form
      this.renderNewSaleForm(selectedProduct, null);
      
    } catch (error) {
      console.error('Error initializing new sale mode:', error);
      this.showError('ไม่สามารถโหลดข้อมูลสำหรับสร้างการขายใหม่ได้');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Load products data
   */
  async loadProducts() {
    try {
      this.products = await dataService.getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  }
  
  /**
   * Load customers data - Skip for now since API is not ready
   */
  setupMockCustomers() {
    // Set up mock customers for demo purposes
    this.customers = [
      {
        id: 'CUST001',
        name: 'คุณนภา วงศ์ประดิษฐ์',
        phone: '089-123-4567',
        email: 'napa.wong@example.com',
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'
      },
      {
        id: 'CUST002', 
        name: 'คุณสมศักดิ์ ใจดี',
        phone: '062-987-6543',
        email: 'somsak.jaidee@example.com',
        address: '456 ถนนพระราม 4 แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110'
      },
      {
        id: 'CUST003',
        name: 'คุณประภา เจริญพร',
        phone: '091-234-5678', 
        email: 'prapa.charoen@example.com',
        address: '789 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500'
      }
    ];
    console.log('Mock customers set up:', this.customers.length, 'customers');
  }
  
  /**
   * Load sale details
   * @param {string} saleId - Sale ID
   */
  async loadSaleDetails(saleId) {
    try {
      this.showLoading();
      
      // For now, show that sales system is under development
      // since we don't have real sales API yet
      this.renderSalesSystemUnderDevelopment(saleId);
      
    } catch (error) {
      console.error('Error loading sale details:', error);
      this.showError('ไม่สามารถโหลดข้อมูลการขายได้');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Render new sale form
   * @param {Object} selectedProduct - Pre-selected product
   * @param {Object} selectedCustomer - Pre-selected customer
   */
  renderNewSaleForm(selectedProduct = null, selectedCustomer = null) {
    if (!this.saleDetailsContainer) return;
    
    const html = `
      <!-- Sale Header -->
      <div class="sale-header">
        <div class="sale-title">
          <h1>สร้างการขายใหม่</h1>
          <span class="sale-subtitle">กรอกข้อมูลการขายและลูกค้า</span>
        </div>
      </div>
      
      <!-- Customer Selection -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-user"></i> ข้อมูลลูกค้า</h2>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="customer-select" class="form-label">เลือกลูกค้า</label>
            <div class="customer-selection">
              <select id="customer-select" class="form-input">
                <option value="">-- เลือกลูกค้า --</option>
                ${this.customers.map(customer => `
                  <option value="${customer.id}" ${selectedCustomer && selectedCustomer.id === customer.id ? 'selected' : ''}>
                    ${this.escapeHtml(customer.name)} (${this.escapeHtml(customer.phone || 'ไม่ระบุ')})
                  </option>
                `).join('')}
              </select>
              <button type="button" class="btn btn-outline" id="add-new-customer">
                <i class="fas fa-user-plus"></i> เพิ่มลูกค้าใหม่
              </button>
            </div>
            ${this.customers.length === 0 ? `
              <div class="info-note">
                <small>ระบบลูกค้าอยู่ระหว่างการพัฒนา - ข้อมูลลูกค้าจะถูกจำลองในการสาธิต</small>
              </div>
            ` : ''}
          </div>
          
          <div id="selected-customer-info" class="selected-customer-info" style="display: none;">
            <div class="customer-info-header">
              <h3>ข้อมูลลูกค้าที่เลือก</h3>
              <button type="button" class="btn-link" id="change-customer">เปลี่ยนลูกค้า</button>
            </div>
            <div class="customer-info-grid">
              <div class="info-item">
                <label>ชื่อ:</label>
                <span id="customer-name">-</span>
              </div>
              <div class="info-item">
                <label>เบอร์โทร:</label>
                <span id="customer-phone">-</span>
              </div>
              <div class="info-item">
                <label>อีเมล:</label>
                <span id="customer-email">-</span>
              </div>
              <div class="info-item">
                <label>ที่อยู่:</label>
                <span id="customer-address">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Product Selection -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-shopping-cart"></i> รายการสินค้า</h2>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">เพิ่มสินค้า</label>
            <div class="product-search">
              <input type="text" id="product-search" class="form-input" placeholder="ค้นหาสินค้าด้วยชื่อหรือรหัส...">
              <div id="product-search-results" class="search-results" style="display: none;"></div>
            </div>
          </div>
          
          <div class="selected-products">
            <div class="table-container">
              <table class="data-table" id="selected-products-table">
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>ราคาต่อหน่วย</th>
                    <th>จำนวน</th>
                    <th>ส่วนลด</th>
                    <th>ราคารวม</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedProduct ? this.createProductRow(selectedProduct) : `
                    <tr class="empty-row">
                      <td colspan="6" class="text-center">
                        <div class="empty-state-small">
                          <i class="fas fa-shopping-cart"></i>
                          <p>ยังไม่มีสินค้า กรุณาค้นหาและเพิ่มสินค้า</p>
                        </div>
                      </td>
                    </tr>
                  `}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right"><strong>ยอดรวมทั้งสิ้น:</strong></td>
                    <td class="total-price"><strong id="total-amount">฿${selectedProduct ? selectedProduct.price.toLocaleString() : '0'}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ${selectedProduct ? `
              <div class="selected-product-info">
                <div class="info-badge">
                  <i class="fas fa-check-circle"></i>
                  <span>เพิ่มสินค้าจากการเลือกเรียบร้อยแล้ว</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Delivery Information -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-truck"></i> ข้อมูลการจัดส่ง</h2>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="delivery-method" class="form-label">วิธีการจัดส่ง</label>
              <select id="delivery-method" class="form-input">
                <option value="บริการส่งถึงบ้าน">บริการส่งถึงบ้าน</option>
                <option value="รับที่ร้าน">รับที่ร้าน</option>
                <option value="ส่งทางไปรษณีย์">ส่งทางไปรษณีย์</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="delivery-date" class="form-label">วันที่จัดส่ง</label>
              <input type="date" id="delivery-date" class="form-input">
            </div>
          </div>
          
          <div class="form-group">
            <label for="delivery-address" class="form-label">ที่อยู่จัดส่ง</label>
            <textarea id="delivery-address" class="form-input" rows="3" placeholder="กรอกที่อยู่จัดส่ง..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="delivery-notes" class="form-label">หมายเหตุการจัดส่ง</label>
            <textarea id="delivery-notes" class="form-input" rows="2" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."></textarea>
          </div>
        </div>
      </div>
      
      <!-- Payment Information -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-credit-card"></i> ข้อมูลการชำระเงิน</h2>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="payment-method" class="form-label">วิธีการชำระเงิน</label>
              <select id="payment-method" class="form-input">
                <option value="เงินสด">เงินสด</option>
                <option value="โอนเงิน">โอนเงิน</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
                <option value="เงินเชื่อ">เงินเชื่อ</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="payment-status" class="form-label">สถานะการชำระเงิน</label>
              <select id="payment-status" class="form-input">
                <option value="รอชำระเงิน">รอชำระเงิน</option>
                <option value="ชำระเงินแล้ว">ชำระเงินแล้ว</option>
              </select>
            </div>
          </div>
          
          <div id="payment-details" style="display: none;">
            <div class="form-grid">
              <div class="form-group">
                <label for="payment-date" class="form-label">วันที่ชำระเงิน</label>
                <input type="date" id="payment-date" class="form-input">
              </div>
              
              <div class="form-group">
                <label for="payment-reference" class="form-label">เลขที่อ้างอิง</label>
                <input type="text" id="payment-reference" class="form-input" placeholder="เลขที่อ้างอิงการชำระเงิน...">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Notes -->
      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-sticky-note"></i> หมายเหตุเพิ่มเติม</h2>
        </div>
        <div class="card-body">
          <div class="form-group">
            <textarea id="sale-notes" class="form-input" rows="3" placeholder="กรอกหมายเหตุหรือข้อมูลเพิ่มเติมเกี่ยวกับการขาย..."></textarea>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="form-actions-footer">
        <button class="btn btn-outline" id="cancel-sale-bottom">
          <i class="fas fa-times"></i> ยกเลิก
        </button>
        <button class="btn btn-primary" id="save-draft-bottom" disabled>
          <i class="fas fa-save"></i> บันทึกร่าง
        </button>
        <button class="btn btn-success" id="create-sale-bottom" disabled>
          <i class="fas fa-check"></i> สร้างการขาย
        </button>
      </div>
    `;
    
    this.saleDetailsContainer.innerHTML = html;
    
    // Setup event listeners for new sale form
    this.setupNewSaleEventListeners();
    
    // Initialize form values
    this.initializeFormDefaults();
    
    // If selected product provided, validate form immediately
    if (selectedProduct) {
      setTimeout(() => {
        this.validateForm();
        if (window.InfoHubApp) {
          window.InfoHubApp.showNotification(
            `เพิ่มสินค้า "${selectedProduct.name}" เรียบร้อยแล้ว`, 
            'success'
          );
        }
      }, 500);
    }
    
    // Add custom CSS for this page
    this.addCustomStyles();
  }
  
  /**
   * Create product row HTML
   * @param {Object} product - Product data
   * @returns {string} - HTML string
   */
  createProductRow(product) {
    return `
      <tr data-product-id="${product.id}">
        <td>
          <div class="product-brief">
            <div class="product-thumbnail">
              ${product.images && product.images.length > 0 ? `
                <img src="${this.escapeHtml(product.images[0])}" alt="${this.escapeHtml(product.name)}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="image-placeholder" style="display: none;">
                  <i class="fas fa-image"></i>
                </div>
              ` : `
                <div class="image-placeholder">
                  <i class="fas fa-image"></i>
                </div>
              `}
            </div>
            <div class="product-info">
              <p class="product-name">${this.escapeHtml(product.name)}</p>
              <p class="product-code">${this.escapeHtml(product.id)}</p>
            </div>
          </div>
        </td>
        <td class="unit-price" data-price="${product.price}">฿${product.price.toLocaleString()}</td>
        <td>
          <input type="number" class="quantity-input" value="1" min="1" max="${product.stock || 999}">
        </td>
        <td>
          <input type="number" class="discount-input" value="0" min="0" max="${product.price}" placeholder="฿">
        </td>
        <td class="item-total">฿${product.price.toLocaleString()}</td>
        <td>
          <button type="button" class="btn-icon remove-product" title="ลบสินค้า">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }
  
  /**
   * Setup event listeners for new sale form
   */
  setupNewSaleEventListeners() {
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('#cancel-sale, #cancel-sale-bottom');
    cancelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('คุณต้องการยกเลิกการสร้างการขายหรือไม่? ข้อมูลที่กรอกจะหายไป')) {
          window.location.href = 'sales-report.html';
        }
      });
    });
    
    // Customer selection
    const customerSelect = document.getElementById('customer-select');
    if (customerSelect) {
      customerSelect.addEventListener('change', (e) => {
        this.handleCustomerSelection(e.target.value);
      });
    }
    
    // Add new customer
    const addCustomerBtn = document.getElementById('add-new-customer');
    if (addCustomerBtn) {
      addCustomerBtn.addEventListener('click', () => {
        this.showAddCustomerModal();
      });
    }
    
    // Change customer
    const changeCustomerBtn = document.getElementById('change-customer');
    if (changeCustomerBtn) {
      changeCustomerBtn.addEventListener('click', () => {
        const customerSelect = document.getElementById('customer-select');
        const customerInfo = document.getElementById('selected-customer-info');
        if (customerSelect && customerInfo) {
          customerSelect.value = '';
          customerInfo.style.display = 'none';
          this.validateForm();
        }
      });
    }
    
    // Product search
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
      let searchTimeout;
      productSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleProductSearch(e.target.value);
        }, 300);
      });
    }
    
    // Payment status change
    const paymentStatus = document.getElementById('payment-status');
    if (paymentStatus) {
      paymentStatus.addEventListener('change', (e) => {
        this.togglePaymentDetails(e.target.value === 'ชำระเงินแล้ว');
      });
    }
    
    // Form inputs for validation
    const formInputs = document.querySelectorAll('.form-input, .quantity-input, .discount-input');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.validateForm();
      });
    });
    
    // Quantity and discount changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('quantity-input') || e.target.classList.contains('discount-input')) {
        this.updateProductTotals();
      }
    });
    
    // Remove product buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-product')) {
        const row = e.target.closest('tr');
        if (row && confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
          this.removeProductRow(row);
        }
      }
    });
    
    // Save and create buttons
    const saveButtons = document.querySelectorAll('#save-draft, #save-draft-bottom');
    const createButtons = document.querySelectorAll('#create-sale, #create-sale-bottom');
    
    saveButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleSaveDraft();
      });
    });
    
    createButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleCreateSale();
      });
    });
  }
  
  /**
   * Initialize form defaults
   */
  initializeFormDefaults() {
    // Set default delivery date (3 days from now)
    const deliveryDate = document.getElementById('delivery-date');
    if (deliveryDate) {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      deliveryDate.value = date.toISOString().split('T')[0];
    }
    
    // Set default payment date (today)
    const paymentDate = document.getElementById('payment-date');
    if (paymentDate) {
      paymentDate.value = new Date().toISOString().split('T')[0];
    }
  }
  
  /**
   * Handle customer selection
   * @param {string} customerId - Selected customer ID
   */
  async handleCustomerSelection(customerId) {
    const customerInfo = document.getElementById('selected-customer-info');
    
    if (!customerId || !customerInfo) {
      if (customerInfo) customerInfo.style.display = 'none';
      return;
    }
    
    // Find customer in loaded data or create mock data
    let customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      // Create mock customer for demo
      const select = document.getElementById('customer-select');
      const selectedOption = select.querySelector(`option[value="${customerId}"]`);
      if (selectedOption) {
        const text = selectedOption.textContent;
        const name = text.split('(')[0].trim();
        const phone = text.match(/\((.*?)\)/)?.[1] || '';
        
        customer = {
          id: customerId,
          name: name,
          phone: phone,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          address: 'ที่อยู่ลูกค้าตัวอย่าง'
        };
      }
    }
    
    if (customer) {
      this.populateCustomerInfo(customer);
    }
  }
  
  /**
   * Populate customer information
   * @param {Object} customer - Customer data
   */
  populateCustomerInfo(customer) {
    const customerInfo = document.getElementById('selected-customer-info');
    const nameElement = document.getElementById('customer-name');
    const phoneElement = document.getElementById('customer-phone');
    const emailElement = document.getElementById('customer-email');
    const addressElement = document.getElementById('customer-address');
    const deliveryAddress = document.getElementById('delivery-address');
    
    if (customerInfo && nameElement && phoneElement && emailElement && addressElement) {
      nameElement.textContent = customer.name || 'ไม่ระบุ';
      phoneElement.textContent = customer.phone || 'ไม่ระบุ';
      emailElement.textContent = customer.email || 'ไม่ระบุ';
      addressElement.textContent = customer.address || 'ไม่ระบุ';
      
      customerInfo.style.display = 'block';
      
      // Auto-fill delivery address
      if (deliveryAddress && customer.address) {
        deliveryAddress.value = customer.address;
      }
      
      this.validateForm();
    }
  }
  
  /**
   * Show add customer modal
   */
  showAddCustomerModal() {
    const template = document.getElementById('new-customer-modal-template');
    if (!template) return;
    
    const modalContent = template.content.cloneNode(true);
    const modalElement = document.createElement('div');
    modalElement.appendChild(modalContent);
    
    document.body.appendChild(modalElement);
    
    // Setup modal event listeners
    const closeButtons = modalElement.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modalElement.remove();
      });
    });
    
    const confirmBtn = modalElement.querySelector('#confirm-add-customer');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.handleAddNewCustomer(modalElement);
      });
    }
  }
  
  /**
   * Handle adding new customer
   * @param {HTMLElement} modalElement - Modal element
   */
  handleAddNewCustomer(modalElement) {
    const name = modalElement.querySelector('#new-customer-name').value.trim();
    const phone = modalElement.querySelector('#new-customer-phone').value.trim();
    const email = modalElement.querySelector('#new-customer-email').value.trim();
    const address = modalElement.querySelector('#new-customer-address').value.trim();
    
    if (!name || !phone) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }
    
    // Create new customer
    const newCustomer = {
      id: `NEW-${Date.now()}`,
      name: name,
      phone: phone,
      email: email,
      address: address
    };
    
    // Add to customers list
    this.customers.push(newCustomer);
    
    // Add to select options
    const customerSelect = document.getElementById('customer-select');
    if (customerSelect) {
      const option = document.createElement('option');
      option.value = newCustomer.id;
      option.textContent = `${newCustomer.name} (${newCustomer.phone})`;
      option.selected = true;
      customerSelect.appendChild(option);
      
      // Populate customer info
      this.populateCustomerInfo(newCustomer);
    }
    
    modalElement.remove();
    
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('เพิ่มลูกค้าใหม่เรียบร้อยแล้ว', 'success');
    }
  }
  
  /**
   * Handle product search
   * @param {string} query - Search query
   */
  async handleProductSearch(query) {
    const resultsContainer = document.getElementById('product-search-results');
    if (!resultsContainer || !query.trim()) {
      if (resultsContainer) resultsContainer.style.display = 'none';
      return;
    }
    
    try {
      // Search products
      const results = this.products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.id.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limit to 5 results
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item no-results">ไม่พบสินค้าที่ตรงกับการค้นหา</div>';
        resultsContainer.style.display = 'block';
        return;
      }
      
      const html = results.map(product => `
        <div class="search-result-item" data-product-id="${product.id}">
          <div class="result-image">
            ${product.images && product.images.length > 0 ? `
              <img src="${this.escapeHtml(product.images[0])}" alt="${this.escapeHtml(product.name)}">
            ` : `
              <div class="image-placeholder-small">
                <i class="fas fa-image"></i>
              </div>
            `}
          </div>
          <div class="result-info">
            <div class="result-name">${this.escapeHtml(product.name)}</div>
            <div class="result-details">
              <span class="result-code">${this.escapeHtml(product.id)}</span>
              <span class="result-price">฿${product.price.toLocaleString()}</span>
            </div>
            <div class="result-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${product.stock > 0 ? `มีสินค้า (${product.stock})` : 'สินค้าหมด'}
            </div>
          </div>
        </div>
      `).join('');
      
      resultsContainer.innerHTML = html;
      resultsContainer.style.display = 'block';
      
      // Setup click handlers
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const productId = item.getAttribute('data-product-id');
          this.addProductToSale(productId);
          resultsContainer.style.display = 'none';
          document.getElementById('product-search').value = '';
        });
      });
      
    } catch (error) {
      console.error('Error searching products:', error);
    }
  }
  
  /**
   * Add product to sale
   * @param {string} productId - Product ID
   */
  addProductToSale(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    const tbody = document.querySelector('#selected-products-table tbody');
    const emptyRow = tbody.querySelector('.empty-row');
    
    // Check if product already exists
    const existingRow = tbody.querySelector(`tr[data-product-id="${productId}"]`);
    if (existingRow) {
      // Increase quantity
      const quantityInput = existingRow.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        this.updateProductTotals();
      }
      return;
    }
    
    // Remove empty row if exists
    if (emptyRow) {
      emptyRow.remove();
    }
    
    // Add new product row
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-product-id', productId);
    newRow.innerHTML = this.createProductRow(product).replace(/<tr[^>]*>|<\/tr>/g, '');
    
    tbody.appendChild(newRow);
    
    // Update totals and validate form
    this.updateProductTotals();
    this.validateForm();
    
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification(`เพิ่มสินค้า "${product.name}" เรียบร้อยแล้ว`, 'success');
    }
  }
  
  /**
   * Remove product row
   * @param {HTMLElement} row - Product row element
   */
  removeProductRow(row) {
    const tbody = row.parentElement;
    row.remove();
    
    // Check if no products left
    const remainingRows = tbody.querySelectorAll('tr:not(.empty-row)');
    if (remainingRows.length === 0) {
      tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6" class="text-center">
            <div class="empty-state-small">
              <i class="fas fa-shopping-cart"></i>
              <p>ยังไม่มีสินค้า กรุณาค้นหาและเพิ่มสินค้า</p>
            </div>
          </td>
        </tr>
      `;
    }
    
    this.updateProductTotals();
    this.validateForm();
  }
  
  /**
   * Update product totals
   */
  updateProductTotals() {
    const tbody = document.querySelector('#selected-products-table tbody');
    const totalElement = document.getElementById('total-amount');
    
    if (!tbody || !totalElement) return;
    
    let grandTotal = 0;
    
    tbody.querySelectorAll('tr[data-product-id]').forEach(row => {
      const unitPriceElement = row.querySelector('.unit-price');
      const quantityInput = row.querySelector('.quantity-input');
      const discountInput = row.querySelector('.discount-input');
      const itemTotalElement = row.querySelector('.item-total');
      
      if (unitPriceElement && quantityInput && discountInput && itemTotalElement) {
        const unitPrice = parseFloat(unitPriceElement.getAttribute('data-price')) || 0;
        const quantity = parseInt(quantityInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        
        const itemTotal = Math.max(0, (unitPrice * quantity) - discount);
        itemTotalElement.textContent = `฿${itemTotal.toLocaleString()}`;
        
        grandTotal += itemTotal;
      }
    });
    
    totalElement.textContent = `฿${grandTotal.toLocaleString()}`;
  }
  
  /**
   * Toggle payment details visibility
   * @param {boolean} show - Whether to show payment details
   */
  togglePaymentDetails(show) {
    const paymentDetails = document.getElementById('payment-details');
    if (paymentDetails) {
      paymentDetails.style.display = show ? 'block' : 'none';
    }
  }
  
  /**
   * Validate form and enable/disable buttons
   */
  validateForm() {
    const customerSelect = document.getElementById('customer-select');
    const productRows = document.querySelectorAll('#selected-products-table tbody tr[data-product-id]');
    const deliveryAddress = document.getElementById('delivery-address');
    
    const isValid = customerSelect?.value && 
                   productRows.length > 0 && 
                   deliveryAddress?.value.trim();
    
    // Enable/disable buttons
    const buttons = document.querySelectorAll('#save-draft, #save-draft-bottom, #create-sale, #create-sale-bottom');
    buttons.forEach(btn => {
      btn.disabled = !isValid;
    });
  }
  
  /**
   * Handle save draft
   */
  handleSaveDraft() {
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('บันทึกร่างการขายเรียบร้อยแล้ว', 'success');
    }
    
    setTimeout(() => {
      window.location.href = 'sales-report.html';
    }, 1500);
  }
  
  /**
   * Handle create sale
   */
  handleCreateSale() {
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('สร้างการขายเรียบร้อยแล้ว', 'success');
    }
    
    setTimeout(() => {
      // Redirect to a demo sale details page
      window.location.href = 'sale-details.html?id=DEMO-SALE-001';
    }, 1500);
  }
  
  /**
   * Render sales system under development message
   * @param {string} saleId - Sale ID
   */
  renderSalesSystemUnderDevelopment(saleId) {
    if (!this.saleDetailsContainer) return;
    
    const html = `
      <div class="development-notice">
        <div class="notice-icon">
          <i class="fas fa-tools"></i>
        </div>
        <div class="notice-content">
          <h2>ระบบการขายอยู่ระหว่างการพัฒนา</h2>
          <p>ขณะนี้ระบบจัดการข้อมูลการขายยังอยู่ระหว่างการพัฒนา</p>
          <div class="notice-details">
            <p><strong>รหัสการขาย:</strong> ${this.escapeHtml(saleId)}</p>
            <p><strong>สถานะ:</strong> ระบบยังไม่พร้อมใช้งาน</p>
          </div>
          <div class="notice-actions">
            <a href="sales-report.html" class="btn btn-primary">
              <i class="fas fa-arrow-left"></i> กลับไปหน้าติดตามการขาย
            </a>
            <button class="btn btn-outline" onclick="location.reload()">
              <i class="fas fa-redo"></i> รีเฟรช
            </button>
          </div>
          <div class="development-info">
            <h3>ฟีเจอร์ที่กำลังพัฒนา:</h3>
            <ul>
              <li>ระบบจัดการข้อมูลการขาย</li>
              <li>ระบบติดตามสถานะการขาย</li>
              <li>ระบบจัดการเอกสารการขาย</li>
              <li>ระบบรายงานการขาย</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    this.saleDetailsContainer.innerHTML = html;
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
   * @param {string} message - Error message
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
  }
  
  /**
   * Add custom styles for sale form
   */
  addCustomStyles() {
    const styleId = 'sale-form-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .selected-product-info {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .info-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #0369a1;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .info-badge i {
        color: #059669;
      }
      
      .customer-selection {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      
      .customer-selection select {
        flex: 1;
      }
      
      .customer-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      
      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .info-item label {
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
      }
      
      .info-item span {
        color: #6b7280;
      }
      
      .product-search {
        position: relative;
      }
      
      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .search-result-item {
        padding: 0.75rem;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: background-color 0.2s;
      }
      
      .search-result-item:hover {
        background-color: #f9fafb;
      }
      
      .search-result-item.no-results {
        justify-content: center;
        color: #6b7280;
        font-style: italic;
        cursor: default;
      }
      
      .result-image {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
      }
      
      .result-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 0.375rem;
      }
      
      .image-placeholder-small {
        width: 100%;
        height: 100%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        color: #9ca3af;
      }
      
      .result-info {
        flex: 1;
      }
      
      .result-name {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      
      .result-details {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.25rem;
      }
      
      .result-code {
        font-size: 0.875rem;
        color: #6b7280;
        font-family: monospace;
      }
      
      .result-price {
        font-size: 0.875rem;
        font-weight: 600;
        color: #059669;
      }
      
      .result-stock {
        font-size: 0.75rem;
        font-weight: 500;
      }
      
      .result-stock.in-stock {
        color: #059669;
      }
      
      .result-stock.out-of-stock {
        color: #dc2626;
      }
      
      .development-notice {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        text-align: center;
        background: #fafafa;
        border-radius: 1rem;
        margin: 2rem 0;
      }
      
      .notice-icon {
        font-size: 4rem;
        color: #f59e0b;
        margin-bottom: 1.5rem;
      }
      
      .notice-content h2 {
        font-size: 1.5rem;
        color: #374151;
        margin-bottom: 0.5rem;
      }
      
      .notice-content p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }
      
      .notice-details {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        border: 1px solid #e5e7eb;
      }
      
      .notice-actions {
        display: flex;
        gap: 1rem;
        margin: 1.5rem 0;
      }
      
      .development-info {
        margin-top: 2rem;
        text-align: left;
        max-width: 500px;
      }
      
      .development-info h3 {
        color: #374151;
        margin-bottom: 1rem;
      }
      
      .development-info ul {
        color: #6b7280;
        padding-left: 1.5rem;
      }
      
      .development-info li {
        margin-bottom: 0.5rem;
      }
      
      .form-actions-footer {
        position: sticky;
        bottom: 0;
        background: white;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin: 2rem -1.5rem -1.5rem -1.5rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .empty-state-small {
        padding: 2rem;
        color: #6b7280;
      }
      
      .empty-state-small i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }
      
      .info-note {
        margin-top: 0.5rem;
        color: #6b7280;
      }
      
      .info-note i {
        margin-right: 0.25rem;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped HTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize sale controller
const saleController = new SaleController();

export default saleController;