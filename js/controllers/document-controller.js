import dataService from '../services/data-service.js';

class DocumentController {
  constructor() {
    this.isLoading = false;

    // DOM Elements
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.errorMessage = document.getElementById('error-message');
    this.documentListContainer = document.getElementById('document-list');
    this.popularDocumentsContainer = document.getElementById('popular-documents');
    this.paginationContainer = document.getElementById('pagination-container');
    this.documentPreviewContainer = document.getElementById('document-preview-container');
    this.documentPreviewFrame = document.getElementById('document-preview-frame');
    this.previewDocumentTitle = document.getElementById('preview-document-title');
    this.closePreviewButton = document.getElementById('close-preview');
    this.searchForm = document.getElementById('search-form');
    this.searchButton = document.getElementById('search-button');
    this.clearButton = document.getElementById('clear-button');
    this.keywordInput = document.getElementById('keyword');
    this.documentTypeSelect = document.getElementById('document-type-select');
    this.uploadDocumentButton = document.getElementById('upload-document-button');
    this.categoryItems = document.querySelectorAll('.category-item');
    this.viewUsageReportButton = document.getElementById('view-usage-report');

    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.totalPages = 1;

    this.filters = {
      search: '',
      type: '',
      category: 'all'
    };

    this.init();
  }

  init() {
    this.getUrlParameters();
    this.loadDocuments();
    this.loadPopularDocuments();
    this.setupEventListeners();
  }

  getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) this.filters.type = type;

    const productId = urlParams.get('id');
    if (productId) this.filters.productId = productId;

    const documentId = urlParams.get('document');
    if (documentId) this.openDocumentPreview(documentId);
  }

  setupEventListeners() {
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
    if (this.uploadDocumentButton) {
      this.uploadDocumentButton.addEventListener('click', () => {
        this.handleUploadDocument();
      });
    }
    if (this.categoryItems) {
      this.categoryItems.forEach(item => {
        item.addEventListener('click', () => {
          this.categoryItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          this.filters.category = item.getAttribute('data-category');
          this.currentPage = 1;
          this.loadDocuments();
        });
      });
    }
    if (this.closePreviewButton) {
      this.closePreviewButton.addEventListener('click', () => {
        this.closeDocumentPreview();
      });
    }
    if (this.viewUsageReportButton) {
      this.viewUsageReportButton.addEventListener('click', () => {
        this.handleViewUsageReport();
      });
    }
  }

  showLoading() {
    this.isLoading = true;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
  }

  hideLoading() {
    this.isLoading = false;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
  }

  hideError() {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }

  async loadDocuments() {
    try {
      this.showLoading();
      this.hideError();

      const searchFilters = { ...this.filters };

      if (searchFilters.category !== 'all') {
        switch (searchFilters.category) {
          case 'specs': searchFilters.type = 'สเปคสินค้า'; break;
          case 'manuals': searchFilters.type = 'คู่มือการใช้งาน'; break;
          case 'brochures': searchFilters.type = 'โบรชัวร์'; break;
          case 'comparisons': searchFilters.type = 'เปรียบเทียบสินค้า'; break;
          case 'promotions': searchFilters.type = 'โปรโมชัน'; break;
        }
        delete searchFilters.category;
      }

      const documents = await dataService.getDocuments(searchFilters);
      this.totalPages = Math.ceil(documents.length / this.itemsPerPage);
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedDocuments = documents.slice(startIndex, endIndex);

      this.renderDocumentList(paginatedDocuments);
      this.renderPagination();
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร');
      console.error('Error loading documents:', error);
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

  async loadPopularDocuments() {
    try {
      const documents = await dataService.getDocuments();
      const sortedDocuments = documents
        .sort((a, b) => parseInt(b.fileSize) - parseInt(a.fileSize))
        .slice(0, 5);
      this.renderPopularDocuments(sortedDocuments);
    } catch (error) {
      console.error('Error loading popular documents:', error);
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

  async openDocumentPreview(documentId) {
    try {
      this.showLoading();
      const document = await dataService.getDocumentById(documentId);
      console.log('Preview document:', document);
      // คุณสามารถเติมโค้ดการแสดงตัวอย่างใน iframe ที่นี่
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการเปิดเอกสาร');
      console.error('Error opening document preview:', error);
    } finally {
      this.hideLoading();
    }
  }

  async handleDownloadDocument(documentId) {
    try {
      this.showLoading();
      const document = await dataService.getDocumentById(documentId);
      alert(`เริ่มดาวน์โหลดเอกสาร: ${document.title}`);
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร');
      console.error('Error downloading document:', error);
    } finally {
      this.hideLoading();
    }
  }

  async handleShareDocument(documentId) {
    try {
      const document = await dataService.getDocumentById(documentId);
      console.log('แชร์เอกสาร:', document);
      // คุณสามารถเติมโค้ดการแชร์เอกสารต่อได้
    } catch (error) {
      this.showError(error.message || 'เกิดข้อผิดพลาดในการแชร์เอกสาร');
      console.error('Error sharing document:', error);
    }
  }

  handleSearch() {
    const keyword = this.keywordInput?.value || '';
    const type = this.documentTypeSelect?.value || '';
    this.filters.search = keyword;
    this.filters.type = type;
    this.currentPage = 1;
    this.loadDocuments();
  }

  handleClearSearch() {
    if (this.keywordInput) this.keywordInput.value = '';
    if (this.documentTypeSelect) this.documentTypeSelect.value = '';
    this.filters.search = '';
    this.filters.type = '';
    this.currentPage = 1;
    this.loadDocuments();
  }

  handleUploadDocument() {
    alert('ฟังก์ชันอัปโหลดเอกสารยังไม่ได้เชื่อมต่อ');
  }

  handleViewUsageReport() {
    alert('กำลังเปิดรายงานการใช้งานเอกสาร...');
  }

  renderDocumentList(documents) {
    console.log('แสดงรายการเอกสาร:', documents);
    // เพิ่ม DOM rendering ได้ตามต้องการ
  }

  renderPagination() {
    console.log(`หน้าปัจจุบัน: ${this.currentPage}/${this.totalPages}`);
    // เพิ่ม DOM rendering ได้ตามต้องการ
  }

  renderPopularDocuments(documents) {
    console.log('แสดงเอกสารยอดนิยม:', documents);
    // เพิ่ม DOM rendering ได้ตามต้องการ
  }

  closeDocumentPreview() {
    if (this.documentPreviewContainer) {
      this.documentPreviewContainer.style.display = 'none';
    }
    if (this.documentPreviewFrame) {
      this.documentPreviewFrame.src = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DocumentController();
});

export default DocumentController;
