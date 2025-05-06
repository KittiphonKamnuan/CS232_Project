/**
 * product-controller.js
 * Controller สำหรับจัดการข้อมูลสินค้า
 * ปรับปรุงให้ใช้ dataService แทน dataService
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
    
    // สามารถเพิ่ม event listeners อื่นๆ ตามที่ต้องการได้ที่นี่
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
        throw new Error('ไม่พบรหัสสินค้า');
      }
      
      // เปลี่ยนจาก dataService เป็น dataService
      const product = await dataService.getProductById(productId);
      
      // แสดงข้อมูลสินค้า
      this.renderProductDetails(product);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
      console.error('Error loading product details:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.productDetailsContainer) {
        this.productDetailsContainer.innerHTML = `
          <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>ไม่พบข้อมูลสินค้า</p>
            <a href="index.html" class="btn btn-primary">กลับไปยังหน้าค้นหาสินค้า</a>
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
      
      // เปลี่ยนจาก dataService เป็น dataService
      const products = await dataService.getProducts();
      
      // แสดงรายการสินค้า
      this.renderProductList(products);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดรายการสินค้า');
      console.error('Error loading product list:', error);
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
    
    // ดึงเอกสารที่เกี่ยวข้องกับสินค้าจาก documentService
    let relatedDocuments = [];
    try {
      relatedDocuments = await documentService.getDocumentsByProduct(product.id);
    } catch (error) {
      console.error('Error loading related documents:', error);
      // ไม่ต้องแสดงข้อผิดพลาด เพราะเป็นข้อมูลเสริม
    }
    
    // สร้าง HTML สำหรับแสดงรายละเอียดสินค้า
    const html = `
      <div class="product-details">
        <div class="product-header">
          <h1>${product.name}</h1>
          <p class="product-code">รหัสสินค้า: ${product.id}</p>
        </div>
        
        <div class="product-content">
          <div class="product-gallery">
            <div class="product-main-image">
              <img src="${product.images[0] || '/api/placeholder/400/300'}" alt="${product.name}">
            </div>
            <div class="product-thumbnails">
              ${product.images.map(image => `
                <div class="thumbnail">
                  <img src="${image || '/api/placeholder/100/75'}" alt="${product.name}">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="product-info">
            <div class="product-price-section">
              <div class="price-container">
                <p class="price">฿${product.price.toLocaleString()}</p>
                ${product.originalPrice ? `
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
              <button class="btn btn-primary" onclick="window.location.href='sale-details.html?action=new&product=${product.id}'">
                <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
              </button>
              <button class="btn btn-outline" id="openShareModal" data-product-id="${product.id}">
                <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
              </button>
            </div>
            
            <div class="product-delivery">
              <h3>ข้อมูลการจัดส่ง</h3>
              <p><i class="fas fa-truck"></i> <span>จัดส่ง:</span> ${product.delivery.estimatedDays}</p>
              <p><i class="fas fa-shield-alt"></i> <span>การรับประกัน:</span> ${product.warranty}</p>
            </div>
            
            <div class="product-documents">
              <h3>เอกสารที่เกี่ยวข้อง</h3>
              <div class="document-links">
                ${this.renderDocumentLinks(relatedDocuments, product.id)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="product-description">
          <h2>รายละเอียดสินค้า</h2>
          <p>${product.description}</p>
        </div>
        
        <div class="product-specs">
          <h2>ข้อมูลจำเพาะ</h2>
          <div class="specs-table">
            <table>
              <tbody>
                ${this.renderProductSpecsTable(product.specs)}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="related-products">
          <h2>สินค้าที่คล้ายกัน</h2>
          <div class="related-products-container">
            <!-- จะมีการเพิ่มข้อมูลจริงในอนาคต -->
            <p>ไม่พบสินค้าที่คล้ายกัน</p>
          </div>
        </div>
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
   * สร้างลิงก์เอกสารที่เกี่ยวข้อง
   * @param {Array} documents - รายการเอกสาร
   * @param {string} productId - รหัสสินค้า
   * @returns {string} - HTML สำหรับลิงก์เอกสาร
   */
  renderDocumentLinks(documents, productId) {
    if (!documents || documents.length === 0) {
      return `
        <a href="document-viewer.html?type=spec&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> สเปคสินค้า
        </a>
        <a href="document-viewer.html?type=manual&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
        </a>
        <a href="document-viewer.html?type=compare&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
        </a>
      `;
    }
    
    // สร้าง HTML สำหรับเอกสารแต่ละประเภท
    let html = '';
    
    // กรองเอกสารตามประเภท
    const specDocs = documents.filter(doc => doc.type === 'สเปคสินค้า');
    const manualDocs = documents.filter(doc => doc.type === 'คู่มือการใช้งาน');
    const compareDocs = documents.filter(doc => doc.type === 'เปรียบเทียบสินค้า');
    const brochureDocs = documents.filter(doc => doc.type === 'โบรชัวร์');
    
    // เพิ่มลิงก์เอกสารตามที่มี
    if (specDocs.length > 0) {
      html += `
        <a href="document-viewer.html?document=${specDocs[0].id}" class="document-link">
          <i class="fas fa-file-pdf"></i> สเปคสินค้า
        </a>
      `;
    } else {
      html += `
        <a href="document-viewer.html?type=spec&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> สเปคสินค้า
        </a>
      `;
    }
    
    if (manualDocs.length > 0) {
      html += `
        <a href="document-viewer.html?document=${manualDocs[0].id}" class="document-link">
          <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
        </a>
      `;
    } else {
      html += `
        <a href="document-viewer.html?type=manual&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
        </a>
      `;
    }
    
    if (compareDocs.length > 0) {
      html += `
        <a href="document-viewer.html?document=${compareDocs[0].id}" class="document-link">
          <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
        </a>
      `;
    } else {
      html += `
        <a href="document-viewer.html?type=compare&id=${productId}" class="document-link">
          <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
        </a>
      `;
    }
    
    // เพิ่มโบรชัวร์ถ้ามี
    if (brochureDocs.length > 0) {
      html += `
        <a href="document-viewer.html?document=${brochureDocs[0].id}" class="document-link">
          <i class="fas fa-file-pdf"></i> โบรชัวร์
        </a>
      `;
    }
    
    return html;
  }
  
  /**
   * สร้าง HTML สำหรับตารางข้อมูลจำเพาะของสินค้า
   * @param {Object} specs - ข้อมูลจำเพาะของสินค้า
   * @returns {string} - HTML string
   */
  renderProductSpecsTable(specs) {
    if (!specs) return '<tr><td>ไม่พบข้อมูลจำเพาะ</td></tr>';
    
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
        features: 'คุณสมบัติพิเศษ'
      };
      
      const displayKey = keyMapping[key] || key;
      
      // จัดการกับค่าที่เป็น object หรือ array
      let displayValue = '';
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
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
            displayValue += `<li>${displaySubKey}: ${subValue}</li>`;
          });
          displayValue += '</ul>';
        }
      } else {
        displayValue = value;
      }
      
      html += `
        <tr>
          <td class="spec-name">${displayKey}</td>
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
    // ในกรณีที่เราต้องการแสดงรายการสินค้าในหน้า index
    // ฟังก์ชันนี้จะถูกใช้ในอนาคต
    console.log('รายการสินค้า:', products);
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
    if (!modalTemplate) return;
    
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
        // จำลองการส่งข้อมูล
        alert('ส่งข้อมูลให้ลูกค้าเรียบร้อยแล้ว');
        document.body.removeChild(modal);
      });
    }
  }
}

// สร้าง instance ของ ProductController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const productController = new ProductController();
});

export default ProductController;