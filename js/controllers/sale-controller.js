/**
 * sale-controller.js
 * Controller สำหรับจัดการข้อมูลรายละเอียดการขาย
 * ปรับปรุงให้ใช้ dataService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

class SaleController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // Element ที่เกี่ยวข้องกับรายละเอียดการขาย
    this.saleDetailsContainer = document.getElementById('sale-details');
    
    // Element สำหรับการอัปเดตสถานะ
    this.updateStatusBtn = document.getElementById('update-status-btn');
    this.updateStatusModal = document.getElementById('update-status-modal');
    this.confirmUpdateStatusBtn = document.getElementById('confirm-update-status');
    
    // Element สำหรับการเพิ่มบันทึก
    this.commentInput = document.getElementById('comment-input');
    this.addCommentBtn = document.getElementById('add-comment-btn');
    
    // ตัวแปรเก็บข้อมูลการขาย
    this.saleData = null;
    
    // ตัวแปรสำหรับการตรวจสอบโหมดการทำงาน
    this.isNewSaleMode = false;
    this.isEditMode = false;
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  async init() {
    // ดึงพารามิเตอร์จาก URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // ตรวจสอบโหมดการทำงาน
    const action = urlParams.get('action');
    const productId = urlParams.get('product');
    const customerId = urlParams.get('customer');
    const saleId = urlParams.get('id');
    
    // ตรวจสอบว่าเป็นการสร้างการขายใหม่หรือไม่
    if (action === 'new') {
      this.isNewSaleMode = true;
      
      // ดึงข้อมูลสินค้า (ถ้ามี)
      if (productId) {
        await this.loadProductForNewSale(productId);
      }
      
      // ดึงข้อมูลลูกค้า (ถ้ามี)
      if (customerId) {
        await this.loadCustomerForNewSale(customerId);
      }
      
      // แสดงฟอร์มสร้างการขายใหม่
      this.renderNewSaleForm();
    } else if (saleId) {
      // ดึงข้อมูลรายละเอียดการขาย
      await this.loadSaleDetails(saleId);
    } else {
      // กรณีไม่มีพารามิเตอร์ที่จำเป็น
      this.showError('ไม่พบรหัสการขายหรือข้อมูลที่จำเป็น');
    }
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listener สำหรับปุ่มอัปเดตสถานะ
    if (this.updateStatusBtn) {
      this.updateStatusBtn.addEventListener('click', () => {
        this.handleUpdateStatus();
      });
    }
    
    // Event Listener สำหรับปุ่มยืนยันการอัปเดตสถานะ
    if (this.confirmUpdateStatusBtn) {
      this.confirmUpdateStatusBtn.addEventListener('click', () => {
        this.handleConfirmUpdateStatus();
      });
    }
    
    // Event Listener สำหรับปุ่มปิด Modal
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this.updateStatusModal) {
          this.updateStatusModal.style.display = 'none';
        }
      });
    });
    
    // Event Listener สำหรับปุ่มเพิ่มบันทึก
    if (this.addCommentBtn) {
      this.addCommentBtn.addEventListener('click', () => {
        this.handleAddComment();
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
   * โหลดข้อมูลสินค้าสำหรับการสร้างการขายใหม่
   * @param {string} productId - รหัสสินค้า
   */
  async loadProductForNewSale(productId) {
    try {
      // ดึงข้อมูลสินค้าจาก Mockup Service
      const product = await dataService.getProductById(productId);
      
      // เก็บข้อมูลสินค้า
      this.productData = product;
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  }
  
  /**
   * โหลดข้อมูลลูกค้าสำหรับการสร้างการขายใหม่
   * @param {string} customerId - รหัสลูกค้า
   */
  async loadCustomerForNewSale(customerId) {
    try {
      // ดึงข้อมูลลูกค้าจาก Mockup Service
      const customer = await dataService.getCustomerById(customerId);
      
      // เก็บข้อมูลลูกค้า
      this.customerData = customer;
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  }
  
  /**
   * โหลดข้อมูลรายละเอียดการขาย
   * @param {string} saleId - รหัสการขาย
   */
  async loadSaleDetails(saleId) {
    try {
      this.showLoading();
      this.hideError();
      
      // ดึงข้อมูลการขายจาก Mockup Service
      this.saleData = await dataService.getSaleById(saleId);
      
      // แสดงข้อมูลรายละเอียดการขาย
      this.renderSaleDetails();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายละเอียดการขาย');
      console.error('Error loading sale details:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.saleDetailsContainer) {
        this.saleDetailsContainer.innerHTML = `
          <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>ไม่พบข้อมูลการขาย</p>
            <a href="sales-report.html" class="btn btn-primary">กลับไปยังหน้าติดตามการขาย</a>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูลรายละเอียดการขาย
   */
  renderSaleDetails() {
    if (!this.saleDetailsContainer || !this.saleData) return;
    
    // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
    const saleDate = new Date(this.saleData.date);
    const formattedDate = `${saleDate.getDate()}/${saleDate.getMonth() + 1}/${saleDate.getFullYear() + 543}`;
    
    // กำหนด CSS class ตามสถานะ
    let statusClass = '';
    switch (this.saleData.status) {
      case 'สอบถามข้อมูล': statusClass = 'status-inquiry'; break;
      case 'ลูกค้าสนใจ': statusClass = 'status-interested'; break;
      case 'ส่งใบเสนอราคา': statusClass = 'status-quotation'; break;
      case 'ต่อรองราคา': statusClass = 'status-negotiation'; break;
      case 'ยืนยันการสั่งซื้อ': statusClass = 'status-success'; break;
      case 'ส่งมอบสินค้า': statusClass = 'status-delivered'; break;
      case 'บริการหลังการขาย': statusClass = 'status-aftersale'; break;
      default: statusClass = ''; break;
    }
    
    // สร้าง HTML สำหรับรายการสินค้า
    let productItemsHtml = '';
    this.saleData.items.forEach(item => {
      productItemsHtml += `
        <tr>
          <td>
            <div class="product-brief">
              <div class="product-thumbnail">
                <img src="/api/placeholder/50/50" alt="${item.productName}">
              </div>
              <p class="product-name">${item.productName}</p>
            </div>
          </td>
          <td>${item.productId}</td>
          <td>฿${item.unitPrice.toLocaleString()}</td>
          <td>${item.quantity}</td>
          <td>฿${(item.discount || 0).toLocaleString()} (${item.discount ? Math.round((item.discount / item.unitPrice) * 100) : 0}%)</td>
          <td class="price">฿${item.total.toLocaleString()}</td>
        </tr>
      `;
    });
    
    // สร้าง HTML สำหรับประวัติการดำเนินการ
    let historyHtml = '';
    this.saleData.history.forEach(history => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const historyDate = new Date(history.date);
      const formattedHistoryDate = `${historyDate.getDate()} ${this.getThaiMonth(historyDate.getMonth())} ${historyDate.getFullYear() + 543}, ${this.formatTime(historyDate)}`;
      
      // กำหนด CSS class ตามสถานะ
      let historyStatusClass = '';
      switch (history.status) {
        case 'ยืนยันการสั่งซื้อ': historyStatusClass = 'success'; break;
        case 'ส่งใบเสนอราคา': historyStatusClass = 'warning'; break;
        case 'ลูกค้าสนใจ': historyStatusClass = 'info'; break;
        case 'สอบถามข้อมูล': historyStatusClass = 'info'; break;
        default: historyStatusClass = ''; break;
      }
      
      historyHtml += `
        <div class="timeline-item">
          <div class="timeline-point ${historyStatusClass}"></div>
          <div class="timeline-content">
            <h3>${history.status}</h3>
            <p class="timeline-date">${formattedHistoryDate}</p>
            <p>${history.notes}</p>
            <p class="timeline-user">${history.user}</p>
          </div>
        </div>
      `;
    });
    
    // สร้าง HTML สำหรับบันทึกและความคิดเห็น
    let commentsHtml = '';
    const comments = [
      {
        user: "คุณสมชาย (พนักงานขาย)",
        date: "2568-04-14T10:30:00",
        text: "ลูกค้าขอให้จัดส่งในวันพฤหัสบดีที่ 16 เม.ย. และแจ้งเตือนก่อนจัดส่ง 1 ชั่วโมง"
      },
      {
        user: "คุณสมชาย (พนักงานขาย)",
        date: "2568-04-13T15:45:00",
        text: "ลูกค้ายืนยันว่าสนใจรุ่น QN90C เนื่องจากต้องการคุณภาพหน้าจอที่ดีสำหรับดูหนังและเล่นเกม"
      }
    ];
    
    comments.forEach(comment => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const commentDate = new Date(comment.date);
      const formattedCommentDate = `${commentDate.getDate()} ${this.getThaiMonth(commentDate.getMonth())} ${commentDate.getFullYear() + 543}, ${this.formatTime(commentDate)}`;
      
      commentsHtml += `
        <div class="comment-item">
          <div class="comment-avatar">
            <span>${comment.user.charAt(0)}</span>
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <h3>${comment.user}</h3>
              <span class="comment-date">${formattedCommentDate}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
          </div>
        </div>
      `;
    });
    
    // สร้าง HTML สำหรับเอกสารที่เกี่ยวข้อง
    let documentsHtml = '';
    if (this.saleData.documents && this.saleData.documents.length > 0) {
      this.saleData.documents.forEach(async (documentId) => {
        try {
          // ดึงข้อมูลเอกสารจาก Mockup Service
          const document = await dataService.getDocumentById(documentId);
          
          // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
          const docDate = new Date(document.date);
          const formattedDocDate = `${docDate.getDate()} ${this.getThaiMonth(docDate.getMonth())} ${docDate.getFullYear() + 543}`;
          
          // กำหนดไอคอนตามประเภทเอกสาร
          let iconClass = '';
          switch (document.type) {
            case 'ใบเสนอราคา': iconClass = 'fas fa-file-invoice-dollar'; break;
            case 'ใบสั่งซื้อ': iconClass = 'fas fa-file-signature'; break;
            case 'ใบเสร็จรับเงิน': iconClass = 'fas fa-file-invoice'; break;
            default: iconClass = 'fas fa-file-pdf'; break;
          }
          
          const documentItemHtml = `
            <div class="document-item">
              <div class="document-icon">
                <i class="${iconClass}"></i>
              </div>
              <div class="document-info">
                <h3>${document.title}</h3>
                <p class="document-date">${formattedDocDate}</p>
              </div>
              <div class="document-actions">
                <button class="btn-icon view-document" data-document-id="${document.id}" title="ดูเอกสาร">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon download-document" data-document-id="${document.id}" title="ดาวน์โหลด">
                  <i class="fas fa-download"></i>
                </button>
              </div>
            </div>
          `;
          
          // เพิ่ม HTML ของเอกสารลงในรายการ
          const documentsList = document.querySelector('.document-list');
          if (documentsList) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = documentItemHtml;
            documentsList.appendChild(tempDiv.firstElementChild);
            
            // ตั้งค่า event listeners สำหรับปุ่มดูเอกสาร
            const viewButtons = documentsList.querySelectorAll('.view-document');
            viewButtons.forEach(button => {
              button.addEventListener('click', () => {
                const docId = button.getAttribute('data-document-id');
                this.handleViewDocument(docId);
              });
            });
            
            // ตั้งค่า event listeners สำหรับปุ่มดาวน์โหลดเอกสาร
            const downloadButtons = documentsList.querySelectorAll('.download-document');
            downloadButtons.forEach(button => {
              button.addEventListener('click', () => {
                const docId = button.getAttribute('data-document-id');
                this.handleDownloadDocument(docId);
              });
            });
          }
        } catch (error) {
          console.error(`Error loading document ${documentId}:`, error);
        }
      });
    } else {
      documentsHtml = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>ไม่มีเอกสารที่เกี่ยวข้อง</p>
        </div>
      `;
    }
    
    // สร้าง HTML สำหรับรายละเอียดการขาย
    const html = `
      <!-- Sale Header -->
      <div class="sale-header">
        <div class="sale-title">
          <h1>รายการขาย #${this.saleData.id}</h1>
          <span class="sale-date">วันที่: ${formattedDate}</span>
        </div>
        <div class="sale-status">
          <span class="status ${statusClass}">${this.saleData.status}</span>
        </div>
        <div class="sale-actions">
          <button class="btn btn-outline">
            <i class="fas fa-print"></i> พิมพ์
          </button>
          <button class="btn btn-primary">
            <i class="fas fa-file-pdf"></i> สร้าง PDF
          </button>
          <button class="btn btn-success" id="update-status-btn">
            <i class="fas fa-sync-alt"></i> อัปเดตสถานะ
          </button>
        </div>
      </div>
      
      <!-- Sale Details Grid -->
      <div class="sale-details-grid">
        <!-- Customer Information -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-user"></i> ข้อมูลลูกค้า</h3>
            <a href="customer-details.html?id=${this.saleData.customerId}" class="btn-link">
              <i class="fas fa-external-link-alt"></i> ดูรายละเอียด
            </a>
          </div>
          <div class="card-body">
            <p><strong>ชื่อ:</strong> ${this.saleData.customerName}</p>
            <p><strong>เบอร์โทรศัพท์:</strong> ${this.saleData.customerPhone || '-'}</p>
            <p><strong>อีเมล:</strong> ${this.saleData.customerEmail || '-'}</p>
            <p><strong>ที่อยู่:</strong> ${this.saleData.delivery.address || '-'}</p>
          </div>
        </div>
        
        <!-- Sale Summary -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-receipt"></i> สรุปการขาย</h3>
          </div>
          <div class="card-body">
            <p><strong>รวมมูลค่าสินค้า:</strong> <span class="price">฿${this.saleData.subtotal.toLocaleString()}</span></p>
            <p><strong>ส่วนลด:</strong> <span class="discount">฿${(this.saleData.discount || 0).toLocaleString()}</span></p>
            <p><strong>ภาษีมูลค่าเพิ่ม (7%):</strong> <span class="tax">${this.saleData.tax}</span></p>
            <p class="total-amount"><strong>ยอดรวมทั้งสิ้น:</strong> <span class="price">฿${this.saleData.total.toLocaleString()}</span></p>
          </div>
        </div>
        
        <!-- Delivery Information -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-truck"></i> ข้อมูลการจัดส่ง</h3>
          </div>
          <div class="card-body">
            <p><strong>วิธีการจัดส่ง:</strong> ${this.saleData.delivery.method}</p>
            <p><strong>กำหนดส่ง:</strong> ${this.saleData.delivery.scheduledDate}</p>
            <p><strong>ที่อยู่จัดส่ง:</strong> ${this.saleData.delivery.address}</p>
            <p><strong>หมายเหตุ:</strong> ${this.saleData.delivery.notes || '-'}</p>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-credit-card"></i> ข้อมูลการชำระเงิน</h3>
          </div>
          <div class="card-body">
            <p><strong>วิธีการชำระเงิน:</strong> ${this.saleData.payment.method}</p>
            <p><strong>สถานะ:</strong> <span class="status status-success">${this.saleData.payment.status}</span></p>
            <p><strong>วันที่ชำระเงิน:</strong> ${new Date(this.saleData.payment.date).toLocaleDateString('th-TH')}</p>
            <p><strong>เลขที่อ้างอิง:</strong> ${this.saleData.payment.reference || '-'}</p>
          </div>
        </div>
      </div>
      
      <!-- Product Items -->
      <div class="card">
        <h2>รายการสินค้า</h2>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>รหัสสินค้า</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวน</th>
                <th>ส่วนลด</th>
                <th>ราคารวม</th>
              </tr>
            </thead>
            <tbody>
              ${productItemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right"><strong>รวมทั้งสิ้น</strong></td>
                <td class="price"><strong>฿${this.saleData.total.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!-- Sale History -->
      <div class="card">
        <h2>ประวัติการดำเนินการ</h2>
        
        <div class="history-timeline">
          ${historyHtml}
        </div>
      </div>
      
      <!-- Notes and Comments -->
      <div class="card">
        <h2>บันทึกและความคิดเห็น</h2>
        
        <div class="comment-section">
          <div class="comment-list">
            ${commentsHtml}
          </div>
          
          <div class="comment-form">
            <h3>เพิ่มบันทึก</h3>
            <textarea id="comment-input" placeholder="พิมพ์ข้อความหรือบันทึกของคุณที่นี่..."></textarea>
            <button class="btn btn-primary" id="add-comment-btn">
              <i class="fas fa-plus"></i> เพิ่มบันทึก
            </button>
          </div>
        </div>
      </div>
      
      <!-- Related Documents -->
      <div class="card">
        <h2>เอกสารที่เกี่ยวข้อง</h2>
        
        <div class="document-list">
          ${documentsHtml}
        </div>
        
        <div class="text-center mt-4">
          <button class="btn btn-outline" id="upload-document-btn">
            <i class="fas fa-upload"></i> อัปโหลดเอกสารเพิ่มเติม
          </button>
        </div>
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.saleDetailsContainer.innerHTML = html;
    
    // ตั้งค่า Event Listeners สำหรับองค์ประกอบที่สร้างขึ้นใหม่
    this.setupEventListeners();
  }
  
  /**
   * แสดงฟอร์มสร้างการขายใหม่
   */
  renderNewSaleForm() {
    if (!this.saleDetailsContainer) return;
    
    // สร้าง HTML สำหรับฟอร์มสร้างการขายใหม่
    let html = `
      <!-- Sale Header -->
      <div class="sale-header">
        <div class="sale-title">
          <h1>สร้างการขายใหม่</h1>
        </div>
        <div class="sale-actions">
          <button class="btn btn-outline" id="cancel-btn">
            <i class="fas fa-times"></i> ยกเลิก
          </button>
          <button class="btn btn-primary" id="save-draft-btn">
            <i class="fas fa-save"></i> บันทึกร่าง
          </button>
          <button class="btn btn-success" id="create-sale-btn">
            <i class="fas fa-check"></i> สร้างการขาย
          </button>
        </div>
      </div>
      
      <div class="card">
        <h2>ข้อมูลลูกค้า</h2>
        
        <div class="form-group">
          <label for="customer-select" class="form-label">เลือกลูกค้า</label>
          <div class="select-container">
            <select id="customer-select" class="form-input">
              <option value="">-- เลือกลูกค้า --</option>
              <option value="CUST001">คุณนภา วงศ์ประดิษฐ์ (089-123-4567)</option>
              <option value="CUST002">คุณสมศักดิ์ ใจดี (062-987-6543)</option>
              <option value="CUST003">คุณประภา เจริญพร (091-234-5678)</option>
            </select>
          </div>
          <p class="form-help">หรือ <a href="#" id="add-new-customer">เพิ่มลูกค้าใหม่</a></p>
        </div>
        
        <div id="customer-info" class="customer-info-container" style="display: none;">
          <div class="customer-info-header">
            <h3>ข้อมูลลูกค้า</h3>
            <button class="btn-link" id="change-customer">เปลี่ยนลูกค้า</button>
          </div>
          <div class="customer-info-content">
            <p><strong>ชื่อ:</strong> <span id="customer-name"></span></p>
            <p><strong>เบอร์โทรศัพท์:</strong> <span id="customer-phone"></span></p>
            <p><strong>อีเมล:</strong> <span id="customer-email"></span></p>
            <p><strong>ที่อยู่:</strong> <span id="customer-address"></span></p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2>รายการสินค้า</h2>
        
        <div class="form-group">
          <label for="product-search" class="form-label">ค้นหาสินค้า</label>
          <div class="search-input">
            <input type="text" id="product-search" placeholder="พิมพ์ชื่อหรือรหัสสินค้า..." class="form-input">
            <i class="fas fa-search"></i>
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table" id="product-list-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>รหัสสินค้า</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวน</th>
                <th>ส่วนลด</th>
                <th>ราคารวม</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              ${this.productData ? `
                <tr>
                  <td>
                    <div class="product-brief">
                      <div class="product-thumbnail">
                        <img src="${this.productData.images[0] || '/api/placeholder/50/50'}" alt="${this.productData.name}">
                      </div>
                      <p class="product-name">${this.productData.name}</p>
                    </div>
                  </td>
                  <td>${this.productData.id}</td>
                  <td>฿${this.productData.price.toLocaleString()}</td>
                  <td>
                    <input type="number" class="quantity-input" value="1" min="1" data-product-id="${this.productData.id}">
                  </td>
                  <td>
                    <input type="number" class="discount-input" value="0" min="0" data-product-id="${this.productData.id}">
                  </td>
                  <td class="price">฿${this.productData.price.toLocaleString()}</td>
                  <td>
                    <button class="btn-icon remove-product" data-product-id="${this.productData.id}" title="ลบสินค้า">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ` : `
                <tr class="empty-row">
                  <td colspan="7" class="text-center">ยังไม่มีสินค้า กรุณาค้นหาและเพิ่มสินค้า</td>
                </tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right"><strong>รวมทั้งสิ้น</strong></td>
                <td class="price"><strong id="total-price">฿${this.productData ? this.productData.price.toLocaleString() : '0'}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div class="card">
        <h2>ข้อมูลการจัดส่ง</h2>
        
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
        
        <div class="form-group">
          <label for="delivery-address" class="form-label">ที่อยู่จัดส่ง</label>
          <textarea id="delivery-address" class="form-input" rows="3" placeholder="กรอกที่อยู่จัดส่ง..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="delivery-notes" class="form-label">หมายเหตุการจัดส่ง</label>
          <textarea id="delivery-notes" class="form-input" rows="2" placeholder="กรอกหมายเหตุการจัดส่ง (ถ้ามี)..."></textarea>
        </div>
      </div>
      
      <div class="card">
        <h2>ข้อมูลการชำระเงิน</h2>
        
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
            <option value="ชำระเงินแล้ว">ชำระเงินแล้ว</option>
            <option value="รอชำระเงิน">รอชำระเงิน</option>
          </select>
        </div>
        
        <div class="form-group" id="payment-date-group">
          <label for="payment-date" class="form-label">วันที่ชำระเงิน</label>
          <input type="date" id="payment-date" class="form-input">
        </div>
        
        <div class="form-group" id="payment-reference-group">
          <label for="payment-reference" class="form-label">เลขที่อ้างอิง</label>
          <input type="text" id="payment-reference" class="form-input" placeholder="กรอกเลขที่อ้างอิงการชำระเงิน...">
        </div>
      </div>
      
      <div class="card">
        <h2>หมายเหตุ</h2>
        
        <div class="form-group">
          <textarea id="sale-notes" class="form-input" rows="3" placeholder="กรอกหมายเหตุหรือรายละเอียดเพิ่มเติม..."></textarea>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-outline" id="cancel-bottom-btn">
          <i class="fas fa-times"></i> ยกเลิก
        </button>
        <button class="btn btn-primary" id="save-draft-bottom-btn">
          <i class="fas fa-save"></i> บันทึกร่าง
        </button>
        <button class="btn btn-success" id="create-sale-bottom-btn">
          <i class="fas fa-check"></i> สร้างการขาย
        </button>
      </div>
    `;
    
    // แสดงผลลัพธ์
    this.saleDetailsContainer.innerHTML = html;
    
    // ตั้งค่า customer select หากมีข้อมูลลูกค้า
    if (this.customerData) {
      const customerSelect = document.getElementById('customer-select');
      if (customerSelect) {
        customerSelect.value = this.customerData.id;
        customerSelect.dispatchEvent(new Event('change'));
      }
      
      // แสดงข้อมูลลูกค้า
      const customerInfo = document.getElementById('customer-info');
      const customerName = document.getElementById('customer-name');
      const customerPhone = document.getElementById('customer-phone');
      const customerEmail = document.getElementById('customer-email');
      const customerAddress = document.getElementById('customer-address');
      
      if (customerInfo && customerName && customerPhone && customerEmail && customerAddress) {
        customerInfo.style.display = 'block';
        customerName.textContent = this.customerData.name;
        customerPhone.textContent = this.customerData.phone;
        customerEmail.textContent = this.customerData.email;
        customerAddress.textContent = this.customerData.address;
      }
    }
    
    // ตั้งค่า Event Listeners สำหรับฟอร์มสร้างการขายใหม่
    this.setupEventListenersForNewSaleForm();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับฟอร์มสร้างการขายใหม่
   */
  setupEventListenersForNewSaleForm() {
    // Event Listener สำหรับปุ่มยกเลิก
    const cancelBtn = document.getElementById('cancel-btn');
    const cancelBottomBtn = document.getElementById('cancel-bottom-btn');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
    
    if (cancelBottomBtn) {
      cancelBottomBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
    
    // Event Listener สำหรับปุ่มบันทึกร่าง
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const saveDraftBottomBtn = document.getElementById('save-draft-bottom-btn');
    
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => {
        this.handleSaveDraft();
      });
    }
    
    if (saveDraftBottomBtn) {
      saveDraftBottomBtn.addEventListener('click', () => {
        this.handleSaveDraft();
      });
    }
    
    // Event Listener สำหรับปุ่มสร้างการขาย
    const createSaleBtn = document.getElementById('create-sale-btn');
    const createSaleBottomBtn = document.getElementById('create-sale-bottom-btn');
    
    if (createSaleBtn) {
      createSaleBtn.addEventListener('click', () => {
        this.handleCreateSale();
      });
    }
    
    if (createSaleBottomBtn) {
      createSaleBottomBtn.addEventListener('click', () => {
        this.handleCreateSale();
      });
    }
    
    // Event Listener สำหรับการเลือกลูกค้า
    const customerSelect = document.getElementById('customer-select');
    
    if (customerSelect) {
      customerSelect.addEventListener('change', () => {
        this.handleCustomerSelect();
      });
    }
    
    // Event Listener สำหรับการเปลี่ยนลูกค้า
    const changeCustomerBtn = document.getElementById('change-customer');
    
    if (changeCustomerBtn) {
      changeCustomerBtn.addEventListener('click', () => {
        this.handleChangeCustomer();
      });
    }
    
    // Event Listener สำหรับการเพิ่มลูกค้าใหม่
    const addNewCustomerBtn = document.getElementById('add-new-customer');
    
    if (addNewCustomerBtn) {
      addNewCustomerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddNewCustomer();
      });
    }
    
    // Event Listener สำหรับการเปลี่ยนแปลงจำนวนสินค้า
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    if (quantityInputs) {
      quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
          this.updateProductTotal();
        });
      });
    }
    
    // Event Listener สำหรับการเปลี่ยนแปลงส่วนลด
    const discountInputs = document.querySelectorAll('.discount-input');
    
    if (discountInputs) {
      discountInputs.forEach(input => {
        input.addEventListener('change', () => {
          this.updateProductTotal();
        });
      });
    }
    
    // Event Listener สำหรับการลบสินค้า
    const removeProductBtns = document.querySelectorAll('.remove-product');
    
    if (removeProductBtns) {
      removeProductBtns.forEach(button => {
        button.addEventListener('click', () => {
          const productId = button.getAttribute('data-product-id');
          this.handleRemoveProduct(productId);
        });
      });
    }
    
    // Event Listener สำหรับการเปลี่ยนแปลงสถานะการชำระเงิน
    const paymentStatusSelect = document.getElementById('payment-status');
    
    if (paymentStatusSelect) {
      paymentStatusSelect.addEventListener('change', () => {
        this.togglePaymentFields();
      });
    }
    
    // ตั้งค่าค่าเริ่มต้นให้กับฟิลด์วันที่
    const deliveryDateInput = document.getElementById('delivery-date');
    const paymentDateInput = document.getElementById('payment-date');
    
    if (deliveryDateInput) {
      // ตั้งค่าวันที่จัดส่งเป็นวันที่ในอีก 3 วัน
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      deliveryDateInput.value = deliveryDate.toISOString().split('T')[0];
    }
    
    if (paymentDateInput) {
      // ตั้งค่าวันที่ชำระเงินเป็นวันที่ปัจจุบัน
      paymentDateInput.value = new Date().toISOString().split('T')[0];
    }
  }
  
  /**
   * ปรับปรุงยอดรวมของสินค้า
   */
  updateProductTotal() {
    // คำนวณยอดรวมของสินค้า
    const quantityInput = document.querySelector('.quantity-input');
    const discountInput = document.querySelector('.discount-input');
    const productPrice = document.querySelector('.product-brief + td + td').textContent;
    const totalPriceElement = document.querySelector('.price:not(#total-price)');
    const totalPriceFooter = document.getElementById('total-price');
    
    if (!quantityInput || !discountInput || !productPrice || !totalPriceElement || !totalPriceFooter) return;
    
    // ดึงค่าราคาสินค้า
    const price = parseFloat(productPrice.replace('฿', '').replace(',', ''));
    const quantity = parseInt(quantityInput.value) || 1;
    const discount = parseFloat(discountInput.value) || 0;
    
    // คำนวณยอดรวม
    const total = (price * quantity) - discount;
    
    // แสดงยอดรวม
    totalPriceElement.textContent = `฿${total.toLocaleString()}`;
    totalPriceFooter.textContent = `฿${total.toLocaleString()}`;
  }
  
  /**
   * สลับการแสดงฟิลด์ที่เกี่ยวข้องกับการชำระเงิน
   */
  togglePaymentFields() {
    const paymentStatus = document.getElementById('payment-status')?.value;
    const paymentDateGroup = document.getElementById('payment-date-group');
    const paymentReferenceGroup = document.getElementById('payment-reference-group');
    
    if (paymentStatus === 'ชำระเงินแล้ว') {
      if (paymentDateGroup) paymentDateGroup.style.display = 'block';
      if (paymentReferenceGroup) paymentReferenceGroup.style.display = 'block';
    } else {
      if (paymentDateGroup) paymentDateGroup.style.display = 'none';
      if (paymentReferenceGroup) paymentReferenceGroup.style.display = 'none';
    }
  }
  
  /**
   * จัดการการเลือกลูกค้า
   */
  async handleCustomerSelect() {
    const customerSelect = document.getElementById('customer-select');
    const customerInfo = document.getElementById('customer-info');
    const customerName = document.getElementById('customer-name');
    const customerPhone = document.getElementById('customer-phone');
    const customerEmail = document.getElementById('customer-email');
    const customerAddress = document.getElementById('customer-address');
    const deliveryAddress = document.getElementById('delivery-address');
    
    if (!customerSelect || !customerInfo || !customerName || !customerPhone || !customerEmail || !customerAddress) return;
    
    const customerId = customerSelect.value;
    
    if (!customerId) {
      customerInfo.style.display = 'none';
      if (deliveryAddress) deliveryAddress.value = '';
      return;
    }
    
    try {
      // ดึงข้อมูลลูกค้าจาก Mockup Service
      const customer = await dataService.getCustomerById(customerId);
      
      // แสดงข้อมูลลูกค้า
      customerName.textContent = customer.name;
      customerPhone.textContent = customer.phone;
      customerEmail.textContent = customer.email;
      customerAddress.textContent = customer.address;
      customerInfo.style.display = 'block';
      
      // ตั้งค่าที่อยู่จัดส่ง
      if (deliveryAddress) deliveryAddress.value = customer.address;
    } catch (error) {
      console.error('Error loading customer data:', error);
      customerInfo.style.display = 'none';
    }
  }
  
  /**
   * จัดการการเปลี่ยนลูกค้า
   */
  handleChangeCustomer() {
    const customerSelect = document.getElementById('customer-select');
    const customerInfo = document.getElementById('customer-info');
    
    if (!customerSelect || !customerInfo) return;
    
    customerSelect.value = '';
    customerInfo.style.display = 'none';
  }
  
  /**
   * จัดการการเพิ่มลูกค้าใหม่
   */
  handleAddNewCustomer() {
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
            <label for="new-customer-name" class="form-label">ชื่อลูกค้า</label>
            <input type="text" id="new-customer-name" class="form-input" placeholder="กรอกชื่อลูกค้า" required>
          </div>
          
          <div class="form-group">
            <label for="new-customer-phone" class="form-label">เบอร์โทรศัพท์</label>
            <input type="tel" id="new-customer-phone" class="form-input" placeholder="กรอกเบอร์โทรศัพท์" required>
          </div>
          
          <div class="form-group">
            <label for="new-customer-email" class="form-label">อีเมล</label>
            <input type="email" id="new-customer-email" class="form-input" placeholder="กรอกอีเมล">
          </div>
          
          <div class="form-group">
            <label for="new-customer-address" class="form-label">ที่อยู่</label>
            <textarea id="new-customer-address" class="form-input" rows="3" placeholder="กรอกที่อยู่"></textarea>
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
        // ดึงข้อมูลที่กรอก
        const name = modal.querySelector('#new-customer-name').value;
        const phone = modal.querySelector('#new-customer-phone').value;
        const email = modal.querySelector('#new-customer-email').value;
        const address = modal.querySelector('#new-customer-address').value;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !phone) {
          alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ของลูกค้า');
          return;
        }
        
        // สร้างตัวเลือกใหม่
        const customerSelect = document.getElementById('customer-select');
        if (customerSelect) {
          const newOption = document.createElement('option');
          newOption.value = `NEW-${Date.now()}`;
          newOption.textContent = `${name} (${phone})`;
          customerSelect.add(newOption);
          
          // เลือกตัวเลือกใหม่
          customerSelect.value = newOption.value;
          
          // แสดงข้อมูลลูกค้า
          const customerInfo = document.getElementById('customer-info');
          const customerName = document.getElementById('customer-name');
          const customerPhone = document.getElementById('customer-phone');
          const customerEmail = document.getElementById('customer-email');
          const customerAddress = document.getElementById('customer-address');
          const deliveryAddress = document.getElementById('delivery-address');
          
          if (customerInfo && customerName && customerPhone && customerEmail && customerAddress) {
            customerName.textContent = name;
            customerPhone.textContent = phone;
            customerEmail.textContent = email;
            customerAddress.textContent = address;
            customerInfo.style.display = 'block';
            
            // ตั้งค่าที่อยู่จัดส่ง
            if (deliveryAddress) deliveryAddress.value = address;
          }
        }
        
        // ปิด Modal
        document.body.removeChild(modal);
      });
    }
  }
  
  /**
   * จัดการการลบสินค้า
   * @param {string} productId - รหัสสินค้า
   */
  handleRemoveProduct(productId) {
    const row = document.querySelector(`tr [data-product-id="${productId}"]`).closest('tr');
    if (!row) return;
    
    // ลบแถวของสินค้า
    row.remove();
    
    // ตรวจสอบว่ายังมีสินค้าหรือไม่
    const productRows = document.querySelectorAll('#product-list-table tbody tr:not(.empty-row)');
    if (productRows.length === 0) {
      // เพิ่มแถวว่างเปล่า
      const tbody = document.querySelector('#product-list-table tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="7" class="text-center">ยังไม่มีสินค้า กรุณาค้นหาและเพิ่มสินค้า</td>
          </tr>
        `;
      }
      
      // ล้างค่ายอดรวม
      const totalPriceFooter = document.getElementById('total-price');
      if (totalPriceFooter) {
        totalPriceFooter.textContent = '฿0';
      }
    } else {
      // อัปเดตยอดรวม
      this.updateProductTotal();
    }
  }
  
  /**
   * จัดการการบันทึกร่าง
   */
  handleSaveDraft() {
    alert('บันทึกร่างการขายเรียบร้อยแล้ว');
    window.location.href = 'sales-report.html';
  }
  
  /**
   * จัดการการสร้างการขาย
   */
  handleCreateSale() {
    // ตรวจสอบข้อมูลที่จำเป็น
    const customerSelect = document.getElementById('customer-select');
    const productTable = document.querySelector('#product-list-table tbody tr:not(.empty-row)');
    const deliveryAddress = document.getElementById('delivery-address');
    
    if (!customerSelect?.value) {
      alert('กรุณาเลือกลูกค้า');
      customerSelect.focus();
      return;
    }
    
    if (!productTable) {
      alert('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    
    if (!deliveryAddress?.value) {
      alert('กรุณากรอกที่อยู่จัดส่ง');
      deliveryAddress.focus();
      return;
    }
    
    alert('สร้างการขายเรียบร้อยแล้ว');
    window.location.href = 'sale-details.html?id=SALE-NEW';
  }
  
  /**
   * จัดการการอัปเดตสถานะ
   */
  handleUpdateStatus() {
    if (!this.updateStatusModal) return;
    
    // แสดง Modal
    this.updateStatusModal.style.display = 'flex';
  }
  
  /**
   * จัดการการยืนยันการอัปเดตสถานะ
   */
  handleConfirmUpdateStatus() {
    if (!this.updateStatusModal) return;
    
    // ดึงข้อมูลที่กรอก
    const statusSelect = document.getElementById('status-select');
    const statusNote = document.getElementById('status-note');
    const notifyCustomer = document.getElementById('notify-customer');
    const notifyManager = document.getElementById('notify-manager');
    
    if (!statusSelect) return;
    
    const newStatus = statusSelect.value;
    const note = statusNote?.value || '';
    const notifyCustomerChecked = notifyCustomer?.checked || false;
    const notifyManagerChecked = notifyManager?.checked || false;
    
    // จำลองการอัปเดตสถานะ
    this.saleData.status = newStatus;
    
    // เพิ่มประวัติการดำเนินการ
    this.saleData.history.unshift({
      status: newStatus,
      date: new Date().toISOString(),
      user: 'คุณสมชาย (พนักงานขาย)',
      notes: note
    });
    
    // อัปเดตข้อมูลในหน้าเว็บ
    this.renderSaleDetails();
    
    // ซ่อน Modal
    this.updateStatusModal.style.display = 'none';
    
    alert(`อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว${notifyCustomerChecked ? ' และส่งการแจ้งเตือนไปยังลูกค้า' : ''}${notifyManagerChecked ? ' และส่งการแจ้งเตือนไปยังผู้จัดการ' : ''}`);
  }
  
  /**
   * จัดการการเพิ่มบันทึก
   */
  handleAddComment() {
    if (!this.commentInput) return;
    
    const commentText = this.commentInput.value.trim();
    if (!commentText) {
      alert('กรุณากรอกข้อความก่อนเพิ่มบันทึก');
      return;
    }
    
    // สร้างรายการบันทึกใหม่
    const commentList = document.querySelector('.comment-list');
    if (!commentList) return;
    
    const newComment = document.createElement('div');
    newComment.className = 'comment-item';
    newComment.innerHTML = `
      <div class="comment-avatar">
        <span>ส</span>
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <h3>คุณสมชาย (พนักงานขาย)</h3>
          <span class="comment-date">${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}</span>
        </div>
        <p class="comment-text">${commentText}</p>
      </div>
    `;
    
    // เพิ่มบันทึกใหม่ลงในรายการ
    commentList.insertBefore(newComment, commentList.firstChild);
    
    // ล้างค่าในช่องกรอกข้อความ
    this.commentInput.value = '';
  }
  
  /**
   * จัดการการดูเอกสาร
   * @param {string} documentId - รหัสเอกสาร
   */
  async handleViewDocument(documentId) {
    try {
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const document = await dataService.getDocumentById(documentId);
      
      // เปิดเอกสารในหน้าใหม่
      window.open(`document-viewer.html?document=${documentId}`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('เกิดข้อผิดพลาดในการเปิดเอกสาร');
    }
  }
  
  /**
   * จัดการการดาวน์โหลดเอกสาร
   * @param {string} documentId - รหัสเอกสาร
   */
  async handleDownloadDocument(documentId) {
    try {
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const document = await dataService.getDocumentById(documentId);
      
      alert(`เริ่มดาวน์โหลดเอกสาร: ${document.title}`);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร');
    }
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

// สร้าง instance ของ SaleController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const saleController = new SaleController();
});

export default SaleController;