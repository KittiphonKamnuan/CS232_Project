/**
* InfoHub 360 - Complete Product Controller
* รวมระบบ Multi-Select และ Direct Sale ในไฟล์เดียว
*/

import dataService from '../services/data-service.js';

class CompleteProductController {
 constructor() {
   this.products = [];
   this.currentSearchParams = {};
   this.isLoading = false;
   this.currentProduct = null;
   
   // Multi-Select System Properties
   this.selectedProducts = new Map();
   this.customers = [];
   this.isCartVisible = false;
   
   // Status Options
   this.statusOptions = [
     { value: 'สนใจ', label: 'สถานะ 1: ลูกค้าสนใจสินค้า' },
     { value: 'รอชำระเงิน', label: 'สถานะ 2: รอชำระเงิน' },
     { value: 'ชำระเงินแล้ว', label: 'สถานะ 3: ชำระเงินแล้ว' },
     { value: 'ส่งมอบสินค้า', label: 'สถานะ 4: ส่งมอบสินค้า' },
     { value: 'บริการหลังการขาย', label: 'สถานะ 5: บริการหลังการขาย' }
   ];
   
   // DOM Elements
   this.productList = document.getElementById('product-list');
   this.resultsTitle = document.getElementById('results-title');
   this.resultsCount = document.getElementById('results-count');
   this.loadingIndicator = document.getElementById('loading-indicator');
   this.errorMessage = document.getElementById('error-message');
   this.emptyState = document.getElementById('empty-state');
   this.productDetailsContainer = document.getElementById('product-details');
   
   // Initialize
   this.initializePage();
   this.loadCustomers();
   this.createCartButton();
 }
 
 /**
  * Initialize based on current page
  */
 initializePage() {
   if (this.productList) {
     this.initProductListing();
   } else if (this.productDetailsContainer) {
     this.initProductDetails();
   }
 }
 
 /**
  * Initialize product listing functionality
  */
 initProductListing() {
   console.log('Complete Product Controller initializing...');
   
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
   
   const urlParams = new URLSearchParams(window.location.search);
   const productId = urlParams.get('id');
   
   if (!productId) {
     this.showError('ไม่พบรหัสสินค้าที่ต้องการ');
     return;
   }
   
   if (window.InfoHubApp && window.InfoHubApp.isAppReady()) {
     this.loadProductDetails(productId);
   } else {
     document.addEventListener('app-ready', () => {
       this.loadProductDetails(productId);
     });
   }
 }
 
 /**
  * Load customers data
  */
 async loadCustomers() {
   try {
     this.customers = await dataService.getCustomers();
   } catch (error) {
     console.error('Error loading customers:', error);
     this.customers = [];
   }
 }
 
 /**
  * Create cart button (clipboard icon)
  */
 createCartButton() {
   if (document.getElementById('sales-clipboard-btn')) return;

   const cartButton = document.createElement('div');
   cartButton.id = 'sales-clipboard-btn';
   cartButton.className = 'sales-clipboard-btn';
   cartButton.style.cssText = `
     position: fixed;
     bottom: 2rem;
     right: 2rem;
     width: 70px;
     height: 70px;
     background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
     cursor: pointer;
     box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
     z-index: 1000;
     transition: all 0.3s ease;
     transform: scale(0);
     opacity: 0;
   `;

   cartButton.innerHTML = `
     <div style="position: relative; color: white;">
       <i class="fas fa-clipboard-list" style="font-size: 1.5rem;"></i>
       <span id="cart-count" style="
         position: absolute;
         top: -8px;
         right: -8px;
         background: #ef4444;
         color: white;
         border-radius: 50%;
         width: 24px;
         height: 24px;
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: 0.75rem;
         font-weight: bold;
         border: 2px solid white;
       ">0</span>
     </div>
   `;

   document.body.appendChild(cartButton);

   cartButton.addEventListener('mouseenter', () => {
     cartButton.style.transform = 'scale(1.1)';
     cartButton.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.6)';
   });

   cartButton.addEventListener('mouseleave', () => {
     cartButton.style.transform = 'scale(1)';
     cartButton.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.4)';
   });

   cartButton.addEventListener('click', () => {
     this.showMultiSelectModal();
   });
 }
 
 /**
  * Load product details
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
  * Display product details with all action buttons
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
          <button class="btn btn-primary btn-large" id="direct-sale-btn">
            <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
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
       <button class="btn btn-outline btn-mobile" id="share-product-btn-mobile" style="border-color: #6b7280; color: #6b7280;">
         <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
       </button>
       <button class="btn btn-outline btn-mobile" id="add-status-btn-mobile" style="border-color: #3b82f6; color: #3b82f6;">
         <i class="fas fa-plus-circle"></i> เพิ่มสถานะ
       </button>
     </div>
   `;
   
   this.productDetailsContainer.innerHTML = html;
   this.setupProductDetailsEventListeners();
   this.setupImageGallery();
 }
 
 /**
  * Setup event listeners for product details page
  */
 setupProductDetailsEventListeners() {
   // Direct Sale buttons
   const directSaleButtons = document.querySelectorAll('#direct-sale-btn, #direct-sale-btn-alt, #direct-sale-btn-mobile');
   directSaleButtons.forEach(button => {
     button.addEventListener('click', () => {
       this.handleDirectSale();
     });
   });
   
   // Add Status buttons
   const addStatusButtons = document.querySelectorAll('#add-status-btn, #add-status-btn-alt, #add-status-btn-mobile');
   addStatusButtons.forEach(button => {
     button.addEventListener('click', () => {
       this.handleAddStatus();
     });
   });
   
   // Share buttons
   const shareButtons = document.querySelectorAll('#share-product-btn, #share-product-btn-alt, #share-product-btn-mobile');
   shareButtons.forEach(button => {
     button.addEventListener('click', () => {
       this.showShareModal(this.currentProduct);
     });
   });
   
   // View tracking button
   const viewTrackingBtn = document.querySelector('#view-tracking-btn');
   if (viewTrackingBtn) {
     viewTrackingBtn.addEventListener('click', () => {
       this.showMultiSelectModal();
     });
   }
 }
 
