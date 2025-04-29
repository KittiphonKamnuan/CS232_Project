/**
 * InfoHub 360 - Main JavaScript
 * 
 * This file contains all the JavaScript functionality for the InfoHub 360 application
 * including navigation, search, modals, and other interactive features.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Tab Navigation
  initTabNavigation();
  
  // Modal functionality
  initModals();
  
  // Search functionality
  initSearch();
  
  // Pipeline interactions
  initPipeline();
  
  // Document sharing
  initDocumentSharing();
  
  // Real-time data updates
  initRealTimeUpdates();
});

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
  const menuItems = document.querySelectorAll('.menu-item[data-tab]');
  
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the tab to display
      const tabName = this.getAttribute('data-tab');
      
      // Remove active class from all menu items
      menuItems.forEach(menuItem => {
        menuItem.classList.remove('active');
      });
      
      // Add active class to clicked menu item
      this.classList.add('active');
      
      // Hide all tab contents
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Show the selected tab content
      document.getElementById(tabName + '-tab').classList.add('active');
    });
  });
}

/**
 * Initialize modal functionality
 */
function initModals() {
  // Share with customer modal
  const shareButtons = document.querySelectorAll('.btn-outline');
  
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      openShareModal(this.closest('.product-card'));
    });
  });
  
  // Global event delegation for modal close buttons
  document.addEventListener('click', function(e) {
    if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
      closeModal();
    }
    
    if (e.target.matches('.modal-backdrop')) {
      closeModal();
    }
  });
}

/**
 * Opens the share with customer modal
 * @param {HTMLElement} productCard - The product card element
 */
function openShareModal(productCard) {
  // Get product details
  const productName = productCard.querySelector('h3').textContent;
  const productCode = productCard.querySelector('.product-code').textContent;
  const productPrice = productCard.querySelector('.price').textContent;
  const productImage = productCard.querySelector('img').src;
  
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  // Create modal content
  const modalContent = `
    <div class="modal">
      <div class="modal-header">
        <h2>ส่งข้อมูลให้ลูกค้า</h2>
        <button class="modal-close"><i class="fas fa-times"></i></button>
      </div>
      
      <!-- Product Info -->
      <div class="modal-body">
        <div class="document-preview">
          <div class="preview-header">
            <img src="${productImage}" alt="${productName}" class="preview-thumbnail">
            <div>
              <h3>${productName}</h3>
              <p class="product-code">${productCode}</p>
              <p class="price">${productPrice}</p>
            </div>
          </div>
        </div>
        
        <!-- Sharing Options -->
        <div class="form-group">
          <h3 class="form-label">เลือกข้อมูลที่ต้องการส่ง</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <!-- Document Selection -->
            <div>
              <p class="form-label">เอกสาร</p>
              <div>
                <div class="checkbox-group">
                  <input type="checkbox" id="spec" class="checkbox-input" checked>
                  <label for="spec">สเปคสินค้า</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="manual" class="checkbox-input">
                  <label for="manual">คู่มือการใช้งาน</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="compare" class="checkbox-input" checked>
                  <label for="compare">เปรียบเทียบรุ่น</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="promo" class="checkbox-input">
                  <label for="promo">โปรโมชันประจำเดือน</label>
                </div>
              </div>
            </div>
            
            <!-- Price and Availability -->
            <div>
              <p class="form-label">ข้อมูลราคาและสต๊อก</p>
              <div>
                <div class="checkbox-group">
                  <input type="checkbox" id="price" class="checkbox-input" checked>
                  <label for="price">ราคา</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="stock" class="checkbox-input" checked>
                  <label for="stock">สถานะสต๊อกสินค้า</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="delivery" class="checkbox-input">
                  <label for="delivery">ข้อมูลการจัดส่ง</label>
                </div>
                <div class="checkbox-group">
                  <input type="checkbox" id="warranty" class="checkbox-input">
                  <label for="warranty">รายละเอียดการรับประกัน</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Custom Message -->
        <div class="form-group" style="margin-top: 1rem;">
          <p class="form-label">ข้อความเพิ่มเติม</p>
          <textarea placeholder="เพิ่มข้อความส่วนตัวถึงลูกค้า..." style="height: 80px;"></textarea>
        </div>
        
        <!-- Send To -->
        <div class="form-group" style="margin-top: 1rem;">
          <p class="form-label">ส่งถึงลูกค้า</p>
          
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1;">
              <select style="width: 100%;">
                <option value="">-- เลือกลูกค้า --</option>
                <option value="1">คุณนภา วงศ์ประดิษฐ์ (089-123-4567)</option>
                <option value="2">คุณสมศักดิ์ ใจดี (062-987-6543)</option>
                <option value="3">คุณประภา เจริญพร (091-234-5678)</option>
              </select>
            </div>
            <div style="color: #6b7280;">หรือ</div>
            <div style="flex: 1;">
              <input type="text" placeholder="กรอกอีเมลหรือเบอร์โทรศัพท์" style="width: 100%;">
            </div>
          </div>
        </div>
        
        <!-- Send Methods -->
        <div class="form-group" style="margin-top: 1rem;">
          <p class="form-label">ช่องทางการส่ง</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <button class="share-method share-line">
              <i class="fab fa-line"></i> LINE
            </button>
            <button class="share-method share-email">
              <i class="fas fa-envelope"></i> อีเมล
            </button>
            <button class="share-method share-sms">
              <i class="fas fa-comment-alt"></i> SMS
            </button>
            <button class="share-method share-qr">
              <i class="fas fa-qrcode"></i> สร้าง QR Code
            </button>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-outline modal-close">
          ยกเลิก
        </button>
        <button class="btn btn-primary" id="sendDocuments">
          ส่งข้อมูล
        </button>
      </div>
    </div>
  `;
  
  // Add modal to page
  backdrop.innerHTML = modalContent;
  document.body.appendChild(backdrop);
  
  // Add event listener to send button
  const sendButton = document.getElementById('sendDocuments');
  if (sendButton) {
    sendButton.addEventListener('click', function() {
      sendDocumentsToCustomer();
    });
  }
}

