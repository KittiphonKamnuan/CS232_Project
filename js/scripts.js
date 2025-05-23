/**
 * InfoHub 360 - Main Scripts
 * 
 * ไฟล์นี้ใช้สำหรับฟังก์ชันพื้นฐานและการทำงานหลักของแอปพลิเคชัน
 * เช่น navigation, modal, search และฟีเจอร์ทั่วไป
 */

// Global variables
let isAppReady = false;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('InfoHub 360 - Initializing...');
  
  // Initialize core functions
  initializeApp();
  setupNavigation();
  setupModals();
  setupSearchFunctionality();
  setupGlobalEventListeners();
});

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('Initializing InfoHub 360...');
  
  // Hide preloader after initialization
  setTimeout(() => {
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
    isAppReady = true;
    console.log('InfoHub 360 ready!');
  }, 1000);
  
  // Set current page active in navigation
  setActiveNavigation();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
}

/**
 * Setup navigation functionality
 */
function setupNavigation() {
  // Handle sidebar menu clicks
  const menuItems = document.querySelectorAll('.sidebar .menu-item');
  
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Don't prevent default for logout link (let auth-guard handle it)
      if (!this.classList.contains('logout-link')) {
        e.preventDefault();
        
        if (href && href !== '#') {
          // Add loading state
          showNavigationLoading();
          
          // Navigate after short delay for UX
          setTimeout(() => {
            window.location.href = href;
          }, 200);
        }
      }
    });
  });
  
  // Handle logo click
  const logo = document.querySelector('.logo a');
  if (logo) {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      showNavigationLoading();
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 200);
    });
  }
}

/**
 * Set active navigation based on current page
 */
function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const menuItems = document.querySelectorAll('.sidebar .menu-item');
  
  menuItems.forEach(item => {
    item.classList.remove('active');
    
    const href = item.getAttribute('href');
    if (href && (currentPath.includes(href) || (currentPath === '/' && href === 'index.html'))) {
      item.classList.add('active');
    }
  });
}

/**
 * Show navigation loading state
 */
function showNavigationLoading() {
  const preloader = document.getElementById('app-preloader');
  if (preloader) {
    preloader.style.display = 'flex';
  }
}

/**
 * Setup modal functionality
 */
function setupModals() {
  // Global modal event delegation
  document.addEventListener('click', function(e) {
    // Handle modal close buttons
    if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
      closeModal(e.target.closest('.modal-backdrop'));
    }
    
    // Handle backdrop clicks
    if (e.target.matches('.modal-backdrop')) {
      closeModal(e.target);
    }
  });
  
  // Handle ESC key to close modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });
}

/**
 * Close modal with animation
 * @param {HTMLElement} modal - Modal element to close
 */
function closeModal(modal) {
  if (!modal) return;
  
  modal.style.opacity = '0';
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }, 300);
}

/**
 * Setup search functionality (basic form handling)
 */
function setupSearchFunctionality() {
  const searchInput = document.getElementById('search-keyword');
  const searchButton = document.getElementById('search-button');
  const clearButton = document.getElementById('clear-search');
  const categoryFilter = document.getElementById('category-filter');
  
  // Handle Enter key in search input
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearch();
      }
    });
    
    // Handle input changes for real-time feedback
    searchInput.addEventListener('input', function() {
      const value = this.value.trim();
      if (searchButton) {
        searchButton.disabled = false;
      }
    });
  }
  
  // Handle search button click
  if (searchButton) {
    searchButton.addEventListener('click', function(e) {
      e.preventDefault();
      triggerSearch();
    });
  }
  
  // Handle clear button
  if (clearButton) {
    clearButton.addEventListener('click', function(e) {
      e.preventDefault();
      clearSearch();
    });
  }
  
  // Handle category filter change
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      // Auto-trigger search when category changes
      setTimeout(triggerSearch, 100);
    });
  }
}

/**
 * Trigger search functionality
 * This function will be called by product controller
 */
