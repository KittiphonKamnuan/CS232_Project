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
        e.preventDefault();
        const productId = button.getAttribute('data-product-id');
        console.log('Add sale clicked for product:', productId);
        
        // เปลี่ยนจาก sale-details.html เป็น product-details.html
        window.location.href = `product-details.html?id=${encodeURIComponent(productId)}`;
      });
    });
    
    // Share buttons - แก้ไขให้ใช้งานได้
    const shareButtons = document.querySelectorAll('.product-share');
    console.log('Found share buttons:', shareButtons.length);
    
    shareButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const productId = button.getAttribute('data-product-id');
        console.log('Share clicked for product:', productId);
        
        // เพิ่ม loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังโหลด...';
        button.disabled = true;
        
        try {
          const product = await dataService.getProductById(productId);
          console.log('Product loaded for share:', product);
          this.showShareModal(product);
        } catch (error) {
          console.error('Error loading product for share:', error);
          if (window.InfoHubApp) {
            window.InfoHubApp.showNotification('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
          } else {
            alert('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง');
          }
        } finally {
          // คืนค่าปุ่มเดิม
          button.innerHTML = originalText;
          button.disabled = false;
        }
      });
    });
    
    // Product card clicks (for navigation to details)
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons or links
        if (e.target.closest('button') || e.target.closest('a')) {
          console.log('Clicked on button/link, not navigating');
          return;
        }
        
        const productId = card.getAttribute('data-product-id');
        console.log('Card clicked, navigating to product:', productId);
        window.location.href = `product-details.html?id=${encodeURIComponent(productId)}`;
      });
    });
  }
  
  /**
   * Show share modal for product - แก้ไขปัญหา modal หายเร็ว
   * @param {Object} product - Product data
   */
  showShareModal(product) {
    console.log('Showing share modal for product:', product);
    
    // ลบ modal เก่าถ้ามี
    const existingModal = document.querySelector('.share-modal-backdrop');
    if (existingModal) {
      existingModal.remove();
    }
    
    // สร้าง modal ใหม่
    const modal = document.createElement('div');
    modal.className = 'share-modal-backdrop';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    modal.innerHTML = `
      <div class="share-modal" style="
        background: white;
        border-radius: 0.5rem;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      ">
        <div class="modal-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        ">
          <h2 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0;">
            ส่งข้อมูลให้ลูกค้า
          </h2>
          <button class="modal-close-btn" type="button" style="
            background: none;
            border: none;
            font-size: 1.25rem;
            color: #6b7280;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.25rem;
            transition: all 0.2s;
          ">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem; flex: 1;">
          <!-- Product Preview -->
          <div class="product-preview" style="
            background: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            gap: 1rem;
            align-items: center;
          ">
            <div class="preview-image" style="
              width: 80px;
              height: 80px;
              background: #e5e7eb;
              border-radius: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #9ca3af;
              flex-shrink: 0;
              overflow: hidden;
            ">
              ${product.images && product.images.length > 0 ? `
                <img src="${this.escapeHtml(product.images[0])}" 
                     alt="${this.escapeHtml(product.name)}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i>';">
             ` : '<i class="fas fa-image"></i>'}
           </div>
           <div class="preview-info" style="flex: 1;">
             <h3 style="font-weight: 600; margin: 0 0 0.5rem 0; color: #1f2937;">
               ${this.escapeHtml(product.name)}
             </h3>
             <p style="color: #6b7280; margin: 0 0 0.25rem 0; font-size: 0.875rem;">
               รหัสสินค้า: ${this.escapeHtml(product.id)}
             </p>
             <p style="color: #059669; font-weight: 600; margin: 0; font-size: 1.125rem;">
               ${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.price) : '฿' + product.price.toLocaleString()}
             </p>
           </div>
         </div>
         
         <!-- Document Selection -->
         <div style="margin-bottom: 1.5rem;">
           <h3 style="font-weight: 600; margin-bottom: 1rem; color: #374151;">
             เลือกข้อมูลที่ต้องการส่ง
           </h3>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
             <!-- Documents Column -->
             <div>
               <h4 style="font-weight: 500; margin-bottom: 0.75rem; color: #374151; font-size: 0.875rem;">
                 📄 เอกสารประกอบ
               </h4>
               <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" checked style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">สเปคสินค้า</span>
                 </label>
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">คู่มือการใช้งาน</span>
                 </label>
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" checked style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">เปรียบเทียบรุ่น</span>
                 </label>
               </div>
             </div>
             
             <!-- Info Column -->
             <div>
               <h4 style="font-weight: 500; margin-bottom: 0.75rem; color: #374151; font-size: 0.875rem;">
                 💰 ข้อมูลราคาและสต๊อก
               </h4>
               <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" checked style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">ราคาปัจจุบัน</span>
                 </label>
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" checked style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">สถานะสต๊อก</span>
                 </label>
                 <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.25rem; transition: background 0.2s;" 
                        onmouseover="this.style.background='#f3f4f6'" 
                        onmouseout="this.style.background='transparent'">
                   <input type="checkbox" style="cursor: pointer;"> 
                   <span style="font-size: 0.875rem;">ข้อมูลการจัดส่ง</span>
                 </label>
               </div>
             </div>
           </div>
         </div>
         
         <!-- Custom Message -->
         <div style="margin-bottom: 1.5rem;">
           <label style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151; font-size: 0.875rem;">
             💬 ข้อความเพิ่มเติม
           </label>
           <textarea 
             placeholder="เพิ่มข้อความส่วนตัวถึงลูกค้า เช่น 'สินค้านี้เหมาะกับคุณมาก ราคาดีที่สุด!'" 
             rows="3" 
             style="
               width: 100%; 
               padding: 0.75rem; 
               border: 1px solid #d1d5db; 
               border-radius: 0.375rem; 
               font-size: 0.875rem; 
               resize: vertical;
               font-family: inherit;
             "></textarea>
         </div>
         
         <!-- Info Notice -->
         <div style="
           background: #f0f9ff; 
           border: 1px solid #bfdbfe; 
           border-radius: 0.5rem; 
           padding: 1rem;
           display: flex;
           align-items: flex-start;
           gap: 0.75rem;
         ">
           <div style="color: #3b82f6; font-size: 1.25rem; flex-shrink: 0; margin-top: 0.125rem;">
             <i class="fas fa-info-circle"></i>
           </div>
           <div>
             <h4 style="color: #1e40af; font-weight: 600; margin: 0 0 0.5rem 0; font-size: 0.875rem;">
               ตัวอย่างการแชร์ข้อมูล
             </h4>
             <p style="color: #1e40af; margin: 0; font-size: 0.875rem; line-height: 1.4;">
               ระบบส่งข้อมูลให้ลูกค้าอยู่ระหว่างการพัฒนา ขณะนี้เป็นเพียงการแสดงตัวอย่างเท่านั้น<br>
               ในอนาคตจะสามารถส่งผ่าน LINE, อีเมล, หรือ SMS ได้
             </p>
           </div>
         </div>
       </div>
       
       <div class="modal-footer" style="
         display: flex;
         justify-content: flex-end;
         gap: 1rem;
         padding: 1.5rem;
         border-top: 1px solid #e5e7eb;
         background: #f9fafb;
       ">
         <button type="button" class="cancel-btn" style="
           padding: 0.75rem 1.5rem;
           border: 1px solid #d1d5db;
           background: white;
           color: #6b7280;
           border-radius: 0.375rem;
           cursor: pointer;
           font-weight: 500;
           transition: all 0.2s;
         ">
           ยกเลิก
         </button>
         <button type="button" class="demo-send-btn" style="
           padding: 0.75rem 1.5rem;
           border: 1px solid #3b82f6;
           background: #3b82f6;
           color: white;
           border-radius: 0.375rem;
           cursor: pointer;
           font-weight: 600;
           transition: all 0.2s;
           display: flex;
           align-items: center;
           gap: 0.5rem;
         ">
           <i class="fas fa-paper-plane"></i>
           แสดงตัวอย่าง
         </button>
       </div>
     </div>
   `;
   
   // เพิ่ม modal เข้า DOM
   document.body.appendChild(modal);
   
   // แสดง modal พร้อม animation
   setTimeout(() => {
     modal.style.opacity = '1';
     const modalContent = modal.querySelector('.share-modal');
     if (modalContent) {
       modalContent.style.transform = 'scale(1)';
     }
   }, 10);
   
   // Setup event listeners
   this.setupShareModalListeners(modal, product);
   
   // Prevent body scroll
   document.body.style.overflow = 'hidden';
 }

 /**
  * Setup event listeners for share modal
  * @param {HTMLElement} modal - Modal element
  * @param {Object} product - Product data
  */
 setupShareModalListeners(modal, product) {
   // Close button
   const closeBtn = modal.querySelector('.modal-close-btn');
   if (closeBtn) {
     closeBtn.addEventListener('click', (e) => {
       e.preventDefault();
       e.stopPropagation();
       this.closeShareModal(modal);
     });
   }
   
   // Cancel button
   const cancelBtn = modal.querySelector('.cancel-btn');
   if (cancelBtn) {
     cancelBtn.addEventListener('click', (e) => {
       e.preventDefault();
       e.stopPropagation();
       this.closeShareModal(modal);
     });
   }
   
   // Demo send button
   const sendBtn = modal.querySelector('.demo-send-btn');
   if (sendBtn) {
     sendBtn.addEventListener('click', (e) => {
       e.preventDefault();
       e.stopPropagation();
       this.handleDemoSend(modal, product);
     });
   }
   
   // Backdrop click (แต่ไม่ให้ปิดง่ายๆ)
   modal.addEventListener('click', (e) => {
     if (e.target === modal) {
       // เพิ่มการยืนยันก่อนปิด
       if (confirm('คุณต้องการปิดหน้าต่างนี้หรือไม่?')) {
         this.closeShareModal(modal);
       }
     }
   });
   
   // ESC key
   const handleEsc = (e) => {
     if (e.key === 'Escape') {
       this.closeShareModal(modal);
       document.removeEventListener('keydown', handleEsc);
     }
   };
   document.addEventListener('keydown', handleEsc);
   
   // เก็บ reference ของ handler เพื่อลบทีหลัง
   modal._escHandler = handleEsc;
   
   // Hover effects for buttons
   const buttons = modal.querySelectorAll('button');
   buttons.forEach(btn => {
     btn.addEventListener('mouseenter', () => {
       if (btn.classList.contains('cancel-btn')) {
         btn.style.background = '#f3f4f6';
         btn.style.borderColor = '#9ca3af';
       } else if (btn.classList.contains('demo-send-btn')) {
         btn.style.background = '#2563eb';
         btn.style.transform = 'translateY(-1px)';
       } else if (btn.classList.contains('modal-close-btn')) {
         btn.style.background = '#f3f4f6';
         btn.style.color = '#374151';
       }
     });
     
     btn.addEventListener('mouseleave', () => {
       if (btn.classList.contains('cancel-btn')) {
         btn.style.background = 'white';
         btn.style.borderColor = '#d1d5db';
       } else if (btn.classList.contains('demo-send-btn')) {
         btn.style.background = '#3b82f6';
         btn.style.transform = 'translateY(0)';
       } else if (btn.classList.contains('modal-close-btn')) {
         btn.style.background = 'none';
         btn.style.color = '#6b7280';
       }
     });
   });
 }

 /**
  * Close share modal with animation
  * @param {HTMLElement} modal - Modal element
  */
 closeShareModal(modal) {
   if (!modal || !modal.parentNode) return;
   
   const modalContent = modal.querySelector('.share-modal');
   
   // Animate out
   modal.style.opacity = '0';
   if (modalContent) {
     modalContent.style.transform = 'scale(0.9)';
   }
   
   setTimeout(() => {
     if (modal.parentNode) {
       modal.parentNode.removeChild(modal);
     }
     // Restore body scroll
     document.body.style.overflow = '';
     
     // Remove ESC listener
     if (modal._escHandler) {
       document.removeEventListener('keydown', modal._escHandler);
     }
   }, 300);
 }

 /**
  * Handle demo send action
  * @param {HTMLElement} modal - Modal element  
  * @param {Object} product - Product data
  */
 handleDemoSend(modal, product) {
   const sendBtn = modal.querySelector('.demo-send-btn');
   const originalContent = sendBtn.innerHTML;
   
   // Show loading
   sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่ง...';
   sendBtn.disabled = true;
   sendBtn.style.opacity = '0.7';
   
   // Get selected options
   const selectedDocs = [];
   const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
   checkboxes.forEach(checkbox => {
     const label = checkbox.closest('label');
     if (label) {
       const text = label.textContent.trim();
       if (text) selectedDocs.push(text);
     }
   });
   
   const customMessage = modal.querySelector('textarea').value.trim();
   
   // Simulate API call
   setTimeout(() => {
     // Replace modal content with success message
     const modalBody = modal.querySelector('.modal-body');
     modalBody.innerHTML = `
       <div style="text-align: center; padding: 2rem;">
         <div style="font-size: 4rem; color: #059669; margin-bottom: 1rem;">
           <i class="fas fa-check-circle"></i>
         </div>
         <h3 style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">
           จำลองการส่งข้อมูลสำเร็จ!
         </h3>
         
         <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; text-align: left;">
           <h4 style="color: #065f46; font-weight: 600; margin-bottom: 1rem;">📋 สรุปข้อมูลที่จะส่ง:</h4>
           <p style="color: #064e3b; margin-bottom: 0.5rem;"><strong>สินค้า:</strong> ${this.escapeHtml(product.name)}</p>
           <p style="color: #064e3b; margin-bottom: 0.5rem;"><strong>ราคา:</strong> ${window.InfoHubApp ? window.InfoHubApp.formatCurrency(product.price) : '฿' + product.price.toLocaleString()}</p>
           
           ${selectedDocs.length > 0 ? `
             <p style="color: #064e3b; margin-bottom: 0.5rem;"><strong>เอกสารที่เลือก:</strong></p>
             <ul style="color: #064e3b; margin: 0; padding-left: 1.5rem;">
               ${selectedDocs.map(doc => `<li>${this.escapeHtml(doc)}</li>`).join('')}
             </ul>
           ` : ''}
           
           ${customMessage ? `
             <p style="color: #064e3b; margin-top: 1rem; margin-bottom: 0.5rem;"><strong>ข้อความ:</strong></p>
             <p style="color: #064e3b; font-style: italic; background: white; padding: 0.75rem; border-radius: 0.25rem; margin: 0;">
               "${this.escapeHtml(customMessage)}"
             </p>
           ` : ''}
         </div>
         
         <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 0.5rem; padding: 1rem;">
           <p style="color: #92400e; font-size: 0.875rem; margin: 0;">
             <i class="fas fa-info-circle"></i>
             ระบบส่งข้อมูลจริงอยู่ระหว่างการพัฒนา<br>
             ในอนาคตจะสามารถส่งผ่าน LINE, อีเมล หรือ SMS ได้
           </p>
         </div>
       </div>
     `;
     
     // Update footer
     const footer = modal.querySelector('.modal-footer');
     footer.innerHTML = `
       <button type="button" class="close-success-btn" style="
         padding: 0.75rem 2rem;
         border: none;
         background: #059669;
         color: white;
         border-radius: 0.375rem;
         cursor: pointer;
         font-weight: 600;
         transition: all 0.2s;
       ">
         <i class="fas fa-check"></i> เรียบร้อย
       </button>
     `;
     
     // Setup close button
     const closeSuccessBtn = footer.querySelector('.close-success-btn');
     closeSuccessBtn.addEventListener('click', () => {
       this.closeShareModal(modal);
     });
     
     closeSuccessBtn.addEventListener('mouseenter', () => {
       closeSuccessBtn.style.background = '#047857';
       closeSuccessBtn.style.transform = 'translateY(-1px)';
     });
     
     closeSuccessBtn.addEventListener('mouseleave', () => {
       closeSuccessBtn.style.background = '#059669';
       closeSuccessBtn.style.transform = 'translateY(0)';
     });
     
     // Auto close after 5 seconds
     setTimeout(() => {
       this.closeShareModal(modal);
     }, 5000);
     
   }, 1500); // Simulate 1.5 second API call
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