/**
 * Closes the currently open modal
 */
function closeModal() {
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    // Add fade out animation
    backdrop.style.opacity = '0';
    setTimeout(() => {
      backdrop.remove();
    }, 300);
  }
}

/**
 * Send documents to customer (simulation)
 */
function sendDocumentsToCustomer() {
  // Get selected documents and options
  const selectedDocs = [];
  if (document.getElementById('spec').checked) selectedDocs.push('สเปคสินค้า');
  if (document.getElementById('manual').checked) selectedDocs.push('คู่มือการใช้งาน');
  if (document.getElementById('compare').checked) selectedDocs.push('เปรียบเทียบรุ่น');
  if (document.getElementById('promo').checked) selectedDocs.push('โปรโมชันประจำเดือน');
  
  // Show success message
  const modalBody = document.querySelector('.modal-body');
  const originalContent = modalBody.innerHTML;
  
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="color: #059669; font-size: 3rem; margin-bottom: 1rem;">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">ส่งข้อมูลเรียบร้อย</h3>
      <p style="color: #6b7280;">เอกสารที่เลือก (${selectedDocs.length}) ถูกส่งไปยังลูกค้าเรียบร้อยแล้ว</p>
    </div>
  `;
  
  // Close modal after 2 seconds
  setTimeout(() => {
    closeModal();
  }, 2000);
}

/**
 * Initialize search functionality
 */
function initSearch() {
  const searchInputs = document.querySelectorAll('.search-input input');
  
  searchInputs.forEach(input => {
    input.addEventListener('keyup', function(e) {
      // If Enter key is pressed
      if (e.key === 'Enter') {
        const searchTerm = this.value.trim().toLowerCase();
        if (searchTerm) {
          simulateSearch(searchTerm, this.closest('.tab-content').id);
        }
      }
    });
  });
  
  // Search buttons
  const searchButtons = document.querySelectorAll('.search-form .btn-primary');
  searchButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.closest('.search-form').querySelector('input');
      const searchTerm = input.value.trim().toLowerCase();
      if (searchTerm) {
        simulateSearch(searchTerm, this.closest('.tab-content').id);
      }
    });
  });
}

/**
 * Simulate search functionality
 * @param {string} term - The search term
 * @param {string} tabId - The ID of the current tab
 */
function simulateSearch(term, tabId) {
  // Add loading indicator
  const tabContent = document.getElementById(tabId);
  const resultsContainer = tabContent.querySelector('.card');
  
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div style="color: #2c67be; font-size: 2rem; margin-bottom: 1rem;">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>กำลังค้นหา "${term}"...</p>
      </div>
    `;
    
    // Simulate API call delay
    setTimeout(() => {
      if (tabId === 'search-tab') {
        // Refresh with original content
        // In a real app, this would be populated with actual search results
        resultsContainer.innerHTML = document.getElementById('search-results-template').innerHTML;
        initModals(); // Reinitialize modal triggers
      } else if (tabId === 'customers-tab') {
        resultsContainer.innerHTML = document.getElementById('customers-template').innerHTML;
      } else if (tabId === 'documents-tab') {
        resultsContainer.innerHTML = document.getElementById('documents-template').innerHTML;
      }
    }, 1000);
  }
}

/**
 * Initialize pipeline interactions
 */
