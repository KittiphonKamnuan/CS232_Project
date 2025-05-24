/**
 * InfoHub 360 - Product Controller
 * 
 * Controller สำหรับจัดการข้อมูลสินค้าเฉพาะ
 * ทำงานร่วมกับ scripts.js และ data-service.js
 * Updated: เปลี่ยนลิงก์ "เพิ่มการขาย" ไปที่ product-details.html
 */

import dataService from '../services/data-service.js';

class ProductController {
  constructor() {
    this.products = [];
    this.currentSearchParams = {};
    this.isLoading = false;
    this.currentProduct = null; // สำหรับหน้า product-details
    
    // DOM Elements
    this.productList = document.getElementById('product-list');
    this.resultsTitle = document.getElementById('results-title');
    this.resultsCount = document.getElementById('results-count');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.emptyState = document.getElementById('empty-state');
    this.productDetailsContainer = document.getElementById('product-details');
    
    // Initialize based on current page
    this.initializePage();
  }
  
  /**
   * Initialize based on current page
   */
  initializePage() {
    if (this.productList) {
      // Product listing page (index.html)
      this.initProductListing();
    } else if (this.productDetailsContainer) {
      // Product details page (product-details.html)
      this.initProductDetails();
    }
  }
  
  /**
   * Initialize product listing functionality
   */
  initProductListing() {
    console.log('Product Controller initializing for product listing...');
    
    // Wait for app to be ready
    if (window.InfoHubApp && window.InfoHubApp.isAppReady()) {
      this.setupEventListeners();
      this.loadInitialProducts();
    } else {
      document.addEventListener('app-ready', () => {
        this.setupEventListeners();
        this.loadInitialProducts();
      });
    }
  }
  
  /**
   * Initialize product details functionality
   */
  initProductDetails() {
    console.log('Product Controller initializing for product details...');
    
    // Parse product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
      this.showError('ไม่พบรหัสสินค้าที่ต้องการ');
      return;
    }
    
