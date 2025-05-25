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
 * Setup search functionality with enhanced features
 */
function setupSearchFunctionality() {
  const searchInput = document.getElementById('search-keyword');
  const searchButton = document.getElementById('search-button');
  const clearButton = document.getElementById('clear-search');
  const categoryFilter = document.getElementById('category-filter');
  
  // Setup search input functionality
  if (searchInput) {
    // Set enhanced placeholder
    searchInput.placeholder = 'ค้นหาด้วยชื่อสินค้า, รหัส, คุณสมบัติ หรือช่วงราคา';
    
    // Search hints for better UX
    const searchHints = [
      'ค้นหาด้วยชื่อสินค้า, รหัส, คุณสมบัติ หรือช่วงราคา',
      'ลองค้นหา "ทีวี Samsung" หรือ "รหัส TV001"',
      'ค้นหาด้วยยี่ห้อ เช่น "LG" หรือ "Sony"',
      'ค้นหาด้วยราคา เช่น "10000-20000"',
      'ค้นหาด้วยคุณสมบัติ เช่น "4K" หรือ "Smart TV"',
      'ค้นหาด้วยรุ่น เช่น "C2" หรือ "A80J"'
    ];
    
    let hintIndex = 0;
    let hintInterval;
    
    // Start hint rotation
    function startHintRotation() {
      hintInterval = setInterval(() => {
        if (document.activeElement !== searchInput && !searchInput.value.trim()) {
          hintIndex = (hintIndex + 1) % searchHints.length;
          searchInput.placeholder = searchHints[hintIndex];
        }
      }, 4000);
    }
    
    // Stop hint rotation
    function stopHintRotation() {
      if (hintInterval) {
        clearInterval(hintInterval);
        hintInterval = null;
      }
    }
    
    // Start hint rotation on page load
    setTimeout(startHintRotation, 3000);
    
    // Handle focus events
    searchInput.addEventListener('focus', function() {
      stopHintRotation();
      this.placeholder = 'ค้นหาด้วยชื่อสินค้า, รหัส, คุณสมบัติ หรือช่วงราคา';
      
      // Add focus styling
      this.parentElement.classList.add('search-focused');
    });
    
    // Handle blur events
    searchInput.addEventListener('blur', function() {
      this.parentElement.classList.remove('search-focused');
      
      // Restart hint rotation if input is empty
      if (!this.value.trim()) {
        setTimeout(startHintRotation, 2000);
      }
    });
    
    // Handle Enter key in search input
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearch();
      }
    });
    
    // Handle input changes for real-time feedback
    searchInput.addEventListener('input', function() {
      const value = this.value.trim();
      
      // Enable/disable search button
      if (searchButton) {
        searchButton.disabled = false;
        
        // Add visual feedback
        if (value.length > 0) {
          searchButton.classList.add('search-active');
          this.parentElement.classList.add('has-value');
        } else {
          searchButton.classList.remove('search-active');
          this.parentElement.classList.remove('has-value');
        }
      }
      
      // Show clear button when there's text
      if (clearButton) {
        if (value.length > 0) {
          clearButton.style.display = 'block';
          clearButton.style.opacity = '1';
        } else {
          clearButton.style.opacity = '0';
          setTimeout(() => {
            if (!this.value.trim()) {
              clearButton.style.display = 'none';
            }
          }, 200);
        }
      }
      
      // Stop hint rotation when typing
      if (value.length > 0) {
        stopHintRotation();
      } else if (document.activeElement !== this) {
        setTimeout(startHintRotation, 2000);
      }
      
      // Auto-search after user stops typing (debounce)
      clearTimeout(this.searchTimeout);
      if (value.length >= 2) {
        this.searchTimeout = setTimeout(() => {
          console.log('Auto-searching for:', value);
          triggerSearch();
        }, 1000); // Wait 1 second after user stops typing
      }
    });
    
    // Handle keyboard shortcuts
    searchInput.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + A = Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // Let default behavior happen
        return;
      }
      
      // Escape = Clear and blur
      if (e.key === 'Escape') {
        this.value = '';
        this.blur();
        clearSearch();
      }
      
      // Arrow up/down for search history (future feature)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // TODO: Implement search history navigation
        console.log('Search history navigation:', e.key);
      }
    });
  }
  
  // Handle search button click
  if (searchButton) {
    searchButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Add click animation
      this.classList.add('button-clicked');
      setTimeout(() => {
        this.classList.remove('button-clicked');
      }, 150);
      
      triggerSearch();
    });
    
    // Initial state
    searchButton.disabled = false;
  }
  
  // Handle clear button
  if (clearButton) {
    clearButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Add click animation
      this.classList.add('button-clicked');
      setTimeout(() => {
        this.classList.remove('button-clicked');
      }, 150);
      
      clearSearch();
      
      // Focus back to search input
      if (searchInput) {
        searchInput.focus();
      }
    });
    
    // Initial state - hide clear button
    clearButton.style.display = 'none';
  }
  
  // Handle category filter change
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      // Add visual feedback
      if (this.value) {
        this.classList.add('filter-active');
      } else {
        this.classList.remove('filter-active');
      }
      
      // Auto-trigger search when category changes
      console.log('Category changed to:', this.value);
      setTimeout(triggerSearch, 100);
    });
    
    // Initial state check
    if (categoryFilter.value) {
      categoryFilter.classList.add('filter-active');
    }
  }
  
  // Setup search suggestions (future enhancement)
  setupSearchSuggestions();
  
  // Setup search history (future enhancement)
  setupSearchHistory();
  
  // Add search analytics
  setupSearchAnalytics();
}