/**
 * Handle direct sale - go to sale-details.html
 */
handleDirectSale() {
  if (!this.currentProduct) return;
  
  console.log('Direct sale for product:', this.currentProduct.id);
  
  if (window.InfoHubApp) {
    window.InfoHubApp.showNotification('กำลังสร้างการขายใหม่...', 'info');
  }
  
  setTimeout(() => {
    window.location.href = `sale-details.html?action=new&product=${encodeURIComponent(this.currentProduct.id)}`;
  }, 1000);
}
 
 /**
  * Handle add status - add to multi-select system
  */
 async handleAddStatus() {
   if (!this.currentProduct) return;
   
   try {
     await this.selectProduct(this.currentProduct.id);
     
     const buttons = document.querySelectorAll('#add-status-btn, #add-status-btn-alt, #add-status-btn-mobile');
     buttons.forEach(button => {
       const originalText = button.innerHTML;
       button.innerHTML = '<i class="fas fa-check"></i> เพิ่มแล้ว';
       button.style.background = '#059669';
       button.style.borderColor = '#059669';
       button.style.color = 'white';
       
       setTimeout(() => {
         button.innerHTML = originalText;
         button.style.background = '';
         button.style.borderColor = '#3b82f6';
         button.style.color = '#3b82f6';
       }, 2000);
     });
     
     if (window.InfoHubApp) {
       window.InfoHubApp.showNotification(`เพิ่ม "${this.currentProduct.name}" ในรายการติดตามแล้ว`, 'success');
     }
     
   } catch (error) {
     console.error('Error adding status:', error);
     if (window.InfoHubApp) {
       window.InfoHubApp.showNotification('ไม่สามารถเพิ่มสถานะได้', 'error');
     }
   }
 }
 
 /**
  * Setup event listeners for product listing
  */
 setupEventListeners() {
   document.addEventListener('search-triggered', (e) => {
     this.handleSearch(e.detail);
   });
   
   document.addEventListener('retry-requested', () => {
     this.loadInitialProducts();
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
     
     setTimeout(() => {
       this.initializeSelectionSystem();
     }, 500);
     
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
     
     let title = 'ผลการค้นหา';
     if (searchData.keyword) title += ` "${searchData.keyword}"`;
     if (searchData.category) title += ` ในหมวด "${searchData.category}"`;
     if (!searchData.keyword && !searchData.category) title = 'รายการสินค้าทั้งหมด';
     
     this.updateResultsInfo(products.length, title);
     
     setTimeout(() => {
       this.addSelectionToProductCards();
     }, 300);
     
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
   
   this.setupProductEventListeners();
 }
 
 /**
  * Create product card HTML
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
         <button type="button" class="btn btn-outline product-share" 
                 data-product-id="${this.escapeHtml(product.id)}"
                 style="border-color: #6b7280; color: #6b7280;">
           <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
         </button>
         <button type="button" class="btn btn-outline product-add-status" 
                 data-product-id="${this.escapeHtml(product.id)}"
                 style="border-color: #3b82f6; color: #3b82f6;">
           <i class="fas fa-plus-circle"></i> เพิ่มสถานะ
         </button>
       </div>
     </div>
   `;
 }
 
 /**
  * Setup event listeners for product cards
  */
 setupProductEventListeners() {
  // ใน setupProductEventListeners() - Direct Sale buttons
  const addSaleButtons = document.querySelectorAll('.product-add-sale');
  addSaleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const productId = button.getAttribute('data-product-id');
      console.log('Direct sale for product:', productId);
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('กำลังสร้างการขายใหม่...', 'info');
      }
      
      setTimeout(() => {
        window.location.href = `sale-details.html?action=new&product=${encodeURIComponent(productId)}`;
      }, 1000);
    });
  });
   
   // Add Status buttons
   const addStatusButtons = document.querySelectorAll('.product-add-status');
   addStatusButtons.forEach(button => {
     button.addEventListener('click', async (e) => {
       e.stopPropagation();
       e.preventDefault();
       
       const productId = button.getAttribute('data-product-id');
       const originalText = button.innerHTML;
       
       button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเพิ่ม...';
       button.disabled = true;
       
       try {
         await this.selectProduct(productId);
         
         button.innerHTML = '<i class="fas fa-check"></i> เพิ่มแล้ว';
         button.style.background = '#059669';
         button.style.borderColor = '#059669';
         button.style.color = 'white';
         
         setTimeout(() => {
           button.innerHTML = originalText;
           button.style.background = '';
           button.style.borderColor = '#3b82f6';
           button.style.color = '#3b82f6';
           button.disabled = false;
         }, 2000);
         
       } catch (error) {
         console.error('Error adding status:', error);
         
         button.innerHTML = originalText;
         button.disabled = false;
         
         if (window.InfoHubApp) {
           window.InfoHubApp.showNotification('ไม่สามารถเพิ่มสถานะได้', 'error');
         }
       }
     });
   });
   
   // Share buttons
   const shareButtons = document.querySelectorAll('.product-share');
   shareButtons.forEach(button => {
     button.addEventListener('click', async (e) => {
       e.stopPropagation();
       e.preventDefault();
       
       const productId = button.getAttribute('data-product-id');
       const originalText = button.innerHTML;
       
       button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังโหลด...';
       button.disabled = true;
       
       try {
         const product = await dataService.getProductById(productId);
         this.showShareModal(product);
       } catch (error) {
         console.error('Error loading product for share:', error);
         if (window.InfoHubApp) {
           window.InfoHubApp.showNotification('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
         }
       } finally {
         button.innerHTML = originalText;
         button.disabled = false;
       }
     });
   });
   
   // Product card clicks
   const productCards = document.querySelectorAll('.product-card');
   productCards.forEach(card => {
     card.addEventListener('click', (e) => {
       if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.product-select-overlay')) {
         return;
       }
       
       const productId = card.getAttribute('data-product-id');
       window.location.href = `product-details.html?id=${encodeURIComponent(productId)}`;
     });
   });
 }
 
 // ==================== MULTI-SELECT SYSTEM ====================
 
 /**
  * Select product for multi-select
  */
 async selectProduct(productId) {
   try {
     if (this.selectedProducts.has(productId)) return;

     const product = await dataService.getProductById(productId);
     
     this.selectedProducts.set(productId, {
       ...product,
       quantity: 1,
       status: 'สนใจ',
       notes: ''
     });

     this.updateCartButton();
     this.highlightSelectedCard(productId, true);
     
     if (window.InfoHubApp) {
       window.InfoHubApp.showNotification(`เพิ่ม "${product.name}" ในรายการแล้ว`, 'success');
     }

   } catch (error) {
     console.error('Error selecting product:', error);
     throw error;
   }
 }
 
 /**
  * Initialize selection system
  */
 initializeSelectionSystem() {
   this.addSelectionStyles();
   this.addSelectionToProductCards();
   this.setupProductCardObserver();
 }
 
 /**
  * Add selection checkboxes to product cards
  */
 addSelectionToProductCards() {
   const productCards = document.querySelectorAll('.product-card');
   
   productCards.forEach(card => {
     if (card.querySelector('.product-select-checkbox')) return;

     const productId = card.getAttribute('data-product-id');
     
     const selectOverlay = document.createElement('div');
     selectOverlay.className = 'product-select-overlay';
     selectOverlay.style.cssText = `
       position: absolute;
       top: 0.75rem;
       left: 0.75rem;
       z-index: 10;
     `;

     card.style.position = 'relative';
     card.appendChild(selectOverlay);

     const checkbox = selectOverlay.querySelector('.product-select-checkbox');
     checkbox.addEventListener('change', async (e) => {
       e.stopPropagation();
       
       if (checkbox.checked) {
         await this.selectProduct(productId);
       } else {
         this.deselectProduct(productId);
       }
     });

     const label = selectOverlay.querySelector('.product-select-label');
     label.addEventListener('mouseenter', () => {
       label.style.background = 'rgba(59, 130, 246, 0.1)';
       label.style.borderColor = '#3b82f6';
     });
     
     label.addEventListener('mouseleave', () => {
       label.style.background = 'rgba(255, 255, 255, 0.95)';
       label.style.borderColor = 'transparent';
     });

     if (this.selectedProducts.has(productId)) {
       checkbox.checked = true;
       this.highlightSelectedCard(productId, true);
     }
   });
 }
 
 /**
  * Deselect product
  */
 deselectProduct(productId) {
   if (!this.selectedProducts.has(productId)) return;

   const product = this.selectedProducts.get(productId);
   this.selectedProducts.delete(productId);

   this.updateCartButton();
   this.highlightSelectedCard(productId, false);

   if (window.InfoHubApp) {
     window.InfoHubApp.showNotification(`ลบ "${product.name}" ออกจากรายการแล้ว`, 'info');
   }
 }
 
 /**
  * Highlight selected card
  */
 highlightSelectedCard(productId, isSelected) {
   const card = document.querySelector(`[data-product-id="${productId}"]`).closest('.product-card');
   if (!card) return;

   if (isSelected) {
     card.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
     card.style.borderColor = '#3b82f6';
     card.style.transform = 'translateY(-2px)';
   } else {
     card.style.boxShadow = '';
     card.style.borderColor = '';
     card.style.transform = '';
   }
 }
 
 /**
  * Update cart button
  */
 updateCartButton() {
   const cartButton = document.getElementById('sales-clipboard-btn');
   const countElement = document.getElementById('cart-count');
   
   if (!cartButton || !countElement) return;

   const count = this.selectedProducts.size;
   countElement.textContent = count;

   if (count > 0) {
     cartButton.style.transform = 'scale(1)';
     cartButton.style.opacity = '1';
     
     countElement.style.animation = 'bounce 0.5s ease';
     setTimeout(() => {
       countElement.style.animation = '';
     }, 500);
   } else {
     cartButton.style.transform = 'scale(0)';
     cartButton.style.opacity = '0';
   }
 }
 
 /**
  * Show multi-select modal
  */
 showMultiSelectModal() {
   if (this.selectedProducts.size === 0) {
     if (window.InfoHubApp) {
       window.InfoHubApp.showNotification('กรุณาเลือกสินค้าก่อน', 'warning');
     }
     return;
   }

   this.createMultiSelectModal();
 }
 
 /**
  * Create multi-select modal
  */
 createMultiSelectModal() {
   const existingModal = document.querySelector('.multi-sales-modal-backdrop');
   if (existingModal) {
     existingModal.remove();
   }

   const modal = document.createElement('div');
   modal.className = 'multi-sales-modal-backdrop';
   modal.style.cssText = `
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: rgba(0, 0, 0, 0.6);
     display: flex;
     align-items: center;
     justify-content: center;
     z-index: 9999;
     opacity: 0;
     transition: opacity 0.3s ease;
   `;

   modal.innerHTML = `
     <div class="multi-sales-modal" style="
       background: white;
       border-radius: 1rem;
       max-width: 900px;
       width: 95%;
       max-height: 90vh;
       overflow-y: auto;
       display: flex;
       flex-direction: column;
       transform: scale(0.9);
       transition: transform 0.3s ease;
       box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
     ">
       <!-- Modal Header -->
       <div class="modal-header" style="
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 2rem 2rem 1rem 2rem;
         border-bottom: 1px solid #e5e7eb;
         background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
         color: white;
         border-radius: 1rem 1rem 0 0;
       ">
         <div>
           <h2 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0;">
             <i class="fas fa-clipboard-list"></i> จัดการ Status สินค้า
           </h2>
           <p style="margin: 0; opacity: 0.9; font-size: 1rem;">
             สินค้าที่เลือก ${this.selectedProducts.size} รายการ
           </p>
         </div>
         <button class="modal-close-btn" type="button" style="
           background: rgba(255, 255, 255, 0.2);
           border: none;
           font-size: 1.5rem;
           color: white;
           cursor: pointer;
           padding: 1rem;
           border-radius: 50%;
           transition: all 0.2s;
           width: 3.5rem;
           height: 3.5rem;
           display: flex;
           align-items: center;
           justify-content: center;
         ">
           <i class="fas fa-times"></i>
         </button>
       </div>

       <!-- Modal Body -->
       <div class="modal-body" style="padding: 2rem; flex: 1;">
         <!-- Customer Selection -->
         <div class="customer-section" style="margin-bottom: 2rem;">
           <h3 style="
             font-size: 1.25rem;
             font-weight: 700;
             color: #1f2937;
             margin-bottom: 1rem;
             display: flex;
             align-items: center;
             gap: 0.75rem;
           ">
             <i class="fas fa-user-circle" style="color: #3b82f6;"></i>
             เลือกลูกค้า
           </h3>
           
           <div style="position: relative;">
             <select id="customer-select" required style="
               width: 100%;
               padding: 1rem 1rem 1rem 3rem;
               border: 2px solid #d1d5db;
               border-radius: 0.75rem;
               font-size: 1rem;
               background: white;
               cursor: pointer;
               transition: all 0.2s;
               appearance: none;
               background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23666\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>');
               background-repeat: no-repeat;
               background-position: right 1rem center;
               background-size: 12px;
             ">
               <option value="">-- เลือกลูกค้า --</option>
               ${this.customers.map(customer => `
                 <option value="${this.escapeHtml(customer.id)}" 
                         data-customer='${JSON.stringify(customer)}'>
                   ${this.escapeHtml(customer.name)} (${this.escapeHtml(customer.tel)})
                 </option>
               `).join('')}
             </select>
             
             <i class="fas fa-user" style="
               position: absolute;
               left: 1rem;
               top: 50%;
               transform: translateY(-50%);
               color: #6b7280;
               font-size: 1.25rem;
             "></i>
           </div>
         </div>

         <!-- Products List -->
         <div class="products-section">
           <h3 style="
             font-size: 1.25rem;
             font-weight: 700;
             color: #1f2937;
             margin-bottom: 1.5rem;
             display: flex;
             align-items: center;
             gap: 0.75rem;
           ">
             <i class="fas fa-boxes" style="color: #3b82f6;"></i>
             รายการสินค้า
           </h3>
           
           <div id="selected-products-list" style="display: grid; gap: 1.5rem;">
             ${this.renderSelectedProducts()}
           </div>
         </div>

         <!-- Summary -->
         <div id="sales-summary" style="
           background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
           border: 2px solid #bbf7d0;
           border-radius: 1rem;
           padding: 2rem;
           margin-top: 2rem;
         ">
           <h4 style="
             color: #065f46;
             font-weight: 800;
             margin: 0 0 1.5rem 0;
             font-size: 1.25rem;
             display: flex;
             align-items: center;
             gap: 0.75rem;
           ">
             <i class="fas fa-calculator"></i>
             สรุปรายการ
           </h4>
           <div id="summary-content">
             ${this.renderSummary()}
           </div>
         </div>
       </div>

       <!-- Modal Footer -->
       <div class="modal-footer" style="
         display: flex;
         justify-content: space-between;
         gap: 1rem;
         padding: 2rem;
         border-top: 1px solid #e5e7eb;
         background: #f8fafc;
         border-radius: 0 0 1rem 1rem;
       ">
         <div style="display: flex; gap: 1rem;">
           <button type="button" class="clear-all-btn" style="
             padding: 1rem 1.5rem;
             border: 2px solid #ef4444;
             background: white;
             color: #ef4444;
             border-radius: 0.75rem;
             cursor: pointer;
             font-weight: 600;
             transition: all 0.2s;
           ">
             <i class="fas fa-trash"></i> ล้างทั้งหมด
           </button>
           
           <button type="button" class="cancel-btn" style="
             padding: 1rem 2rem;
             border: 2px solid #d1d5db;
             background: white;
             color: #6b7280;
             border-radius: 0.75rem;
             cursor: pointer;
             font-weight: 600;
             transition: all 0.2s;
           ">
             <i class="fas fa-times"></i> ยกเลิก
           </button>
         </div>
         
         <button type="button" class="save-all-btn" style="
           padding: 1rem 3rem;
           border: 2px solid #059669;
           background: linear-gradient(135deg, #059669 0%, #047857 100%);
           color: white;
           border-radius: 0.75rem;
           cursor: pointer;
           font-weight: 800;
           transition: all 0.2s;
           font-size: 1.125rem;
           display: flex;
           align-items: center;
           gap: 0.75rem;
         ">
           <i class="fas fa-clipboard-check"></i> บันทึก Status ทั้งหมด
         </button>
       </div>
     </div>
   `;

   document.body.appendChild(modal);

   setTimeout(() => {
     modal.style.opacity = '1';
     const modalContent = modal.querySelector('.multi-sales-modal');
     modalContent.style.transform = 'scale(1)';
   }, 10);

   this.setupMultiSelectModalListeners(modal);
   document.body.style.overflow = 'hidden';
 }
 
 /**
  * Render selected products
  */
 renderSelectedProducts() {
   const products = Array.from(this.selectedProducts.values());
   
   return products.map(product => `
     <div class="selected-product-item" data-product-id="${product.id}" style="
       background: white;
       border: 2px solid #e5e7eb;
       border-radius: 1rem;
       padding: 1.5rem;
       transition: all 0.2s;
       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
     ">
       <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 1.5rem; align-items: start;">
         <!-- Product Image -->
         <div style="
           width: 80px;
           height: 80px;
           background: #f3f4f6;
           border-radius: 0.75rem;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #6b7280;
           overflow: hidden;
           flex-shrink: 0;
         ">
           ${product.images && product.images.length > 0 ? `
             <img src="${this.escapeHtml(product.images[0])}" 
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;"
                  onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image fa-2x\\'></i>';">
           ` : '<i class="fas fa-image fa-2x"></i>'}
         </div>

         <!-- Product Info & Controls -->
         <div style="min-width: 0;">
           <h4 style="
             font-weight: 700;
             color: #1f2937;
             margin: 0 0 0.5rem 0;
             font-size: 1.125rem;
             line-height: 1.4;
           ">
             ${this.escapeHtml(product.name)}
           </h4>
           
           <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
             <span style="color: #6b7280; font-size: 0.875rem;">
               <i class="fas fa-barcode"></i> ${this.escapeHtml(product.id)}
             </span>
             <span style="color: #059669; font-weight: 700; font-size: 1rem;">
               ${this.formatCurrency(product.price)}
             </span>
             <span style="color: ${product.stock > 0 ? '#059669' : '#ef4444'}; font-size: 0.875rem; font-weight: 600;">
               <i class="fas fa-box"></i> คงเหลือ ${product.stock} ชิ้น
             </span>
           </div>

           <!-- Controls Grid -->
           <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
             <!-- Quantity -->
             <div>
               <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem;">
                 จำนวน
               </label>
               <input type="number" 
                      class="quantity-input" 
                      data-product-id="${product.id}"
                      value="${product.quantity}" 
                      min="1" 
                      max="${product.stock}"
                      style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #d1d5db;
                        border-radius: 0.5rem;
                        font-size: 0.875rem;
                        text-align: center;
                      ">
             </div>

             <!-- Status -->
             <div>
               <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem;">
                 สถานะ
               </label>
               <select class="status-select" 
                       data-product-id="${product.id}"
                       style="
                         width: 100%;
                         padding: 0.75rem;
                         border: 1px solid #d1d5db;
                         border-radius: 0.5rem;
                         font-size: 0.875rem;
                         background: white;
                       ">
                 ${this.statusOptions.map(status => `
                   <option value="${status.value}" ${product.status === status.value ? 'selected' : ''}>
                     ${status.value}
                   </option>
                 `).join('')}
               </select>
             </div>

             <!-- Total -->
             <div>
               <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem;">
                 ยอดรวม
               </label>
               <div class="item-total" style="
                 padding: 0.75rem;
                 background: #f3f4f6;
                 border-radius: 0.5rem;
                 font-weight: 700;
                 color: #059669;
                 text-align: center;
                 font-size: 0.875rem;
               ">
                 ${this.formatCurrency(product.price * product.quantity)}
               </div>
             </div>
           </div>

           <!-- Notes -->
           <div style="margin-top: 1rem;">
             <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem; font-size: 0.875rem;">
               หมายเหตุ (ไม่บังคับ)
             </label>
             <textarea class="notes-input" 
                       data-product-id="${product.id}"
                       placeholder="เพิ่มหมายเหตุสำหรับสินค้านี้..."
                       rows="2"
                       style="
                         width: 100%;
                         padding: 0.75rem;
                         border: 1px solid #d1d5db;
                         border-radius: 0.5rem;
                         font-size: 0.875rem;
                         resize: vertical;
                         font-family: inherit;
                       ">${product.notes}</textarea>
           </div>
         </div>

         <!-- Remove Button -->
         <button type="button" 
                 class="remove-product-btn" 
                 data-product-id="${product.id}"
                 style="
                   background: #fef2f2;
                   border: 1px solid #fecaca;
                   color: #dc2626;
                   padding: 0.75rem;
                   border-radius: 0.5rem;
                   cursor: pointer;
                   transition: all 0.2s;
                   width: 3rem;
                   height: 3rem;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   flex-shrink: 0;
                 ">
           <i class="fas fa-trash"></i>
         </button>
       </div>
     </div>
   `).join('');
 }
 
