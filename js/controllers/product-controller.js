/**
 * InfoHub 360 - Product Controller
 * 
 * Controller สำหรับจัดการข้อมูลสินค้าเฉพาะ
 * ทำงานร่วมกับ scripts.js และ data-service.js
 */

import dataService from '../services/data-service.js';

class ProductController {
  constructor() {
    this.products = [];
    this.currentSearchParams = {};
    this.isLoading = false;
    
    // DOM Elements
    this.productList = document.getElementById('product-list');
    this.resultsTitle = document.getElementById('results-title');
    this.resultsCount = document.getElementById('results-count');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.emptyState = document.getElementById('empty-state');
    
    // Initialize only if we're on a page that handles products
    if (this.productList) {
      this.init();
    }
  }
  
  /**
   * Initialize product controller
   */
  init() {
    console.log('Product Controller initializing...');
    
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
   * Setup event listeners
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
    // Add to sale buttons
    const addSaleButtons = document.querySelectorAll('.product-add-sale');
    addSaleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = button.getAttribute('data-product-id');
        window.location.href = `sale-details.html?action=new&product=${encodeURIComponent(productId)}`;
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