function initPipeline() {
  // Show more buttons
  const showMoreButtons = document.querySelectorAll('.show-more');
  
  showMoreButtons.forEach(button => {
    button.addEventListener('click', function() {
      // In a real app, this would show more items in that pipeline stage
      alert('In a real app, this would show all items in this pipeline stage.');
    });
  });
  
  // Make pipeline items draggable
  const pipelineItems = document.querySelectorAll('.stage-item');
  
  pipelineItems.forEach(item => {
    item.setAttribute('draggable', 'true');
    
    item.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', this.innerHTML);
      this.classList.add('dragging');
    });
    
    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
    });
  });
  
  // Make pipeline stages droppable
  const pipelineStages = document.querySelectorAll('.pipeline-stage');
  
  pipelineStages.forEach(stage => {
    stage.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('dragover');
    });
    
    stage.addEventListener('dragleave', function() {
      this.classList.remove('dragover');
    });
    
    stage.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('dragover');
      
      const itemData = e.dataTransfer.getData('text/plain');
      const draggedItem = document.querySelector('.dragging');
      
      if (draggedItem) {
        draggedItem.remove();
      }
      
      // Create new item in the target stage
      const newItem = document.createElement('div');
      newItem.className = 'stage-item';
      newItem.innerHTML = itemData;
      newItem.setAttribute('draggable', 'true');
      
      // Add before "show more" link
      const showMore = this.querySelector('.show-more');
      if (showMore) {
        this.insertBefore(newItem, showMore);
      } else {
        this.appendChild(newItem);
      }
      
      // Update item count
      const countElement = this.querySelector('.stage-count span');
      if (countElement) {
        const newCount = parseInt(countElement.textContent) + 1;
        countElement.textContent = newCount;
      }
      
      // Reinitialize drag events for the new item
      newItem.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.innerHTML);
        this.classList.add('dragging');
      });
      
      newItem.addEventListener('dragend', function() {
        this.classList.remove('dragging');
      });
      
      // Simulate API call to update status
      simulateStatusUpdate('Pipeline item moved to new stage');
    });
  });
}

/**
 * Initialize document sharing functionality
 */
function initDocumentSharing() {
  // Document card actions
  const documentActions = document.querySelectorAll('.document-actions button');
  
  documentActions.forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      const documentCard = this.closest('.document-card');
      const documentTitle = documentCard.querySelector('h3').textContent;
      
      switch (action) {
        case 'view':
          alert(`Viewing document: ${documentTitle}`);
          break;
        case 'share':
          alert(`Sharing document: ${documentTitle}`);
          break;
        case 'download':
          alert(`Downloading document: ${documentTitle}`);
          break;
      }
    });
  });
}

/**
 * Initialize real-time data updates
 * This simulates updates from a backend service
 */
function initRealTimeUpdates() {
  // Simulate periodic stock updates
  setInterval(() => {
    // Randomly select a product to update
    const products = document.querySelectorAll('.product-card');
    if (products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      const product = products[randomIndex];
      
      // Update stock count
      const stockCountElement = product.querySelector('.stock-count');
      if (stockCountElement) {
        const currentCount = parseInt(stockCountElement.textContent.replace(/[^0-9]/g, ''));
        const newCount = Math.max(0, currentCount + (Math.random() > 0.7 ? -1 : 1));
        stockCountElement.textContent = `(เหลือ ${newCount} เครื่อง)`;
        
        // Update stock status
        const stockStatusElement = product.querySelector('.in-stock');
        if (stockStatusElement) {
          if (newCount === 0) {
            stockStatusElement.textContent = 'สินค้าหมด';
            stockStatusElement.style.color = '#ee4b2b';
          } else if (newCount <= 3) {
            stockStatusElement.textContent = 'ใกล้หมด';
            stockStatusElement.style.color = '#f59e0b';
          } else {
            stockStatusElement.textContent = 'มีสินค้า';
            stockStatusElement.style.color = '#059669';
          }
        }
      }
    }
  }, 30000); // Every 30 seconds
  
  // Simulate new notifications
  setTimeout(() => {
    // Add a new notification
    const notificationCount = document.querySelector('.notification-count');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    
    if (notificationCount && notificationDropdown) {
      const currentCount = parseInt(notificationCount.textContent);
      notificationCount.textContent = currentCount + 1;
      
      // Add new notification to dropdown
      const newNotification = document.createElement('div');
      newNotification.className = 'notification-item';
      newNotification.innerHTML = `
        <p class="notification-title">สินค้าใหม่เข้าสต๊อก: TV LG OLED</p>
        <p class="notification-desc">เพิ่มเข้าระบบเมื่อ 1 นาทีที่แล้ว</p>
      `;
      
      notificationDropdown.appendChild(newNotification);
      
      // Show notification alert
      showNotificationAlert('สินค้าใหม่เข้าสต๊อก', 'TV LG OLED เพิ่มเข้าระบบเมื่อ 1 นาทีที่แล้ว');
    }
  }, 45000); // After 45 seconds
}