/**
  * Render summary
  */
renderSummary() {
  if (this.selectedProducts.size === 0) {
    return '<p style="color: #6b7280; text-align: center; margin: 0;">ไม่มีสินค้าที่เลือก</p>';
  }

  const products = Array.from(this.selectedProducts.values());
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  return `
    <div style="display: grid; gap: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #065f46; font-weight: 600;">จำนวนสินค้า:</span>
        <span style="color: #065f46; font-weight: 700; font-size: 1.125rem;">${totalItems} ชิ้น</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #065f46; font-weight: 600;">จำนวนรายการ:</span>
        <span style="color: #065f46; font-weight: 700; font-size: 1.125rem;">${this.selectedProducts.size} รายการ</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #bbf7d0; padding-top: 1rem; margin-top: 0.5rem;">
        <span style="color: #065f46; font-weight: 800; font-size: 1.25rem;">ยอดรวมทั้งหมด:</span>
        <span style="color: #065f46; font-weight: 900; font-size: 1.75rem;">${this.formatCurrency(totalAmount)}</span>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners for multi-select modal
 */
setupMultiSelectModalListeners(modal) {
  // Close button
  const closeBtn = modal.querySelector('.modal-close-btn');
  closeBtn.addEventListener('click', () => this.closeMultiSelectModal(modal));

  // Cancel button
  const cancelBtn = modal.querySelector('.cancel-btn');
  cancelBtn.addEventListener('click', () => this.closeMultiSelectModal(modal));

  // Clear all button
  const clearAllBtn = modal.querySelector('.clear-all-btn');
  clearAllBtn.addEventListener('click', () => this.handleClearAll(modal));

  // Save button
  const saveBtn = modal.querySelector('.save-all-btn');
  saveBtn.addEventListener('click', () => this.handleSaveAll(modal));

  // Product controls
  this.setupProductControls(modal);

  // Customer selection
  const customerSelect = modal.querySelector('#customer-select');
  customerSelect.addEventListener('change', () => this.updateSummary(modal));

  // Button hover effects
  this.setupModalButtonEffects(modal);

  // ESC key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      this.closeMultiSelectModal(modal);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  modal._escHandler = handleEsc;
}

/**
 * Setup product controls in modal
 */
setupProductControls(modal) {
  // Quantity inputs
  const quantityInputs = modal.querySelectorAll('.quantity-input');
  quantityInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const productId = input.getAttribute('data-product-id');
      const quantity = parseInt(input.value) || 1;
      this.updateProductQuantity(productId, quantity, modal);
    });
  });

  // Status selects
  const statusSelects = modal.querySelectorAll('.status-select');
  statusSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const productId = select.getAttribute('data-product-id');
      const status = select.value;
      this.updateProductStatus(productId, status);
    });
  });

  // Notes inputs
  const notesInputs = modal.querySelectorAll('.notes-input');
  notesInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const productId = input.getAttribute('data-product-id');
      const notes = input.value;
      this.updateProductNotes(productId, notes);
    });
  });

  // Remove buttons
  const removeButtons = modal.querySelectorAll('.remove-product-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = button.getAttribute('data-product-id');
      this.removeProductFromModal(productId, modal);
    });

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = '#fee2e2';
      button.style.borderColor = '#fca5a5';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#fef2f2';
      button.style.borderColor = '#fecaca';
      button.style.transform = 'scale(1)';
    });
  });
}

/**
 * Update product quantity
 */
updateProductQuantity(productId, quantity, modal) {
  if (this.selectedProducts.has(productId)) {
    const product = this.selectedProducts.get(productId);
    product.quantity = Math.max(1, Math.min(quantity, product.stock));
    
    // Update item total display
    const itemTotalElement = modal.querySelector(`[data-product-id="${productId}"]`).closest('.selected-product-item').querySelector('.item-total');
    if (itemTotalElement) {
      itemTotalElement.textContent = this.formatCurrency(product.price * product.quantity);
    }

    this.updateSummary(modal);
  }
}

/**
 * Update product status
 */
updateProductStatus(productId, status) {
  if (this.selectedProducts.has(productId)) {
    const product = this.selectedProducts.get(productId);
    product.status = status;
  }
}

/**
 * Update product notes
 */
updateProductNotes(productId, notes) {
  if (this.selectedProducts.has(productId)) {
    const product = this.selectedProducts.get(productId);
    product.notes = notes;
  }
}

/**
 * Remove product from modal
 */
removeProductFromModal(productId, modal) {
  if (!this.selectedProducts.has(productId)) return;

  const product = this.selectedProducts.get(productId);
  
  if (!confirm(`ต้องการลบ "${product.name}" ออกจากรายการหรือไม่?`)) {
    return;
  }

  this.selectedProducts.delete(productId);

  const checkbox = document.querySelector(`[data-product-id="${productId}"].product-select-checkbox`);
  if (checkbox) {
    checkbox.checked = false;
  }

  this.highlightSelectedCard(productId, false);
  this.updateCartButton();

  if (this.selectedProducts.size === 0) {
    this.closeMultiSelectModal(modal);
    return;
  }

  const productsList = modal.querySelector('#selected-products-list');
  productsList.innerHTML = this.renderSelectedProducts();

  this.setupProductControls(modal);
  this.updateSummary(modal);

  if (window.InfoHubApp) {
    window.InfoHubApp.showNotification(`ลบ "${product.name}" ออกจากรายการแล้ว`, 'info');
  }
}

/**
 * Handle clear all
 */
handleClearAll(modal) {
  if (this.selectedProducts.size === 0) return;

  if (!confirm(`ต้องการลบสินค้าทั้งหมด ${this.selectedProducts.size} รายการหรือไม่?`)) {
    return;
  }

  this.selectedProducts.forEach((product, productId) => {
    const checkbox = document.querySelector(`[data-product-id="${productId}"].product-select-checkbox`);
    if (checkbox) {
      checkbox.checked = false;
    }
    
    this.highlightSelectedCard(productId, false);
  });

  this.selectedProducts.clear();
  this.updateCartButton();
  this.closeMultiSelectModal(modal);

  if (window.InfoHubApp) {
    window.InfoHubApp.showNotification('ล้างรายการทั้งหมดแล้ว', 'success');
  }
}

/**
 * Handle save all statuses
 */
async handleSaveAll(modal) {
  try {
    const saveBtn = modal.querySelector('.save-all-btn');
    const originalContent = saveBtn.innerHTML;

    // Validate customer selection
    const customerSelect = modal.querySelector('#customer-select');
    if (!customerSelect.value) {
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('กรุณาเลือกลูกค้า', 'warning');
      }
      customerSelect.focus();
      return;
    }

    // Show loading
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    saveBtn.disabled = true;

    // Get customer data
    const selectedCustomer = JSON.parse(customerSelect.selectedOptions[0].getAttribute('data-customer'));

    // Prepare sales data
    const salesData = Array.from(this.selectedProducts.values()).map(product => ({
      state_id: `S${Date.now()}_${product.id}`,
      customer: {
        note: selectedCustomer.note || "",
        customer_fname: selectedCustomer.firstName || "",
        customer_id: selectedCustomer.id,
        customer_tel: selectedCustomer.tel || "",
        customer_email: selectedCustomer.email || "",
        customer_lname: selectedCustomer.lastName || "",
        customer_address: selectedCustomer.address || ""
      },
      Product: {
        model: product.model || "",
        manualurl: product.documents?.manual || "",
        category_name: product.category || "",
        compareurl: product.documents?.compare || "",
        brand: product.brand || "",
        specurl: product.documents?.specs || "",
        stock: product.stock || 0,
        price: product.price || 0,
        description: product.description || "",
        product_id: product.id,
        name: product.name,
        imgurl: product.images?.[0] || ""
      },
      customer_status: product.status,
      amount: product.quantity.toString(),
      notes: product.notes || ""
    }));

    console.log('Status data to submit:', salesData);

    // Submit each status (simulated)
    for (const saleData of salesData) {
      await this.submitStatusData(saleData);
    }

    // Show success
    this.showStatusSuccess(modal, salesData, selectedCustomer);

  } catch (error) {
    console.error('Error saving statuses:', error);
    
    // Restore button
    const saveBtn = modal.querySelector('.save-all-btn');
    saveBtn.innerHTML = '<i class="fas fa-clipboard-check"></i> บันทึก Status ทั้งหมด';
    saveBtn.disabled = false;

    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }
}

/**
 * Submit status data (placeholder)
 */
async submitStatusData(statusData) {
  // TODO: Replace with actual API call
  return new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Show status success
 */
showStatusSuccess(modal, salesData, customer) {
  const modalBody = modal.querySelector('.modal-body');
  
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 3rem 2rem;">
      <div style="font-size: 6rem; color: #059669; margin-bottom: 2rem; animation: bounce 1s ease-in-out;">
        <i class="fas fa-check-circle"></i>
      </div>
      
      <h3 style="font-size: 2.5rem; font-weight: 800; color: #1f2937; margin-bottom: 1rem;">
        บันทึก Status สำเร็จ!
      </h3>
      
      <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">
        บันทึกสถานะการติดตาม ${salesData.length} รายการให้ลูกค้า <strong>${customer.name}</strong> เรียบร้อยแล้ว
      </p>
      
      <div style="
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        border: 2px solid #bbf7d0;
        border-radius: 1rem;
        padding: 2rem;
        margin: 2rem 0;
        text-align: left;
      ">
        <h4 style="color: #065f46; font-weight: 800; margin-bottom: 1.5rem; font-size: 1.5rem; text-align: center;">
          <i class="fas fa-clipboard-list"></i> สรุป Status ที่บันทึก
        </h4>
        
        <div style="display: grid; gap: 1rem; max-height: 300px; overflow-y: auto;">
          ${salesData.map((sale, index) => `
            <div style="
              background: white;
              padding: 1rem;
              border-radius: 0.75rem;
              border: 1px solid #d1fae5;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div>
                <strong style="color: #065f46;">${this.escapeHtml(sale.Product.name)}</strong>
                <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
                  จำนวน: ${sale.amount} | สถานะ: ${this.escapeHtml(sale.customer_status)}
                </div>
              </div>
              <div style="color: #059669; font-weight: 700; font-size: 1.125rem;">
                ${this.formatCurrency(sale.Product.price * parseInt(sale.amount))}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="
          border-top: 2px solid #bbf7d0;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="color: #065f46; font-weight: 800; font-size: 1.5rem;">ยอดรวมทั้งหมด:</span>
          <span style="color: #059669; font-weight: 900; font-size: 2rem;">
            ${this.formatCurrency(salesData.reduce((sum, sale) => sum + (sale.Product.price * parseInt(sale.amount)), 0))}
          </span>
        </div>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="view-tracking-btn" style="
          padding: 1rem 2rem;
          border: 2px solid #3b82f6;
          background: white;
          color: #3b82f6;
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          font-size: 1rem;
        ">
          <i class="fas fa-chart-line"></i> ดูการติดตาม
        </button>
        
        <button type="button" class="create-sale-btn" style="
          padding: 1rem 2rem;
          border: 2px solid #f97316;
          background: #f97316;
          color: white;
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          font-size: 1rem;
        ">
          <i class="fas fa-shopping-cart"></i> สร้างการขายจริง
        </button>
        
        <button type="button" class="continue-btn" style="
          padding: 1rem 2rem;
          border: 2px solid #059669;
          background: #059669;
          color: white;
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          font-size: 1rem;
        ">
          <i class="fas fa-plus"></i> เพิ่ม Status ใหม่
        </button>
      </div>
    </div>
  `;

  // Update footer
  const footer = modal.querySelector('.modal-footer');
  footer.innerHTML = `
    <button type="button" class="close-success-btn" style="
      padding: 1.25rem 4rem;
      border: 2px solid #059669;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      border-radius: 0.75rem;
      cursor: pointer;
      font-weight: 800;
      transition: all 0.2s;
      font-size: 1.25rem;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    ">
      <i class="fas fa-check"></i> เรียบร้อย
    </button>
  `;

  // Setup success buttons
  const viewTrackingBtn = modalBody.querySelector('.view-tracking-btn');
  const createSaleBtn = modalBody.querySelector('.create-sale-btn');
  const continueBtn = modalBody.querySelector('.continue-btn');
  const closeBtn = footer.querySelector('.close-success-btn');

  viewTrackingBtn.addEventListener('click', () => {
    this.closeMultiSelectModal(modal);
    window.location.href = 'customer-tracking.html';
  });

  createSaleBtn.addEventListener('click', () => {
    this.closeMultiSelectModal(modal);
    const productIds = salesData.map(s => s.Product.product_id).join(',');
    window.location.href = `product-details.html?products=${encodeURIComponent(productIds)}&customer=${encodeURIComponent(customer.id)}`;
  });

  continueBtn.addEventListener('click', () => {
    this.clearAllSelections();
    this.closeMultiSelectModal(modal);
  });

  closeBtn.addEventListener('click', () => {
    this.clearAllSelections();
    this.closeMultiSelectModal(modal);
  });

  // Auto close after 15 seconds
  setTimeout(() => {
    if (modal.parentNode) {
      this.clearAllSelections();
      this.closeMultiSelectModal(modal);
    }
  }, 15000);
}

/**
 * Clear all selections
 */
clearAllSelections() {
  this.selectedProducts.forEach((product, productId) => {
    const checkbox = document.querySelector(`[data-product-id="${productId}"].product-select-checkbox`);
    if (checkbox) {
      checkbox.checked = false;
    }
    this.highlightSelectedCard(productId, false);
  });

  this.selectedProducts.clear();
  this.updateCartButton();
}

/**
 * Update summary in modal
 */
updateSummary(modal) {
  const summaryContent = modal.querySelector('#summary-content');
  if (summaryContent) {
    summaryContent.innerHTML = this.renderSummary();
  }
}

/**
 * Setup modal button effects
 */
setupModalButtonEffects(modal) {
  const buttons = modal.querySelectorAll('button');
  
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn.classList.contains('clear-all-btn')) {
        btn.style.background = '#fef2f2';
        btn.style.transform = 'translateY(-2px)';
      } else if (btn.classList.contains('cancel-btn')) {
        btn.style.background = '#f3f4f6';
        btn.style.transform = 'translateY(-2px)';
      } else if (btn.classList.contains('save-all-btn')) {
        btn.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)';
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 15px 35px -5px rgba(5, 150, 105, 0.4)';
      } else if (btn.classList.contains('modal-close-btn')) {
        btn.style.background = 'rgba(255, 255, 255, 0.3)';
        btn.style.transform = 'scale(1.1)';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      if (btn.classList.contains('clear-all-btn')) {
        btn.style.background = 'white';
        btn.style.transform = 'translateY(0)';
      } else if (btn.classList.contains('cancel-btn')) {
        btn.style.background = 'white';
        btn.style.transform = 'translateY(0)';
      } else if (btn.classList.contains('save-all-btn')) {
        btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      } else if (btn.classList.contains('modal-close-btn')) {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
        btn.style.transform = 'scale(1)';
      }
    });
  });
}

/**
 * Close multi-select modal
 */
closeMultiSelectModal(modal) {
  if (!modal || !modal.parentNode) return;
  
  const modalContent = modal.querySelector('.multi-sales-modal');
  
  modal.style.opacity = '0';
  if (modalContent) {
    modalContent.style.transform = 'scale(0.9)';
  }
  
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    document.body.style.overflow = '';
    
    if (modal._escHandler) {
      document.removeEventListener('keydown', modal._escHandler);
    }
  }, 300);
}

// ==================== SHARE MODAL ====================

/**
 * Show share modal for product - แบบเดิมที่มีฟีเจอร์ครบ
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
 
 // ==================== HELPER METHODS ====================
 
 /**
  * Add CSS styles for selection system
  */
 addSelectionStyles() {
   if (document.getElementById('multi-select-styles')) return;

   const styles = document.createElement('style');
   styles.id = 'multi-select-styles';
   styles.textContent = `
     @keyframes bounce {
       0%, 20%, 53%, 80%, 100% {
         transform: translate3d(0,0,0);
       }
       40%, 43% {
         transform: translate3d(0, -15px, 0);
       }
       70% {
         transform: translate3d(0, -7px, 0);
       }
       90% {
         transform: translate3d(0, -2px, 0);
       }
     }

     .selected-product-item:hover {
       border-color: #3b82f6 !important;
       box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
     }
   `;
   
   document.head.appendChild(styles);
 }
 
 /**
  * Setup observer for new product cards
  */
 setupProductCardObserver() {
   const observer = new MutationObserver((mutations) => {
     mutations.forEach((mutation) => {
       if (mutation.type === 'childList') {
         mutation.addedNodes.forEach((node) => {
           if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('product-card')) {
             this.addSelectionToSingleCard(node);
           }
         });
       }
     });
   });

   const productList = document.getElementById('product-list');
   if (productList) {
     observer.observe(productList, { childList: true, subtree: true });
   }
 }
 
 /**
  * Add selection to single card
  */
 addSelectionToSingleCard(card) {
   if (card.querySelector('.product-select-checkbox')) return;

   const productId = card.getAttribute('data-product-id');
   
   const selectOverlay = document.createElement('div');
   selectOverlay.className = 'product-select-overlay';
   selectOverlay.style.cssText = `
     position: absolute;
     top: 0.75rem;
     left: 0.75rem;
     z-index: 10;
   `;

   card.style.position = 'relative';
   card.appendChild(selectOverlay);

   const checkbox = selectOverlay.querySelector('.product-select-checkbox');
   checkbox.addEventListener('change', async (e) => {
     e.stopPropagation();
     
     if (checkbox.checked) {
       await this.selectProduct(productId);
     } else {
       this.deselectProduct(productId);
     }
   });

   if (this.selectedProducts.has(productId)) {
     checkbox.checked = true;
     this.highlightSelectedCard(productId, true);
   }
 }
 
 /**
  * Setup image gallery functionality
  */
 setupImageGallery() {
   const thumbnails = document.querySelectorAll('.thumbnail');
   const mainImage = document.getElementById('main-product-image');
   
   thumbnails.forEach((thumbnail, index) => {
     thumbnail.addEventListener('click', () => {
       thumbnails.forEach(thumb => thumb.classList.remove('active'));
       thumbnail.classList.add('active');
       
       if (mainImage && this.currentProduct.images && this.currentProduct.images[index]) {
         mainImage.src = this.currentProduct.images[index];
       }
     });
   });
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
  * Format currency
  */
 formatCurrency(amount) {
   return new Intl.NumberFormat('th-TH', {
     style: 'currency',
     currency: 'THB'
   }).format(amount);
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

// Initialize complete product controller
const completeProductController = new CompleteProductController();

export default completeProductController;