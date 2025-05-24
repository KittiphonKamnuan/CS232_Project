/**
 * product-controller.js
 * Controller สำหรับจัดการข้อมูลสินค้า
 * อัปเดต: ใช้ข้อมูลจริงจาก API เท่านั้น ไม่มีข้อมูลสำรอง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

class ProductController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements สำหรับแสดงผลหน้า Product Details
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.productDetailsContainer = document.getElementById('product-details');
    this.productListContainer = document.getElementById('product-list');
    
    // ตรวจสอบว่าเป็นหน้า index หรือ product-details
    this.isProductDetailsPage = window.location.pathname.includes('product-details.html');
    this.isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  init() {
    // โหลดข้อมูลตามหน้าที่กำลังเข้าชม
    if (this.isProductDetailsPage) {
      this.loadProductDetails();
    } else if (this.isIndexPage) {
      this.loadProductList();
    }
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // จัดการการเปิด Modal สำหรับการแชร์
    const openShareModalBtn = document.getElementById('openShareModal');
    if (openShareModalBtn) {
      openShareModalBtn.addEventListener('click', this.handleOpenShareModal.bind(this));
    }
    
    // เพิ่ม Event Listener สำหรับปุ่ม Retry
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('retry-btn')) {
        if (this.isProductDetailsPage) {
          this.loadProductDetails();
        } else if (this.isIndexPage) {
          this.loadProductList();
        }
      }
    });
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
   * @param {boolean} showRetry - แสดงปุ่มลองใหม่หรือไม่
   */
  showError(message, showRetry = true) {
    if (this.errorMessage) {
      this.errorMessage.innerHTML = `
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
          ${showRetry ? '<button class="btn btn-primary retry-btn">ลองใหม่อีกครั้ง</button>' : ''}
        </div>
      `;
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
   * โหลดข้อมูลรายละเอียดสินค้า
   */
  async loadProductDetails() {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึง ID สินค้าจาก URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      
      if (!productId) {
        throw new Error('ไม่พบรหัสสินค้าในลิงก์ กรุณาตรวจสอบลิงก์อีกครั้ง');
      }
      
      // ใช้ dataService แทน dataService
      const product = await dataService.getProductById(productId);
      
      if (!product) {
        throw new Error('ไม่พบข้อมูลสินค้าที่ต้องการ');
      }
      
      // แสดงข้อมูลสินค้า
      await this.renderProductDetails(product);
      
    } catch (error) {
      console.error('Error loading product details:', error);
      
      // แสดงข้อความผิดพลาดที่เหมาะสม
      let errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า';
      if (error.message.includes('ไม่พบข้อมูลสินค้า') || error.message.includes('รหัสสินค้า')) {
        errorMessage = error.message;
      } else if (error.message.includes('HTTP') || error.name === 'TypeError') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      }
      
      this.showError(errorMessage, true);
      
      // แสดง fallback UI
      if (this.productDetailsContainer) {
        this.productDetailsContainer.innerHTML = `
          <div class="error-container">
            <div class="error-icon">
              <i class="fas fa-box-open"></i>
            </div>
            <h2>ไม่พบข้อมูลสินค้า</h2>
            <p>ขออภัย ไม่สามารถโหลดข้อมูลสินค้าได้ในขณะนี้</p>
            <div class="error-actions">
              <button class="btn btn-primary retry-btn">ลองใหม่อีกครั้ง</button>
              <a href="index.html" class="btn btn-outline">กลับไปยังหน้าค้นหาสินค้า</a>
            </div>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * โหลดข้อมูลรายการสินค้าสำหรับหน้าหลัก
   */
  async loadProductList() {
    try {
      this.showLoading();
      this.hideError();
      
      const products = await dataService.getProducts();
      
      if (!products || products.length === 0) {
        throw new Error('ไม่พบสินค้าในระบบ');
      }
      
      // แสดงรายการสินค้า
      this.renderProductList(products);
      
    } catch (error) {
      console.error('Error loading product list:', error);
      
      // แสดงข้อความผิดพลาดที่เหมาะสม
      let errorMessage = 'เกิดข้อผิดพลาดในการโหลดรายการสินค้า';
      if (error.message.includes('ไม่พบสินค้า')) {
        errorMessage = error.message;
      } else if (error.message.includes('HTTP') || error.name === 'TypeError') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      }
      
      this.showError(errorMessage, true);
      
      // แสดง fallback UI สำหรับรายการสินค้า
      if (this.productListContainer) {
        this.productListContainer.innerHTML = `
          <div class="error-container">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2>ไม่สามารถโหลดรายการสินค้าได้</h2>
            <p>ขออภัย เกิดปัญหาในการเชื่อมต่อกับเซิร์ฟเวอร์</p>
            <div class="error-actions">
              <button class="btn btn-primary retry-btn">ลองใหม่อีกครั้ง</button>
            </div>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูลรายละเอียดสินค้า
   * @param {Object} product - ข้อมูลสินค้า
   */
  async renderProductDetails(product) {
    if (!this.productDetailsContainer) return;
    
    // ดึงเอกสารที่เกี่ยวข้องกับสินค้า
    let relatedDocuments = [];
    try {
      if (documentService && typeof documentService.getDocumentsByProduct === 'function') {
        relatedDocuments = await documentService.getDocumentsByProduct(product.id);
      }
    } catch (error) {
      console.warn('Warning: Could not load related documents:', error);
      // ไม่ต้องแสดงข้อผิดพลาด เพราะเป็นข้อมูลเสริม
    }
    
    // สร้าง HTML สำหรับแสดงรายละเอียดสินค้า
    const html = `
      <div class="product-details">
        <div class="product-header">
          <h1>${this.escapeHtml(product.name)}</h1>
          <p class="product-code">รหัสสินค้า: ${this.escapeHtml(product.id)}</p>
        </div>
        
        <div class="product-content">
          <div class="product-gallery">
            <div class="product-main-image">
              ${this.renderProductImage(product.images, product.name)}
            </div>
            ${this.renderProductThumbnails(product.images, product.name)}
          </div>
          
          <div class="product-info">
            <div class="product-price-section">
              <div class="price-container">
                <p class="price">฿${product.price.toLocaleString()}</p>
                ${product.originalPrice && product.originalPrice > product.price ? `
                  <p class="original-price">฿${product.originalPrice.toLocaleString()}</p>
                  <p class="discount">ลด ${product.discount}%</p>
                ` : ''}
              </div>
              
              <div class="stock-status">
                <span class="${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                  ${product.stock > 0 ? 'มีสินค้า' : 'สินค้าหมด'}
                </span>
                <span class="stock-count">(เหลือ ${product.stock} เครื่อง)</span>
              </div>
            </div>
            
            <div class="product-actions">
              <button class="btn btn-primary" onclick="window.location.href='sale-details.html?action=new&product=${encodeURIComponent(product.id)}'">
                <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
              </button>
              <button class="btn btn-outline" id="openShareModal" data-product-id="${this.escapeHtml(product.id)}">
                <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
              </button>
            </div>
            
            <div class="product-delivery">
              <h3>ข้อมูลการจัดส่ง</h3>
              <p><i class="fas fa-truck"></i> <span>จัดส่ง:</span> ${this.escapeHtml(product.delivery?.estimatedDays || 'ไม่ระบุ')}</p>
              <p><i class="fas fa-shield-alt"></i> <span>การรับประกัน:</span> ${this.escapeHtml(product.warranty)}</p>
            </div>
            
            <div class="product-documents">
              <h3>เอกสารที่เกี่ยวข้อง</h3>
              <div class="document-links">
                ${this.renderDocumentLinks(relatedDocuments, product)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="product-description">
          <h2>รายละเอียดสินค้า</h2>
          <p>${this.escapeHtml(product.description)}</p>
        </div>
        
        ${this.renderProductSpecs(product.specs)}
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.productDetailsContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มต่างๆ
    const openShareModalBtn = document.getElementById('openShareModal');
    if (openShareModalBtn) {
      openShareModalBtn.addEventListener('click', this.handleOpenShareModal.bind(this));
    }
  }
  
  /**
   * แสดงรูปภาพหลักของสินค้า
   * @param {Array} images - รายการรูปภาพ
   * @param {string} productName - ชื่อสินค้า
   * @returns {string} - HTML สำหรับรูปภาพ
   */
  renderProductImage(images, productName) {
    if (!images || images.length === 0) {
      return `
        <div class="no-image-placeholder">
          <i class="fas fa-image"></i>
          <p>ไม่มีรูปภาพ</p>
        </div>
      `;
    }
    
    return `<img src="${this.escapeHtml(images[0])}" alt="${this.escapeHtml(productName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="no-image-placeholder" style="display: none;">
              <i class="fas fa-image"></i>
              <p>ไม่สามารถโหลดรูปภาพได้</p>
            </div>`;
  }
  
  /**
   * แสดงรูปภาพย่อของสินค้า
   * @param {Array} images - รายการรูปภาพ
   * @param {string} productName - ชื่อสินค้า
   * @returns {string} - HTML สำหรับรูปภาพย่อ
   */
  renderProductThumbnails(images, productName) {
    if (!images || images.length <= 1) {
      return '';
    }
    
    return `
      <div class="product-thumbnails">
        ${images.map(image => `
          <div class="thumbnail">
            <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(productName)}" onerror="this.style.display='none';">
          </div>
        `).join('')}
      </div>
    `;
  }
  
  /**
   * สร้างลิงก์เอกสารที่เกี่ยวข้อง
   * @param {Array} documents - รายการเอกสาร
   * @param {Object} product - ข้อมูลสินค้า
   * @returns {string} - HTML สำหรับลิงก์เอกสาร
   */
  renderDocumentLinks(documents, product) {
    let html = '';
    
    // ใช้เอกสารจากข้อมูลสินค้าหากมี
    if (product.documents) {
      if (product.documents.specs) {
        html += `
          <a href="${this.escapeHtml(product.documents.specs)}" class="document-link" target="_blank">
            <i class="fas fa-file-pdf"></i> สเปคสินค้า
          </a>
        `;
      }
      
      if (product.documents.manual) {
        html += `
          <a href="${this.escapeHtml(product.documents.manual)}" class="document-link" target="_blank">
            <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
          </a>
        `;
      }
      
      if (product.documents.compare) {
        html += `
          <a href="${this.escapeHtml(product.documents.compare)}" class="document-link" target="_blank">
            <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
          </a>
        `;
      }
    }
    
    // หากไม่มีเอกสารจากข้อมูลสินค้า แสดงข้อความแจ้งเตือน
    if (!html) {
      html = `
        <div class="no-documents">
          <i class="fas fa-info-circle"></i>
          <p>ไม่มีเอกสารที่เกี่ยวข้องในขณะนี้</p>
        </div>
      `;
    }
    
    return html;
  }
  
  /**
   * แสดงข้อมูลจำเพาะของสินค้า
   * @param {Object} specs - ข้อมูลจำเพาะ
   * @returns {string} - HTML สำหรับข้อมูลจำเพาะ
   */
  renderProductSpecs(specs) {
    if (!specs || Object.keys(specs).length === 0) {
      return `
        <div class="product-specs">
          <h2>ข้อมูลจำเพาะ</h2>
          <div class="no-specs">
            <i class="fas fa-info-circle"></i>
            <p>ไม่มีข้อมูลจำเพาะในขณะนี้</p>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="product-specs">
        <h2>ข้อมูลจำเพาะ</h2>
        <div class="specs-table">
          <table>
            <tbody>
              ${this.renderProductSpecsTable(specs)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  /**
   * สร้าง HTML สำหรับตารางข้อมูลจำเพาะของสินค้า
   * @param {Object} specs - ข้อมูลจำเพาะของสินค้า
   * @returns {string} - HTML string
   */
  renderProductSpecsTable(specs) {
    if (!specs) return '<tr><td colspan="2">ไม่พบข้อมูลจำเพาะ</td></tr>';
    
    let html = '';
    
    // แปลง object ข้อมูลจำเพาะให้เป็น HTML table rows
    Object.entries(specs).forEach(([key, value]) => {
      // จัดการแปลงชื่อคีย์เป็นภาษาไทย
      const keyMapping = {
        resolution: 'ความละเอียด',
        displayType: 'ประเภทจอภาพ',
        hdr: 'เทคโนโลยี HDR',
        refreshRate: 'อัตรารีเฟรช',
        smartFeatures: 'ฟีเจอร์สมาร์ท',
        ports: 'พอร์ตเชื่อมต่อ',
        audio: 'ระบบเสียง',
        type: 'ประเภท',
        btu: 'BTU',
        systemType: 'ระบบการทำงาน',
        energyRating: 'ฉลากประหยัดไฟ',
        coolant: 'สารทำความเย็น',
        powerConsumption: 'กำลังไฟฟ้า',
        features: 'คุณสมบัติพิเศษ',
        brand: 'ยี่ห้อ',
        model: 'รุ่น',
        size: 'ขนาด',
        weight: 'น้ำหนัก',
        warranty: 'การรับประกัน'
      };
      
      const displayKey = keyMapping[key] || key;
      
      // จัดการกับค่าที่เป็น object หรือ array
      let displayValue = '';
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          displayValue = value.map(v => this.escapeHtml(String(v))).join(', ');
        } else {
          // สำหรับ object เช่น ports
          displayValue = '<ul>';
          Object.entries(value).forEach(([subKey, subValue]) => {
            const subKeyMapping = {
              hdmi: 'HDMI',
              usb: 'USB',
              optical: 'Optical Audio',
              ethernet: 'Ethernet'
            };
            const displaySubKey = subKeyMapping[subKey] || subKey;
            displayValue += `<li>${this.escapeHtml(displaySubKey)}: ${this.escapeHtml(String(subValue))}</li>`;
          });
          displayValue += '</ul>';
        }
      } else {
        displayValue = this.escapeHtml(String(value));
      }
      
      html += `
        <tr>
          <td class="spec-name">${this.escapeHtml(displayKey)}</td>
          <td class="spec-value">${displayValue}</td>
        </tr>
      `;
    });
    
    return html;
  }
  
  /**
   * แสดงข้อมูลรายการสินค้า
   * @param {Array} products - รายการสินค้า
   */
  renderProductList(products) {
    if (!this.productListContainer) {
      console.log('รายการสินค้า:', products);
      return;
    }
    
    if (!products || products.length === 0) {
      this.productListContainer.innerHTML = `
        <div class="no-products">
          <i class="fas fa-box-open"></i>
          <h3>ไม่พบสินค้าในระบบ</h3>
          <p>ขณะนี้ยังไม่มีสินค้าในระบบ</p>
        </div>
      `;
      return;
    }
    
    const html = `
      <div class="products-grid">
        ${products.map(product => this.renderProductCard(product)).join('')}
      </div>
    `;
    
    this.productListContainer.innerHTML = html;
  }
  
  /**
   * สร้างการ์ดสินค้า
   * @param {Object} product - ข้อมูลสินค้า
   * @returns {string} - HTML สำหรับการ์ดสินค้า
   */
  renderProductCard(product) {
    return `
      <div class="product-card" onclick="window.location.href='product-details.html?id=${encodeURIComponent(product.id)}'">
        <div class="product-image">
          ${this.renderProductImage(product.images, product.name)}
        </div>
        <div class="product-info">
          <h3>${this.escapeHtml(product.name)}</h3>
          <p class="product-brand">${this.escapeHtml(product.brand)}</p>
          <div class="product-price">
            <span class="current-price">฿${product.price.toLocaleString()}</span>
            ${product.originalPrice && product.originalPrice > product.price ? `
              <span class="original-price">฿${product.originalPrice.toLocaleString()}</span>
            ` : ''}
          </div>
          <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
            ${product.stock > 0 ? `มีสินค้า (${product.stock})` : 'สินค้าหมด'}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * จัดการการเปิด Modal สำหรับการแชร์
   * @param {Event} event - DOM event
   */
  handleOpenShareModal(event) {
    const productId = event.currentTarget.getAttribute('data-product-id');
    console.log('เปิด Share Modal สำหรับสินค้า:', productId);
    
    // ดึง Modal Template
    const modalTemplate = document.getElementById('share-modal-template');
    if (!modalTemplate) {
      alert('ระบบแชร์ข้อมูลอยู่ระหว่างการพัฒนา');
      return;
    }
    
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.innerHTML = modalTemplate.innerHTML;
    
    // เพิ่ม Modal ไปยัง body
    document.body.appendChild(modal);
    
    // ตั้งค่า event listeners สำหรับปุ่มปิด Modal
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
    
    // ตั้งค่า event listeners สำหรับปุ่มส่งข้อมูล
    const sendButton = modal.querySelector('#sendDocuments');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        // แจ้งเตือนว่าระบบอยู่ระหว่างการพัฒนา
        alert('ระบบส่งข้อมูลให้ลูกค้าอยู่ระหว่างการพัฒนา');
        document.body.removeChild(modal);
      });
    }
  }
  
  /**
   * Escape HTML เพื่อป้องกัน XSS
   * @param {string} text - ข้อความที่ต้องการ escape
   * @returns {string} - ข้อความที่ escape แล้ว
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// สร้าง instance ของ ProductController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const productController = new ProductController();
});

export default ProductController;