/**
 * Show notification alert
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 */
function showNotificationAlert(title, message) {
  const alert = document.createElement('div');
  alert.className = 'notification-alert';
  alert.innerHTML = `
    <div class="notification-alert-icon">
      <i class="fas fa-bell"></i>
    </div>
    <div class="notification-alert-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
    <button class="notification-alert-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to DOM
  document.body.appendChild(alert);
  
  // Add animation
  setTimeout(() => {
    alert.classList.add('show');
  }, 100);
  
  // Auto close after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 5000);
  
  // Close button
  const closeButton = alert.querySelector('.notification-alert-close');
  closeButton.addEventListener('click', function() {
    alert.classList.remove('show');
    setTimeout(() => {
      alert.remove();
    }, 300);
  });
}

/**
 * Simulate API status update
 * @param {string} message - The status message
 */
function simulateStatusUpdate(message) {
  console.log('API Update:', message);
  // In a real app, this would make an API call to update the backend
}

/**
 * Templates for search results and other dynamic content
 * These would normally be loaded from an API or backend
 */
const searchResultsTemplate = `
  <h2>ผลการค้นหาล่าสุด</h2>
  
  <!-- Product Card 1 -->
  <div class="product-card">
    <div class="product-image">
      <img src="/api/placeholder/200/150" alt="TV Samsung">
    </div>
    <div class="product-details">
      <h3>Samsung QN90C 55" QLED 4K Smart TV</h3>
      <p class="product-code">รหัสสินค้า: TV-SAM-QN90C-55</p>
      <div class="stock-status">
        <span class="in-stock">มีสินค้า</span>
        <span class="stock-count">(เหลือ 2 เครื่อง)</span>
      </div>
      <p class="delivery-info"><span>จัดส่ง:</span> ภายใน 1-2 วัน</p>
      <div class="document-links">
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> สเปคสินค้า
        </a>
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
        </a>
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
        </a>
      </div>
    </div>
    <div class="product-action">
      <div>
        <p class="price">฿45,990</p>
        <p class="original-price">฿49,990</p>
        <p class="discount">ลด 8%</p>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary">
          <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
        </button>
        <button class="btn btn-outline">
          <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
        </button>
      </div>
    </div>
  </div>
  
  <!-- Product Card 2 -->
  <div class="product-card">
    <div class="product-image">
      <img src="/api/placeholder/200/150" alt="TV Samsung">
    </div>
    <div class="product-details">
      <h3>Samsung BU8100 55" Crystal UHD 4K Smart TV</h3>
      <p class="product-code">รหัสสินค้า: TV-SAM-BU8100-55</p>
      <div class="stock-status">
        <span class="in-stock">มีสินค้า</span>
        <span class="stock-count">(เหลือ 12 เครื่อง)</span>
      </div>
      <p class="delivery-info"><span>จัดส่ง:</span> พร้อมส่งทันที</p>
      <div class="document-links">
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> สเปคสินค้า
        </a>
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> คู่มือการใช้งาน
        </a>
        <a href="#" class="document-link">
          <i class="fas fa-file-pdf"></i> เปรียบเทียบรุ่น
        </a>
      </div>
    </div>
    <div class="product-action">
      <div>
        <p class="price">฿17,990</p>
        <p class="original-price">฿20,990</p>
        <p class="discount">ลด 14%</p>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary">
          <i class="fas fa-shopping-cart"></i> เพิ่มการขาย
        </button>
        <button class="btn btn-outline">
          <i class="fas fa-share-alt"></i> ส่งให้ลูกค้า
        </button>
      </div>
    </div>
  </div>
  
  <!-- Loading More -->
  <div class="load-more">
    <button class="btn-link">
      แสดงเพิ่มเติม
    </button>
  </div>
`;

// Add templates to DOM for simulation purposes
document.addEventListener('DOMContentLoaded', function() {
  // Create hidden templates in the DOM
  const templatesDiv = document.createElement('div');
  templatesDiv.style.display = 'none';
  
  const searchTemplate = document.createElement('script');
  searchTemplate.id = 'search-results-template';
  searchTemplate.type = 'text/template';
  searchTemplate.innerHTML = searchResultsTemplate;
  
  templatesDiv.appendChild(searchTemplate);
  document.body.appendChild(templatesDiv);
});

// CSS for notification alerts
const notificationAlertStyles = `
.notification-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  z-index: 100;
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.3s, transform 0.3s;
}

.notification-alert.show {
  opacity: 1;
  transform: translateX(0);
}

.notification-alert-icon {
  background-color: #ebf5ff;
  color: #2c67be;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.notification-alert-content h4 {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.notification-alert-content p {
  font-size: 0.875rem;
  color: #6b7280;
}

.notification-alert-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  margin-left: auto;
}
`;

// Add notification styles to DOM
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.innerHTML = notificationAlertStyles;
  document.head.appendChild(style);
});