function triggerSearch() {
  console.log('Search triggered');
  
  const searchInput = document.getElementById('search-keyword');
  const categoryFilter = document.getElementById('category-filter');
  
  const searchData = {
    keyword: searchInput ? searchInput.value.trim() : '',
    category: categoryFilter ? categoryFilter.value : ''
  };
  
  // Dispatch custom event for product controller to handle
  const searchEvent = new CustomEvent('search-triggered', {
    detail: searchData
  });
  document.dispatchEvent(searchEvent);
}

/**
 * Clear search form
 */
function clearSearch() {
  const searchInput = document.getElementById('search-keyword');
  const categoryFilter = document.getElementById('category-filter');
  
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  
  // Trigger search to show all products
  setTimeout(triggerSearch, 100);
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Handle retry button clicks
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('retry-btn')) {
      const retryEvent = new CustomEvent('retry-requested');
      document.dispatchEvent(retryEvent);
    }
  });
  
  // Handle load more button clicks
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('load-more-btn') || e.target.closest('.load-more-btn')) {
      const loadMoreEvent = new CustomEvent('load-more-requested');
      document.dispatchEvent(loadMoreEvent);
    }
  });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Don't interfere with form inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Ctrl/Cmd + K = Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-keyword');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Ctrl/Cmd + Enter = Trigger search
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
    
    // ESC = Clear search
    if (e.key === 'Escape') {
      const searchInput = document.getElementById('search-keyword');
      if (searchInput && document.activeElement === searchInput) {
        clearSearch();
        searchInput.blur();
      }
    }
  });
}

/**
 * Show notification message
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.app-notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `app-notification notification-${type}`;
  
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${iconMap[type]}"></i>
      <span>${escapeHtml(message)}</span>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-left: 4px solid ${getNotificationColor(type)};
    z-index: 1000;
    max-width: 400px;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Handle close button
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
    setTimeout(() => notification.remove(), 300);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(20px)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string} - Color code
 */
function getNotificationColor(type) {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  return colors[type] || colors.info;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format number with Thai locale
 * @param {number} number - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(number) {
  if (typeof number !== 'number') return '0';
  return number.toLocaleString('th-TH');
}

/**
 * Format currency with Thai Baht
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number') return '฿0';
  return `฿${amount.toLocaleString('th-TH')}`;
}

/**
 * Show loading state for any element
 * @param {HTMLElement} element - Element to show loading state
 * @param {string} message - Loading message
 */
function showLoadingState(element, message = 'กำลังโหลด...') {
  if (!element) return;
  
  const originalContent = element.innerHTML;
  element.setAttribute('data-original-content', originalContent);
  
  element.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Hide loading state and restore original content
 * @param {HTMLElement} element - Element to restore
 */
function hideLoadingState(element) {
  if (!element) return;
  
  const originalContent = element.getAttribute('data-original-content');
  if (originalContent) {
    element.innerHTML = originalContent;
    element.removeAttribute('data-original-content');
  }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if in viewport
 */
function isElementInViewport(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 * @param {HTMLElement|string} target - Element or selector to scroll to
 */
function scrollToElement(target) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Export functions for use by other scripts
window.InfoHubApp = {
  showNotification,
  closeModal,
  triggerSearch,
  clearSearch,
  formatNumber,
  formatCurrency,
  showLoadingState,
  hideLoadingState,
  escapeHtml,
  isElementInViewport,
  scrollToElement,
  isAppReady: () => isAppReady
};

// Custom events for inter-script communication
window.addEventListener('load', function() {
  const appReadyEvent = new CustomEvent('app-ready');
  document.dispatchEvent(appReadyEvent);
});

// Handle online/offline status
window.addEventListener('online', function() {
  showNotification('เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
});

window.addEventListener('offline', function() {
  showNotification('การเชื่อมต่ออินเทอร์เน็ตหลุด กรุณาตรวจสอบการเชื่อมต่อ', 'warning');
});

console.log('InfoHub 360 Scripts loaded successfully');