    // Wait for app to be ready
    if (window.InfoHubApp && window.InfoHubApp.isAppReady()) {
      this.loadProductDetails(productId);
    } else {
      document.addEventListener('app-ready', () => {
        this.loadProductDetails(productId);
      });
    }
  }
  
  /**
   * Load product details
   * @param {string} productId - Product ID
   */
  async loadProductDetails(productId) {
    try {
      this.showLoading();
      
      const product = await dataService.getProductById(productId);
      this.currentProduct = product;
      
      this.displayProductDetails(product);
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('โหลดข้อมูลสินค้าเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error loading product details:', error);
      this.showError('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Display product details
   * @param {Object} product - Product data
   */
  displayProductDetails(product) {
    if (!this.productDetailsContainer) return;
    
    const hasDocuments = product.documents && (product.documents.specs || product.documents.manual || product.documents.compare);
    const imageGallery = product.images && product.images.length > 0 ? product.images : [null];
    
    const html = `
      <!-- Product Header -->
      <div class="product-header">
        <div class="product-title-section">
          <h1 class="product-title">${this.escapeHtml(product.name)}</h1>
          <p class="product-code">รหัสสินค้า: <span class="code-value">${this.escapeHtml(product.id)}</span></p>
          <div class="product-brand">
            <span class="brand-label">ยี่ห้อ:</span>
            <span class="brand-value">${this.escapeHtml(product.brand)}</span>
          </div>
        </div>
        
        <div class="product-actions-header">
          <button class="btn btn-primary btn-large" id="create-sale-btn">
            <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
          </button>
          <button class="btn btn-outline btn-large" id="share-product-btn">
            <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
          </button>
        </div>
      </div>
      
      <!-- Product Content -->
      <div class="product-content">
        <!-- Left Column - Images and Gallery -->
        <div class="product-left-column">
          <div class="product-gallery">
            <div class="main-image">
              ${imageGallery[0] ? `
                <img src="${this.escapeHtml(imageGallery[0])}" alt="${this.escapeHtml(product.name)}" 
                     id="main-product-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="image-placeholder main-placeholder" style="display: none;">
                  <i class="fas fa-image"></i>
                  <p>ไม่มีรูปภาพ</p>
                </div>
              ` : `
                <div class="image-placeholder main-placeholder">
                  <i class="fas fa-image"></i>
                  <p>ไม่มีรูปภาพ</p>
                </div>
              `}
            </div>
            
            ${imageGallery.length > 1 ? `
              <div class="image-thumbnails">
                ${imageGallery.map((image, index) => `
                  <div class="thumbnail ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                    ${image ? `
                      <img src="${this.escapeHtml(image)}" alt="รูปภาพ ${index + 1}"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                      <div class="image-placeholder thumb-placeholder" style="display: none;">
                        <i class="fas fa-image"></i>
                      </div>
                    ` : `
                      <div class="image-placeholder thumb-placeholder">
                        <i class="fas fa-image"></i>
                      </div>
                    `}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Right Column - Product Information -->
        <div class="product-right-column">
          <!-- Price and Stock -->
          <div class="product-info-card">
            <div class="price-section">
              <div class="current-price">
                ${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.price) : '฿' + product.price.toLocaleString('th-TH')}
              </div>
              ${product.originalPrice && product.originalPrice > product.price ? `
                <div class="price-details">
                  <span class="original-price">${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.originalPrice) : '฿' + product.originalPrice.toLocaleString('th-TH')}</span>
                  <span class="discount-badge">ลด ${product.discount}%</span>
                </div>
              ` : ''}
            </div>
            
            <div class="stock-section">
              <div class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                <i class="fas fa-circle"></i>
                <span>${product.stock > 0 ? 'มีสินค้า' : 'สินค้าหมด'}</span>
              </div>
              <div class="stock-count">คงเหลือ ${product.stock || 0} ชิ้น</div>
            </div>
          </div>
          
          <!-- Delivery Information -->
          <div class="product-info-card">
            <h3 class="card-title">
              <i class="fas fa-truck"></i> ข้อมูลการจัดส่ง
            </h3>
            <div class="delivery-info">
              <div class="delivery-item">
                <span class="delivery-label">ระยะเวลาจัดส่ง:</span>
                <span class="delivery-value">${this.escapeHtml(product.delivery?.estimatedDays || 'ไม่ระบุ')}</span>
              </div>
              <div class="delivery-item">
                <span class="delivery-label">วิธีการจัดส่ง:</span>
                <span class="delivery-value">${this.escapeHtml(product.delivery?.method || 'บริการส่งถึงบ้าน')}</span>
              </div>
              ${product.delivery?.freeShipping ? `
                <div class="delivery-highlight">
                  <i class="fas fa-gift"></i>
                  <span>ส่งฟรี!</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Specifications -->
          ${product.specifications ? `
            <div class="product-info-card">
              <h3 class="card-title">
                <i class="fas fa-list"></i> สเปคสินค้า
              </h3>
              <div class="specifications">
                ${Object.entries(product.specifications).map(([key, value]) => `
                  <div class="spec-item">
                    <span class="spec-label">${this.escapeHtml(key)}:</span>
                    <span class="spec-value">${this.escapeHtml(String(value))}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Documents -->
          ${hasDocuments ? `
            <div class="product-info-card">
              <h3 class="card-title">
                <i class="fas fa-file-pdf"></i> เอกสารประกอบ
              </h3>
              <div class="document-links">
                ${product.documents.specs ? `
                  <a href="${this.escapeHtml(product.documents.specs)}" target="_blank" class="doc-link">
                    <i class="fas fa-file-pdf"></i>
                    <span>สเปคสินค้า</span>
                    <i class="fas fa-external-link-alt"></i>
                  </a>
                ` : ''}
                ${product.documents.manual ? `
                  <a href="${this.escapeHtml(product.documents.manual)}" target="_blank" class="doc-link">
                    <i class="fas fa-file-pdf"></i>
                    <span>คู่มือการใช้งาน</span>
                    <i class="fas fa-external-link-alt"></i>
                  </a>
                ` : ''}
                ${product.documents.compare ? `
                  <a href="${this.escapeHtml(product.documents.compare)}" target="_blank" class="doc-link">
                    <i class="fas fa-file-pdf"></i>
                    <span>เปรียบเทียบรุ่น</span>
                    <i class="fas fa-external-link-alt"></i>
                  </a>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Product Description -->
      ${product.description ? `
        <div class="product-description-card">
          <h3 class="card-title">
            <i class="fas fa-info-circle"></i> รายละเอียดสินค้า
          </h3>
          <div class="description-content">
            <p>${this.escapeHtml(product.description)}</p>
          </div>
        </div>
      ` : ''}
      
      <!-- Action Buttons (Mobile Fixed) -->
      <div class="product-actions-mobile">
        <button class="btn btn-primary btn-mobile" id="create-sale-btn-mobile">
          <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
        </button>
        <button class="btn btn-outline btn-mobile" id="share-product-btn-mobile">
          <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
        </button>
      </div>
    `;
    
    this.productDetailsContainer.innerHTML = html;
    
    // Setup event listeners for product details
    this.setupProductDetailsEventListeners();
    
    // Setup image gallery functionality
    this.setupImageGallery();
    
    // Add custom styles for product details
    this.addProductDetailsStyles();
  }
  
  /**
   * Setup event listeners for product details page
   */
  setupProductDetailsEventListeners() {
    // Sale creation buttons
    const saleButtons = document.querySelectorAll('#create-sale-btn, #create-sale-btn-mobile');
    saleButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.handleCreateSale();
      });
    });
    
    // Share buttons
    const shareButtons = document.querySelectorAll('#share-product-btn, #share-product-btn-mobile');
    shareButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.showShareModal(this.currentProduct);
      });
    });
  }
  
  /**
   * Handle create sale action
   */
  handleCreateSale() {
    if (!this.currentProduct) return;
    
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('กำลังสร้างการขายใหม่...', 'info');
    }
    
    // Redirect to new sale page with product pre-selected
    setTimeout(() => {
      window.location.href = `sale-details.html?action=new&product=${encodeURIComponent(this.currentProduct.id)}`;
    }, 1000);
  }
  
  /**
   * Setup image gallery functionality
   */
  setupImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');
    
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        // Remove active class from all thumbnails
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        
        // Add active class to clicked thumbnail
        thumbnail.classList.add('active');
        
        // Update main image
        if (mainImage && this.currentProduct.images && this.currentProduct.images[index]) {
          mainImage.src = this.currentProduct.images[index];
        }
      });
    });
  }
  
  /**
   * Setup event listeners for product listing
   */
  setupEventListeners() {
    // Listen for search events from scripts.js
    document.addEventListener('search-triggered', (e) => {
      this.handleSearch(e.detail);
    });
    
    // Listen for retry events
    document.addEventListener('retry-requested', () => {
      this.loadInitialProducts();
    });
    
    // Listen for load more events
    document.addEventListener('load-more-requested', () => {
      // For future implementation
      console.log('Load more requested');
    });
  }
  
  /**
   * Load initial products
   */
  async loadInitialProducts() {
    try {
      this.showLoading();
      
      const products = await dataService.getProducts();
      this.products = products;
      
      this.displayProducts(products);
      this.updateResultsInfo(products.length, 'รายการสินค้าทั้งหมด');
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('โหลดข้อมูลสินค้าเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error loading initial products:', error);
      this.showError('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Handle search request
   * @param {Object} searchData - Search parameters
   */
  async handleSearch(searchData) {
    try {
      this.showLoading();
      this.currentSearchParams = searchData;
      
      const searchParams = {};
      if (searchData.keyword) searchParams.search = searchData.keyword;
      if (searchData.category) searchParams.category = searchData.category;
      
      const products = await dataService.searchProducts(searchParams);
      this.products = products;
      
      this.displayProducts(products);
      
      // Update title based on search
      let title = 'ผลการค้นหา';
      if (searchData.keyword) title += ` "${searchData.keyword}"`;
      if (searchData.category) title += ` ในหมวด "${searchData.category}"`;
      if (!searchData.keyword && !searchData.category) title = 'รายการสินค้าทั้งหมด';
      
      this.updateResultsInfo(products.length, title);
      
      if (products.length === 0) {
        if (window.InfoHubApp) {
          window.InfoHubApp.showNotification('ไม่พบสินค้าที่ตรงกับการค้นหา', 'warning');
        }
      }
      
    } catch (error) {
      console.error('Error searching products:', error);
      this.showError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * Display products in the UI
   * @param {Array} products - Array of products
   */
  displayProducts(products) {
    if (!this.productList) return;
    
    if (!products || products.length === 0) {
      this.showEmptyState();
      return;
    }
    
    this.hideEmptyState();
    
    const productsHTML = products.map(product => this.createProductCard(product)).join('');
    this.productList.innerHTML = productsHTML;
    
    // Setup product event listeners
    this.setupProductEventListeners();
  }
  
  /**
   * Create product card HTML
   * @param {Object} product - Product data
   * @returns {string} - HTML string
   */
  createProductCard(product) {
    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
    const hasDocuments = product.documents && (product.documents.specs || product.documents.manual || product.documents.compare);
    
    return `
      <div class="product-card" data-product-id="${this.escapeHtml(product.id)}">
        <div class="product-image">
          ${imageUrl ? `
            <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(product.name)}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="image-placeholder" style="display: none;">
              <i class="fas fa-image"></i>
              <p>ไม่มีรูปภาพ</p>
            </div>
          ` : `
            <div class="image-placeholder">
              <i class="fas fa-image"></i>
              <p>ไม่มีรูปภาพ</p>
            </div>
          `}
        </div>
        
        <div class="product-info">
          <h3 class="product-title">
            <a href="product-details.html?id=${encodeURIComponent(product.id)}">${this.escapeHtml(product.name)}</a>
          </h3>
          <p class="product-code">รหัส: ${this.escapeHtml(product.id)}</p>
          <p class="product-brand">ยี่ห้อ: ${this.escapeHtml(product.brand)}</p>
          
          <div class="product-stock">
            <span class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${product.stock > 0 ? 'มีสินค้า' : 'สินค้าหมด'}
            </span>
            <span class="stock-count">(เหลือ ${product.stock || 0} ชิ้น)</span>
          </div>
          
          <div class="product-price">
            <span class="current-price">${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.price) : '฿' + product.price.toLocaleString()}</span>
            ${product.originalPrice && product.originalPrice > product.price ? `
              <span class="original-price">${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.originalPrice) : '฿' + product.originalPrice.toLocaleString()}</span>
              <span class="discount-badge">-${product.discount}%</span>
            ` : ''}
          </div>
          
          <div class="product-delivery">
            <i class="fas fa-truck"></i>
            <span>${this.escapeHtml(product.delivery?.estimatedDays || 'ไม่ระบุ')}</span>
          </div>
          
          ${hasDocuments ? `
            <div class="product-documents">
              ${product.documents.specs ? `
                <a href="${this.escapeHtml(product.documents.specs)}" target="_blank" class="doc-link">
                  <i class="fas fa-file-pdf"></i> สเปค
                </a>
              ` : ''}
              ${product.documents.manual ? `
                <a href="${this.escapeHtml(product.documents.manual)}" target="_blank" class="doc-link">
                  <i class="fas fa-file-pdf"></i> คู่มือ
                </a>
              ` : ''}
              ${product.documents.compare ? `
                <a href="${this.escapeHtml(product.documents.compare)}" target="_blank" class="doc-link">
                  <i class="fas fa-file-pdf"></i> เปรียบเทียบ
                </a>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="product-actions">
          <button type="button" class="btn btn-primary product-add-sale" 
                  data-product-id="${this.escapeHtml(product.id)}">
            <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
          </button>
          <button type="button" class="btn btn-outline product-share" 
                  data-product-id="${this.escapeHtml(product.id)}">
            <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners for product cards
   */
  setupProductEventListeners() {
    // Add to sale buttons - เปลี่ยนให้ไปที่ product-details.html
    const addSaleButtons = document.querySelectorAll('.product-add-sale');
    addSaleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = button.getAttribute('data-product-id');
        // เปลี่ยนจาก sale-details.html เป็น product-details.html
        window.location.href = `product-details.html?id=${encodeURIComponent(productId)}`;
      });
    });
    
    // Share buttons
    const shareButtons = document.querySelectorAll('.product-share');
    shareButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const productId = button.getAttribute('data-product-id');
        
        try {
          const product = await dataService.getProductById(productId);
          this.showShareModal(product);
        } catch (error) {
          console.error('Error loading product for share:', error);
          if (window.InfoHubApp) {
            window.InfoHubApp.showNotification('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
          }
        }
      });
    });
    
    // Product card clicks (for navigation to details)
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons or links
        if (e.target.closest('button') || e.target.closest('a')) return;
        
        const productId = card.getAttribute('data-product-id');
        window.location.href = `product-details.html?id=${encodeURIComponent(productId)}`;
      });
    });
  }
  
  /**
   * Show share modal for product
   * @param {Object} product - Product data
   */
  showShareModal(product) {
    const template = document.getElementById('share-modal-template');
    if (!template) {
      console.error('Share modal template not found');
      return;
    }
    
    const modalContent = template.content.cloneNode(true);
    const modalElement = document.createElement('div');
    modalElement.appendChild(modalContent);
    
    // Update modal content with product data
    this.updateModalContent(modalElement, product);
    
    document.body.appendChild(modalElement);
    
    // Setup modal event listeners
    this.setupModalEventListeners(modalElement, product);
    
    // Show modal with animation
    setTimeout(() => {
      const backdrop = modalElement.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.style.display = 'flex';
      }
    }, 10);
  }
  
  /**
   * Update modal content with product data
   * @param {HTMLElement} modalElement - Modal element
   * @param {Object} product - Product data
   */
  updateModalContent(modalElement, product) {
    const previewTitle = modalElement.querySelector('.preview-title');
    const previewCode = modalElement.querySelector('.preview-code');
    const previewPrice = modalElement.querySelector('.preview-price');
    const previewThumbnail = modalElement.querySelector('.preview-thumbnail');
    
    if (previewTitle) previewTitle.textContent = product.name;
    if (previewCode) previewCode.textContent = `รหัสสินค้า: ${product.id}`;
    if (previewPrice) {
      previewPrice.textContent = window.InfoHubApp ? 
        window.InfoHubApp.formatCurrency(product.price) : 
        `฿${product.price.toLocaleString()}`;
    }
    
    if (previewThumbnail && product.images && product.images.length > 0) {
      previewThumbnail.innerHTML = `
        <img src="${this.escapeHtml(product.images[0])}" alt="${this.escapeHtml(product.name)}" 
             style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
             onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-image\'></i>';">
      `;
    }
  }
  
  /**
   * Setup modal event listeners
   * @param {HTMLElement} modalElement - Modal element
   * @param {Object} product - Product data
   */
  setupModalEventListeners(modalElement, product) {
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
    
    const sendButton = modalElement.querySelector('#modal-send-button');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.handleSendDocument(modalElement, product);
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
   * Handle send document action
   * @param {HTMLElement} modalElement - Modal element
   * @param {Object} product - Product data
   */
  handleSendDocument(modalElement, product) {
    const selectedDocs = [];
    const checkboxes = modalElement.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
      const label = modalElement.querySelector(`label[for="${checkbox.id}"]`);
      if (label) {
        selectedDocs.push(label.textContent.trim());
      }
    });
    
    const modalBody = modalElement.querySelector('.modal-body');
    modalBody.innerHTML = `
      <div class="modal-success">
        <div class="success-icon">
          <i class="fas fa-info-circle"></i>
        </div>
        <h3>ตัวอย่างการส่งข้อมูล</h3>
        <p>จะส่งข้อมูล "${this.escapeHtml(product.name)}"</p>
        ${selectedDocs.length > 0 ? `<p>พร้อมเอกสาร: ${selectedDocs.join(', ')}</p>` : ''}
        <div class="info-note">
          <small>ระบบส่งข้อมูลให้ลูกค้าอยู่ระหว่างการพัฒนา<br>
          ขณะนี้เป็นเพียงการแสดงตัวอย่างเท่านั้น</small>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      if (window.InfoHubApp) {
        window.InfoHubApp.closeModal(modalElement.querySelector('.modal-backdrop'));
      } else {
        modalElement.remove();
      }
    }, 3000);
  }
  
  /**
   * Add custom styles for product details page
   */
  addProductDetailsStyles() {
    const styleId = 'product-details-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .product-details-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
      }
      
      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .product-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      
      .product-code {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      
      .code-value {
        font-family: monospace;
        font-weight: 600;
        color: #374151;
      }
      
      .product-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
      
      .brand-label {
        color: #6b7280;
      }
      
      .brand-value {
        font-weight: 600;
        color: #374151;
      }
      
      .product-actions-header {
        display: flex;
        gap: 1rem;
        flex-shrink: 0;
      }
      
      .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .product-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      
      .product-gallery {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .main-image {
        width: 100%;
        aspect-ratio: 1;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        overflow: hidden;
        background: #f9fafb;
      }
      
      .main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .main-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 3rem;
      }
      
      .main-placeholder i {
        margin-bottom: 0.5rem;
      }
      
      .main-placeholder p {
        font-size: 1rem;
        margin: 0;
      }
      
      .image-thumbnails {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
      }
      
      .thumbnail {
        width: 80px;
        height: 80px;
        border-radius: 0.375rem;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: border-color 0.2s;
        flex-shrink: 0;
        background: #f9fafb;
      }
      
      .thumbnail.active {
        border-color: #3b82f6;
      }
      
      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 1.5rem;
      }
      
      .product-info-card {
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
      
      .price-section {
        margin-bottom: 1.5rem;
      }
      
      .current-price {
        font-size: 2rem;
        font-weight: 700;
        color: #059669;
        display: block;
        margin-bottom: 0.5rem;
      }
      
      .price-details {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .original-price {
        text-decoration: line-through;
        color: #9ca3af;
        font-size: 1.125rem;
      }
      
      .discount-badge {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        font-weight: 600;
      }
      
      .stock-section {
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
      }
      
      .stock-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      
      .stock-status.in-stock {
        color: #059669;
      }
      
      .stock-status.out-of-stock {
        color: #dc2626;
      }
      
      .stock-status i {
        font-size: 0.5rem;
      }
      
      .stock-count {
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      .delivery-info {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .delivery-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .delivery-label {
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      .delivery-value {
        font-weight: 600;
        color: #374151;
      }
      
      .delivery-highlight {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #059669;
        font-weight: 600;
        padding: 0.5rem;
        background: #f0fdf4;
        border-radius: 0.375rem;
      }
      
      .specifications {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .spec-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .spec-item:last-child {
        border-bottom: none;
      }
      
      .spec-label {
        color: #6b7280;
        font-size: 0.875rem;
        flex: 1;
      }
      
      .spec-value {
        font-weight: 600;
        color: #374151;
        text-align: right;
        flex: 1;
      }
      
      .document-links {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .doc-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 0.375rem;
        text-decoration: none;
        color: #374151;
        transition: background-color 0.2s;
      }
      
      .doc-link:hover {
        background: #f3f4f6;
      }
      
      .doc-link i:first-child {
        color: #dc2626;
        margin-right: 0.5rem;
      }
      
      .doc-link i:last-child {
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      .product-description-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }
      
      .description-content {
        color: #6b7280;
        line-height: 1.6;
      }
      
      .product-actions-mobile {
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
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .product-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
        
        .product-actions-header {
          display: none;
        }
        
        .product-actions-mobile {
          display: flex;
        }
        
        .product-content {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .product-title {
          font-size: 1.5rem;
        }
        
        .current-price {
          font-size: 1.75rem;
        }
        
        .product-details-container {
          padding: 0.5rem;
          margin-bottom: 80px;
        }
      }
      
      @media (max-width: 640px) {
        .delivery-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
        
        .spec-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }
        
        .spec-value {
          text-align: left;
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
    
    this.hideEmptyState();
    if (this.productList) {
      this.productList.innerHTML = '';
    }
  }
  
  /**
   * Show empty state
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
    }
    if (this.productList) {
      this.productList.innerHTML = '';
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
   * @param {number} count - Number of results
   * @param {string} title - Results title
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

// Initialize product controller
const productController = new ProductController();

export default productController;