/**
 * Setup search suggestions functionality
 */
function setupSearchSuggestions() {
  const searchInput = document.getElementById('search-keyword');
  if (!searchInput) return;
  
  // Create suggestions container
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'search-suggestions';
  suggestionsContainer.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 0.5rem 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
  `;
  
  // Insert after search input container
  const searchContainer = searchInput.parentElement;
  searchContainer.style.position = 'relative';
  searchContainer.appendChild(suggestionsContainer);
  
  // Sample suggestions (in real app, these would come from API)
  const sampleSuggestions = [
    'ทีวี Samsung',
    'เครื่องซักผ้า LG',
    'ตู้เย็น Sharp',
    'เครื่องปรับอากาศ Daikin',
    'Smart TV 4K',
    'ตู้เย็น 2 ประตู',
    'เครื่องซักผ้าฝาบน',
    'แอร์แบบแขวน'
  ];
  
  let currentSuggestionIndex = -1;
  
  // Show suggestions
  searchInput.addEventListener('input', function() {
    const value = this.value.trim().toLowerCase();
    
    if (value.length < 2) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    // Filter suggestions
    const filteredSuggestions = sampleSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value)
    );
    
    if (filteredSuggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    // Render suggestions
    suggestionsContainer.innerHTML = filteredSuggestions
      .slice(0, 5) // Show max 5 suggestions
      .map((suggestion, index) => `
        <div class="suggestion-item" data-index="${index}" style="
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#f3f4f6'" 
           onmouseout="this.style.backgroundColor='white'">
          <i class="fas fa-search" style="color: #9ca3af; margin-right: 0.5rem;"></i>
          ${escapeHtml(suggestion)}
        </div>
      `).join('');
    
    suggestionsContainer.style.display = 'block';
    currentSuggestionIndex = -1;
    
    // Add click listeners to suggestions
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
      item.addEventListener('click', function() {
        searchInput.value = filteredSuggestions[index];
        suggestionsContainer.style.display = 'none';
        triggerSearch();
      });
    });
  });
  
  // Handle keyboard navigation in suggestions
  searchInput.addEventListener('keydown', function(e) {
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
      updateSuggestionSelection(suggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
      updateSuggestionSelection(suggestions);
    } else if (e.key === 'Enter' && currentSuggestionIndex >= 0) {
      e.preventDefault();
      suggestions[currentSuggestionIndex].click();
    }
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  function updateSuggestionSelection(suggestions) {
    suggestions.forEach((item, index) => {
      if (index === currentSuggestionIndex) {
        item.style.backgroundColor = '#dbeafe';
        item.style.color = '#1e40af';
      } else {
        item.style.backgroundColor = 'white';
        item.style.color = 'inherit';
      }
    });
  }
}

/**
 * Setup search history functionality
 */
function setupSearchHistory() {
  const SEARCH_HISTORY_KEY = 'infohub_search_history';
  const MAX_HISTORY_ITEMS = 10;
  
  // Get search history from localStorage
  function getSearchHistory() {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.warn('Failed to load search history:', e);
      return [];
    }
  }
  
  // Save search to history
  function saveSearchToHistory(searchTerm, category = '') {
    if (!searchTerm.trim()) return;
    
    try {
      let history = getSearchHistory();
      
      // Remove duplicate if exists
      history = history.filter(item => 
        !(item.term === searchTerm && item.category === category)
      );
      
      // Add to beginning
      history.unshift({
        term: searchTerm,
        category: category,
        timestamp: Date.now()
      });
      
      // Limit history size
      history = history.slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  }
  
  // Listen for search events to save history
  document.addEventListener('search-triggered', function(e) {
    const { keyword, category } = e.detail;
    if (keyword) {
      saveSearchToHistory(keyword, category);
    }
  });
  
  // Export for external use
  window.InfoHubApp.getSearchHistory = getSearchHistory;
  window.InfoHubApp.saveSearchToHistory = saveSearchToHistory;
}

/**
 * Setup search analytics
 */
function setupSearchAnalytics() {
  const analytics = {
    searchCount: 0,
    popularTerms: {},
    lastSearchTime: null
  };
  
  // Track search events
  document.addEventListener('search-triggered', function(e) {
    const { keyword, category } = e.detail;
    
    // Update analytics
    analytics.searchCount++;
    analytics.lastSearchTime = Date.now();
    
    if (keyword) {
      analytics.popularTerms[keyword] = (analytics.popularTerms[keyword] || 0) + 1;
    }
    
    // Log for debugging
    console.log('Search Analytics:', {
      term: keyword,
      category: category,
      totalSearches: analytics.searchCount,
      timestamp: new Date().toISOString()
    });
    
    // Send to analytics service (future implementation)
    // sendAnalyticsEvent('search', { keyword, category });
  });
  
  // Export analytics
  window.InfoHubApp.getSearchAnalytics = () => ({ ...analytics });
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