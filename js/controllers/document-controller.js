/**
 * document-controller.js
 * Controller สำหรับจัดการข้อมูลเอกสาร
 * ปรับปรุงให้ใช้ MockupService แทนการเรียก API จริง
 */

import dataService from '../services/data-service.js';
import documentService from '../services/document-service.js';

class DocumentController {
  constructor() {
    // สถานะโหลดเริ่มต้น
    this.isLoading = false;
    
    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    
    // Element ที่เกี่ยวข้องกับรายการเอกสาร
    this.documentListContainer = document.getElementById('document-list');
    this.popularDocumentsContainer = document.getElementById('popular-documents');
    this.paginationContainer = document.getElementById('pagination-container');
    
    // Element สำหรับการดูตัวอย่างเอกสาร
    this.documentPreviewContainer = document.getElementById('document-preview-container');
    this.documentPreviewFrame = document.getElementById('document-preview-frame');
    this.previewDocumentTitle = document.getElementById('preview-document-title');
    this.closePreviewButton = document.getElementById('close-preview');
    
    // Element สำหรับการค้นหา
    this.searchForm = document.getElementById('search-form');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-button');
    this.keywordInput = document.getElementById('keyword');
    this.documentTypeSelect = document.getElementById('document-type-select');
    
    // Element สำหรับการอัปโหลดเอกสาร
    this.uploadDocumentButton = document.getElementById('upload-document-button');
    
    // Element สำหรับหมวดหมู่เอกสาร
    this.categoryItems = document.querySelectorAll('.category-item');
    
    // Element สำหรับรายงานการใช้งานเอกสาร
    this.viewUsageReportButton = document.getElementById('view-usage-report');
    
    // ตัวแปรสำหรับการแบ่งหน้า
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.totalPages = 1;
    
    // ตัวแปรสำหรับการกรองข้อมูล
    this.filters = {
      search: '',
      type: '',
      category: 'all'
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * ฟังก์ชันเริ่มต้นการทำงาน
   */
  init() {
    // ดึงพารามิเตอร์จาก URL
    this.getUrlParameters();
    
    // โหลดข้อมูลเอกสาร
    this.loadDocuments();
    
    // โหลดข้อมูลเอกสารยอดนิยม
    this.loadPopularDocuments();
    
    // ตั้งค่า Event Listeners
    this.setupEventListeners();
  }
  
  /**
   * ดึงพารามิเตอร์จาก URL
   */
  getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // ตรวจสอบว่ามีการระบุประเภทเอกสารหรือไม่
    const type = urlParams.get('type');
    if (type) {
      this.filters.type = type;
    }
    
    // ตรวจสอบว่ามีการระบุ ID สินค้าหรือไม่
    const productId = urlParams.get('id');
    if (productId) {
      this.filters.productId = productId;
    }
    
    // ตรวจสอบว่ามีการระบุให้แสดงเอกสารหรือไม่
    const documentId = urlParams.get('document');
    if (documentId) {
      // แสดงเอกสารตาม ID ที่ระบุ
      this.openDocumentPreview(documentId);
    }
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับองค์ประกอบต่างๆ ในหน้า
   */
  setupEventListeners() {
    // Event Listeners สำหรับการค้นหา
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
    
    // Event Listeners สำหรับการอัปโหลดเอกสาร
    if (this.uploadDocumentButton) {
      this.uploadDocumentButton.addEventListener('click', () => {
        this.handleUploadDocument();
      });
    }
    
    // Event Listeners สำหรับหมวดหมู่เอกสาร
    if (this.categoryItems) {
      this.categoryItems.forEach(item => {
        item.addEventListener('click', () => {
          // ลบ class active จากทุกรายการ
          this.categoryItems.forEach(i => i.classList.remove('active'));
          
          // เพิ่ม class active ให้กับรายการที่คลิก
          item.classList.add('active');
          
          // ดึงค่าหมวดหมู่
          const category = item.getAttribute('data-category');
          
          // กำหนดตัวกรองข้อมูล
          this.filters.category = category;
          
          // รีเซ็ตหน้าปัจจุบันเป็นหน้าแรก
          this.currentPage = 1;
          
          // โหลดข้อมูลเอกสารใหม่อีกครั้ง
          this.loadDocuments();
        });
      });
    }
    
    // Event Listeners สำหรับการปิดตัวอย่างเอกสาร
    if (this.closePreviewButton) {
      this.closePreviewButton.addEventListener('click', () => {
        this.closeDocumentPreview();
      });
    }
    
    // Event Listeners สำหรับการดูรายงานการใช้งานเอกสาร
    if (this.viewUsageReportButton) {
      this.viewUsageReportButton.addEventListener('click', () => {
        this.handleViewUsageReport();
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
   * โหลดข้อมูลเอกสาร
   */
  async loadDocuments() {
    try {
      this.showLoading();
      this.hideError();
      
      // สร้างตัวกรองข้อมูลสำหรับการค้นหา
      const searchFilters = { ...this.filters };
      
      // ตรวจสอบหมวดหมู่
      if (searchFilters.category !== 'all') {
        // แปลงหมวดหมู่เป็นประเภทเอกสาร
        switch (searchFilters.category) {
          case 'specs': searchFilters.type = 'สเปคสินค้า'; break;
          case 'manuals': searchFilters.type = 'คู่มือการใช้งาน'; break;
          case 'brochures': searchFilters.type = 'โบรชัวร์'; break;
          case 'comparisons': searchFilters.type = 'เปรียบเทียบสินค้า'; break;
          case 'promotions': searchFilters.type = 'โปรโมชัน'; break;
        }
        
        // ลบตัวกรองหมวดหมู่เพื่อไม่ให้ซ้ำซ้อนกับประเภทเอกสาร
        delete searchFilters.category;
      }
      
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const documents = await dataService.getDocuments(searchFilters);
      
      // คำนวณจำนวนหน้าทั้งหมด
      this.totalPages = Math.ceil(documents.length / this.itemsPerPage);
      
      // แบ่งหน้าข้อมูล
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedDocuments = documents.slice(startIndex, endIndex);
      
      // แสดงข้อมูลเอกสาร
      this.renderDocumentList(paginatedDocuments);
      
      // แสดงการแบ่งหน้า
      this.renderPagination();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร');
      console.error('Error loading documents:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.documentListContainer) {
        this.documentListContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <p>ไม่พบข้อมูลเอกสาร</p>
          </div>
        `;
      }
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * โหลดข้อมูลเอกสารยอดนิยม
   */
  async loadPopularDocuments() {
    try {
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const documents = await mockupService.getDocuments();
      
      // จัดเรียงเอกสารตามขนาดไฟล์ (สมมติว่าขนาดไฟล์มากคือยอดนิยม)
      const sortedDocuments = documents
        .sort((a, b) => {
          const sizeA = parseInt(a.fileSize);
          const sizeB = parseInt(b.fileSize);
          return sizeB - sizeA;
        })
        .slice(0, 5); // เลือกเฉพาะ 5 รายการแรก
      
      // แสดงข้อมูลเอกสารยอดนิยม
      this.renderPopularDocuments(sortedDocuments);
    } catch (error) {
      console.error('Error loading popular documents:', error);
      
      // กรณีเกิดข้อผิดพลาด แสดงข้อมูลว่างเปล่า
      if (this.popularDocumentsContainer) {
        this.popularDocumentsContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <p>ไม่พบข้อมูลเอกสารยอดนิยม</p>
          </div>
        `;
      }
    }
  }
  
  /**
   * แสดงข้อมูลรายการเอกสาร
   * @param {Array} documents - รายการเอกสาร
   */
  renderDocumentList(documents) {
    if (!this.documentListContainer) return;
    
    // ตรวจสอบว่ามีข้อมูลเอกสารหรือไม่
    if (!documents || documents.length === 0) {
      this.documentListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>ไม่พบข้อมูลเอกสารที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      `;
      return;
    }
    
    // สร้าง HTML สำหรับแต่ละเอกสาร
    let html = '';
    
    documents.forEach(document => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const docDate = new Date(document.date);
      const formattedDate = `${docDate.getDate()}/${docDate.getMonth() + 1}/${docDate.getFullYear() + 543}`;
      
      // กำหนดไอคอนตามประเภทเอกสาร
      let iconClass = '';
      switch (document.type) {
        case 'ใบเสนอราคา': iconClass = 'fas fa-file-invoice-dollar'; break;
        case 'ใบสั่งซื้อ': iconClass = 'fas fa-file-signature'; break;
        case 'ใบเสร็จรับเงิน': iconClass = 'fas fa-file-invoice'; break;
        case 'สเปคสินค้า': iconClass = 'fas fa-file-alt'; break;
        case 'คู่มือการใช้งาน': iconClass = 'fas fa-book'; break;
        case 'โบรชัวร์': iconClass = 'fas fa-newspaper'; break;
        case 'เปรียบเทียบสินค้า': iconClass = 'fas fa-exchange-alt'; break;
        case 'โปรโมชัน': iconClass = 'fas fa-tags'; break;
        default: iconClass = 'fas fa-file'; break;
      }
      
      html += `
        <div class="document-card">
          <div class="document-icon">
            <i class="${iconClass}"></i>
          </div>
          <div class="document-card-content">
            <h3>${document.title}</h3>
            <p class="document-info">
              <span class="document-type">${document.type}</span> | 
              <span class="document-date">${formattedDate}</span> | 
              <span class="document-size">${document.fileSize}</span>
            </p>
            ${document.customer ? `
              <p class="document-customer">
                <i class="fas fa-user"></i> ${document.customerName}
              </p>
            ` : ''}
            <div class="document-actions">
              <button class="btn btn-sm btn-primary view-document" data-document-id="${document.id}">
                <i class="fas fa-eye"></i> ดูเอกสาร
              </button>
              <button class="btn btn-sm btn-outline download-document" data-document-id="${document.id}">
                <i class="fas fa-download"></i> ดาวน์โหลด
              </button>
              <button class="btn btn-sm btn-outline share-document" data-document-id="${document.id}">
                <i class="fas fa-share-alt"></i> แชร์
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    // แสดงผลลัพธ์
    this.documentListContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มดูเอกสาร
    const viewButtons = document.querySelectorAll('.view-document');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const documentId = button.getAttribute('data-document-id');
        this.openDocumentPreview(documentId);
      });
    });
    
    // ตั้งค่า event listeners สำหรับปุ่มดาวน์โหลดเอกสาร
    const downloadButtons = document.querySelectorAll('.download-document');
    downloadButtons.forEach(button => {
      button.addEventListener('click', () => {
        const documentId = button.getAttribute('data-document-id');
        this.handleDownloadDocument(documentId);
      });
    });
    
    // ตั้งค่า event listeners สำหรับปุ่มแชร์เอกสาร
    const shareButtons = document.querySelectorAll('.share-document');
    shareButtons.forEach(button => {
      button.addEventListener('click', () => {
        const documentId = button.getAttribute('data-document-id');
        this.handleShareDocument(documentId);
      });
    });
  }
  
  /**
   * แสดงข้อมูลเอกสารยอดนิยม
   * @param {Array} documents - รายการเอกสารยอดนิยม
   */
  renderPopularDocuments(documents) {
    if (!this.popularDocumentsContainer) return;
    
    // ตรวจสอบว่ามีข้อมูลเอกสารหรือไม่
    if (!documents || documents.length === 0) {
      this.popularDocumentsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>ไม่พบข้อมูลเอกสารยอดนิยม</p>
        </div>
      `;
      return;
    }
    
    // สร้าง HTML สำหรับตารางเอกสารยอดนิยม
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>เอกสาร</th>
            <th>ประเภท</th>
            <th>ขนาด</th>
            <th>วันที่อัปเดต</th>
            <th>การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // สร้าง HTML สำหรับแต่ละเอกสาร
    documents.forEach(document => {
      // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
      const docDate = new Date(document.date);
      const formattedDate = `${docDate.getDate()}/${docDate.getMonth() + 1}/${docDate.getFullYear() + 543}`;
      
      // กำหนดไอคอนตามประเภทเอกสาร
      let iconClass = '';
      switch (document.type) {
        case 'ใบเสนอราคา': iconClass = 'fas fa-file-invoice-dollar'; break;
        case 'ใบสั่งซื้อ': iconClass = 'fas fa-file-signature'; break;
        case 'ใบเสร็จรับเงิน': iconClass = 'fas fa-file-invoice'; break;
        case 'สเปคสินค้า': iconClass = 'fas fa-file-alt'; break;
        case 'คู่มือการใช้งาน': iconClass = 'fas fa-book'; break;
        case 'โบรชัวร์': iconClass = 'fas fa-newspaper'; break;
        case 'เปรียบเทียบสินค้า': iconClass = 'fas fa-exchange-alt'; break;
        case 'โปรโมชัน': iconClass = 'fas fa-tags'; break;
        default: iconClass = 'fas fa-file'; break;
      }
      
      html += `
        <tr>
          <td>
            <div class="document-brief">
              <i class="${iconClass}"></i>
              <span>${document.title}</span>
            </div>
          </td>
          <td>${document.type}</td>
          <td>${document.fileSize}</td>
          <td>${formattedDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon view-document" data-document-id="${document.id}" title="ดูเอกสาร">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon download-document" data-document-id="${document.id}" title="ดาวน์โหลด">
                <i class="fas fa-download"></i>
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
    this.popularDocumentsContainer.innerHTML = html;
    
    // ตั้งค่า event listeners สำหรับปุ่มดูเอกสาร
    const viewButtons = document.querySelectorAll('.view-document');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const documentId = button.getAttribute('data-document-id');
        this.openDocumentPreview(documentId);
      });
    });
    
    // ตั้งค่า event listeners สำหรับปุ่มดาวน์โหลดเอกสาร
    const downloadButtons = document.querySelectorAll('.download-document');
    downloadButtons.forEach(button => {
      button.addEventListener('click', () => {
        const documentId = button.getAttribute('data-document-id');
        this.handleDownloadDocument(documentId);
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
        
        this.loadDocuments();
      });
    });
  }
  
  /**
   * เปิดตัวอย่างเอกสาร
   * @param {string} documentId - รหัสเอกสาร
   */
  async openDocumentPreview(documentId) {
    try {
      this.showLoading();
      
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const document = await dataService.getDocumentById(documentId);
      
      // ตั้งค่าตัวอย่างเอกสาร
      if (this.previewDocumentTitle) {
        this.previewDocumentTitle.textContent = document.title;
      }
      
      if (this.documentPreviewFrame) {
        // ในสถานการณ์จริงจะมีการตั้งค่า src ให้กับ iframe
        // แต่ในที่นี้เราจะจำลองการแสดงผลเอกสาร
        this.documentPreviewFrame.src = `about:blank`;
        
        // รอให้ iframe โหลดเสร็จ
        this.documentPreviewFrame.onload = () => {
          // เข้าถึง document ของ iframe
          const iframeDoc = this.documentPreviewFrame.contentDocument || this.documentPreviewFrame.contentWindow.document;
          
          // สร้างเนื้อหาของเอกสาร
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${document.title}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  line-height: 1.6;
                }
                h1 {
                  color: #333;
                  margin-bottom: 20px;
                }
                .document-info {
                  margin-bottom: 20px;
                  color: #666;
                }
                .document-content {
                  border: 1px solid #ddd;
                  padding: 20px;
                  min-height: 400px;
                  background-color: #fff;
                }
                .watermark {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg);
                  font-size: 80px;
                  color: rgba(0, 0, 0, 0.1);
                  pointer-events: none;
                }
              </style>
            </head>
            <body>
              <h1>${document.title}</h1>
              
              <div class="document-info">
                <p><strong>ประเภท:</strong> ${document.type}</p>
                <p><strong>วันที่:</strong> ${new Date(document.date).toLocaleDateString('th-TH')}</p>
                <p><strong>ผู้สร้าง:</strong> ${document.createdBy}</p>
                ${document.customer ? `<p><strong>ลูกค้า:</strong> ${document.customerName}</p>` : ''}
              </div>
              
              <div class="document-content">
                <p>เนื้อหาเอกสารจำลอง</p>
                <p>นี่เป็นเพียงตัวอย่างเอกสารสำหรับการทดสอบการแสดงผล</p>
                <p>ในสถานการณ์จริงจะมีการแสดงเนื้อหาเอกสารจริงตามประเภทของเอกสาร</p>
              </div>
              
              <div class="watermark">INFOHUB 360</div>
            </body>
            </html>
          `);
          iframeDoc.close();
        };
      }
      
      // แสดงตัวอย่างเอกสาร
      if (this.documentPreviewContainer) {
        this.documentPreviewContainer.style.display = 'block';
      }
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการเปิดเอกสาร');
      console.error('Error opening document preview:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * ปิดตัวอย่างเอกสาร
   */
  closeDocumentPreview() {
    if (this.documentPreviewContainer) {
      this.documentPreviewContainer.style.display = 'none';
    }
    
    if (this.documentPreviewFrame) {
      this.documentPreviewFrame.src = '';
    }
  }
  
  /**
   * จัดการการค้นหาเอกสาร
   */
  handleSearch() {
    // ดึงค่าจากฟอร์มค้นหา
    const keyword = this.keywordInput?.value || '';
    const type = this.documentTypeSelect?.value || '';
    
    // กำหนดตัวกรองข้อมูล
    this.filters.search = keyword;
    this.filters.type = type;
    
    // รีเซ็ตหน้าปัจจุบันเป็นหน้าแรก
    this.currentPage = 1;
    
    // โหลดข้อมูลเอกสารใหม่อีกครั้ง
    this.loadDocuments();
  }
  
  /**
   * จัดการการล้างการค้นหา
   */
  handleClearSearch() {
    // รีเซ็ตค่าในฟอร์มค้นหา
    if (this.keywordInput) this.keywordInput.value = '';
    if (this.documentTypeSelect) this.documentTypeSelect.value = '';
    
    // รีเซ็ตตัวกรองข้อมูล
    this.filters.search = '';
    this.filters.type = '';
    
    // รีเซ็ตหน้าปัจจุบันเป็นหน้าแรก
    this.currentPage = 1;
    
    // โหลดข้อมูลเอกสารใหม่อีกครั้ง
    this.loadDocuments();
  }
  
  /**
   * จัดการการดาวน์โหลดเอกสาร
   * @param {string} documentId - รหัสเอกสาร
   */
  async handleDownloadDocument(documentId) {
    try {
      this.showLoading();
      
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const document = await dataService.getDocumentById(documentId);
      
      // จำลองการดาวน์โหลดเอกสาร
      alert(`เริ่มดาวน์โหลดเอกสาร: ${document.title}`);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร');
      console.error('Error downloading document:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * จัดการการแชร์เอกสาร
   * @param {string} documentId - รหัสเอกสาร
   */
  async handleShareDocument(documentId) {
    try {
      // ดึงข้อมูลเอกสารจาก Mockup Service
      const document = await dataService.getDocumentById(documentId);
      
      // สร้าง Modal element
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.style.display = 'flex';
      
      // สร้าง HTML สำหรับ Modal
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h2>แชร์เอกสาร</h2>
            <button class="modal-close"><i class="fas fa-times"></i></button>
          </div>
          
          <div class="modal-body">
            <div class="document-preview">
              <div class="preview-header">
                <div class="preview-icon">
                  <i class="fas fa-file-alt"></i>
                </div>
                <div>
                  <h3>${document.title}</h3>
                  <p class="document-type">${document.type}</p>
                  <p class="document-size">${document.fileSize}</p>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="share-customer" class="form-label">เลือกลูกค้า</label>
              <select id="share-customer" class="form-input">
                <option value="">-- เลือกลูกค้า --</option>
                <option value="CUST001">คุณนภา วงศ์ประดิษฐ์ (089-123-4567)</option>
                <option value="CUST002">คุณสมศักดิ์ ใจดี (062-987-6543)</option>
                <option value="CUST003">คุณประภา เจริญพร (091-234-5678)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="share-email" class="form-label">หรืออีเมล</label>
              <input type="email" id="share-email" class="form-input" placeholder="กรอกอีเมลของผู้รับ">
            </div>
            
            <div class="form-group">
              <label for="share-message" class="form-label">ข้อความ</label>
              <textarea id="share-message" class="form-input" rows="3" placeholder="เพิ่มข้อความ..."></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">ช่องทางการส่ง</label>
              <div class="share-methods">
                <button class="share-method share-email" data-method="email">
                  <i class="fas fa-envelope"></i> อีเมล
                </button>
                <button class="share-method share-line" data-method="line">
                  <i class="fab fa-line"></i> LINE
                </button>
                <button class="share-method share-qr" data-method="qr">
                  <i class="fas fa-qrcode"></i> QR Code
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline modal-close">
              ยกเลิก
            </button>
            <button class="btn btn-primary" id="confirm-share">
              <i class="fas fa-share-alt"></i> แชร์เอกสาร
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
      
      // ตั้งค่า event listeners สำหรับปุ่มยืนยันการแชร์
      const confirmButton = modal.querySelector('#confirm-share');
      if (confirmButton) {
        confirmButton.addEventListener('click', () => {
          // ในที่นี้เราจะจำลองการแชร์เอกสาร
          const customer = modal.querySelector('#share-customer').value;
          const email = modal.querySelector('#share-email').value;
          const message = modal.querySelector('#share-message').value;
          
          let recipient = '';
          if (customer) {
            const customerOption = modal.querySelector(`#share-customer option[value="${customer}"]`);
            recipient = customerOption ? customerOption.textContent : '';
          } else if (email) {
            recipient = email;
          } else {
            alert('กรุณาเลือกลูกค้าหรือกรอกอีเมลของผู้รับ');
            return;
          }
          
          alert(`แชร์เอกสาร "${document.title}" ไปยัง ${recipient} เรียบร้อยแล้ว`);
          
          // ปิด Modal
          document.body.removeChild(modal);
        });
      }
      
      // ตั้งค่า event listeners สำหรับช่องทางการส่ง
      const shareMethodButtons = modal.querySelectorAll('.share-method');
      shareMethodButtons.forEach(button => {
        button.addEventListener('click', () => {
          // ลบ class active จากทุกปุ่ม
          shareMethodButtons.forEach(btn => btn.classList.remove('active'));
          
          // เพิ่ม class active ให้กับปุ่มที่คลิก
          button.classList.add('active');
        });
      });
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการแชร์เอกสาร');
      console.error('Error sharing document:', error);
    }
  }
  
  /**
   * จัดการการอัปโหลดเอกสาร
   */
  handleUploadDocument() {
    // สร้าง Modal element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    
    // สร้าง HTML สำหรับ Modal
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>อัปโหลดเอกสาร</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="document-title" class="form-label">ชื่อเอกสาร</label>
            <input type="text" id="document-title" class="form-input" placeholder="กรอกชื่อเอกสาร" required>
          </div>
          
          <div class="form-group">
            <label for="document-type" class="form-label">ประเภทเอกสาร</label>
            <select id="document-type" class="form-input" required>
              <option value="">-- เลือกประเภทเอกสาร --</option>
              <option value="สเปคสินค้า">สเปคสินค้า</option>
              <option value="คู่มือการใช้งาน">คู่มือการใช้งาน</option>
              <option value="โบรชัวร์">โบรชัวร์</option>
              <option value="เปรียบเทียบสินค้า">เปรียบเทียบสินค้า</option>
              <option value="โปรโมชัน">โปรโมชัน</option>
              <option value="ราคา">ราคา</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="document-product" class="form-label">สินค้าที่เกี่ยวข้อง (ถ้ามี)</label>
            <select id="document-product" class="form-input">
              <option value="">-- เลือกสินค้า --</option>
              <option value="TV-SAM-QN90C-55">Samsung QN90C 55" QLED 4K Smart TV</option>
              <option value="TV-SAM-BU8100-55">Samsung BU8100 55" Crystal UHD 4K Smart TV</option>
              <option value="AC-DAIKIN-FTC15TV2S">Daikin FTC15TV2S แอร์ผนัง Fixed Speed 15000 BTU</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="document-customer" class="form-label">ลูกค้าที่เกี่ยวข้อง (ถ้ามี)</label>
            <select id="document-customer" class="form-input">
              <option value="">-- เลือกลูกค้า --</option>
              <option value="CUST001">คุณนภา วงศ์ประดิษฐ์</option>
              <option value="CUST002">คุณสมศักดิ์ ใจดี</option>
              <option value="CUST003">คุณประภา เจริญพร</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">ไฟล์เอกสาร</label>
            <div class="file-upload">
              <input type="file" id="document-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;">
              <label for="document-file" class="btn btn-outline">
                <i class="fas fa-upload"></i> เลือกไฟล์
              </label>
              <span id="selected-file">ยังไม่ได้เลือกไฟล์</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ยกเลิก
          </button>
          <button class="btn btn-primary" id="confirm-upload">
            <i class="fas fa-upload"></i> อัปโหลด
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
    
    // ตั้งค่า event listeners สำหรับการเลือกไฟล์
    const fileInput = modal.querySelector('#document-file');
    const selectedFileText = modal.querySelector('#selected-file');
    
    if (fileInput && selectedFileText) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          selectedFileText.textContent = fileInput.files[0].name;
        } else {
          selectedFileText.textContent = 'ยังไม่ได้เลือกไฟล์';
        }
      });
    }
    
    // ตั้งค่า event listeners สำหรับปุ่มยืนยันการอัปโหลด
    const confirmButton = modal.querySelector('#confirm-upload');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        // ในที่นี้เราจะจำลองการอัปโหลดเอกสาร
        const title = modal.querySelector('#document-title').value;
        const type = modal.querySelector('#document-type').value;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!title || !type) {
          alert('กรุณากรอกชื่อและเลือกประเภทเอกสาร');
          return;
        }
        
        if (!fileInput.files.length) {
          alert('กรุณาเลือกไฟล์เอกสาร');
          return;
        }
        
        alert(`อัปโหลดเอกสาร "${title}" เรียบร้อยแล้ว`);
        
        // ปิด Modal
        document.body.removeChild(modal);
        
        // โหลดข้อมูลเอกสารใหม่อีกครั้ง
        this.loadDocuments();
      });
    }
  }
  
  /**
   * จัดการการดูรายงานการใช้งานเอกสาร
   */
  handleViewUsageReport() {
    alert('กำลังเปิดรายงานการใช้งานเอกสาร...');
    // ในสถานการณ์จริงจะมีการเปิดหน้ารายงานการใช้งานเอกสาร
  }
}

// สร้าง instance ของ DocumentController เมื่อหน้าเว็บโหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const documentController = new DocumentController();
});

export default DocumentController;