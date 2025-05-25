/**
 * InfoHub 360 - Status Tracking Controller
 * 
 * Controller สำหรับจัดการสถานะการติดตามลูกค้า (Status Tracking)
 * ทำงานร่วมกับ customer-controller.js และ data-service.js
 * จัดการการแสดงผล แก้ไข และลบสถานะการติดตามสินค้าของลูกค้า
 */

import dataService from '../services/data-service.js';

class StatusTrackingController {
  constructor() {
    this.statusTracking = [];
    this.currentCustomerId = null;
    this.isLoading = false;
    
    // Status Options
    this.statusOptions = [
      { value: 'สนใจ', label: 'สถานะ 1: ลูกค้าสนใจสินค้า' },
      { value: 'รอชำระเงิน', label: 'สถานะ 2: รอชำระเงิน' },
      { value: 'ชำระเงินแล้ว', label: 'สถานะ 3: ชำระเงินแล้ว' },
      { value: 'ส่งมอบสินค้า', label: 'สถานะ 4: ส่งมอบสินค้า' },
      { value: 'บริการหลังการขาย', label: 'สถานะ 5: บริการหลังการขาย' }
    ];
    
    // DOM Elements - จะถูกกำหนดเมื่อเรียกใช้
    this.statusTrackingContainer = null;
    this.loadingIndicator = null;
    this.errorMessage = null;
  }
  
  /**
   * เริ่มต้น Status Tracking สำหรับลูกค้าที่ระบุ
   * @param {string} customerId - รหัสลูกค้า
   * @param {HTMLElement} container - Element container สำหรับแสดงผล
   */
  async initialize(customerId, container) {
    try {
      this.currentCustomerId = customerId;
      this.statusTrackingContainer = container;
      
      // สร้าง HTML structure
      this.createStatusTrackingHTML();
      
      // โหลดข้อมูล status tracking
      await this.loadStatusTracking();
      
    } catch (error) {
      console.error('Error initializing status tracking:', error);
      this.showError('ไม่สามารถเริ่มต้นระบบติดตามสถานะได้');
    }
  }
  
  /**
   * สร้าง HTML structure สำหรับ Status Tracking
   */
  createStatusTrackingHTML() {
    if (!this.statusTrackingContainer) return;
    
    const html = `
      <div class="customer-info-card status-tracking-card">
        <div class="card-header-with-actions">
          <h3 class="card-title">
            <i class="fas fa-tasks"></i> สถานะการติดตามสินค้า
          </h3>
          <button class="btn btn-sm btn-primary" id="add-status-tracking">
            <i class="fas fa-plus"></i> เพิ่มสถานะ
          </button>
        </div>
        
        <!-- Loading Indicator -->
        <div id="status-loading" class="status-loading" style="display: none;">
          <div class="loading-content">
            <i class="fas fa-spinner fa-spin"></i>
            <span>กำลังโหลดข้อมูลสถานะ...</span>
          </div>
        </div>
        
        <!-- Error Message -->
        <div id="status-error" class="status-error" style="display: none;">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span class="error-text">เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
            <button class="btn btn-sm btn-outline retry-status" id="retry-status">
              <i class="fas fa-redo"></i> ลองใหม่
            </button>
          </div>
        </div>
        
        <!-- Status Tracking Content -->
        <div id="status-tracking-content" class="status-tracking-content">
          <!-- จะเติมข้อมูลด้วย JavaScript -->
        </div>
        
        <!-- Empty State -->
        <div id="status-empty" class="status-empty" style="display: none;">
          <div class="empty-content">
            <i class="fas fa-clipboard-list"></i>
            <h4>ยังไม่มีการติดตามสถานะ</h4>
            <p>เริ่มต้นการติดตามสถานะลูกค้าสำหรับสินค้าต่างๆ</p>
            <button class="btn btn-primary" id="add-first-status">
              <i class="fas fa-plus"></i> เพิ่มสถานะแรก
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.statusTrackingContainer.innerHTML = html;
    
    // กำหนด DOM elements
    this.loadingIndicator = document.getElementById('status-loading');
    this.errorMessage = document.getElementById('status-error');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // เพิ่ม CSS styles
    this.addStatusTrackingStyles();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add status tracking button
    const addButton = document.getElementById('add-status-tracking');
    const addFirstButton = document.getElementById('add-first-status');
    
    if (addButton) {
      addButton.addEventListener('click', () => {
        this.showAddStatusModal();
      });
    }
    
    if (addFirstButton) {
      addFirstButton.addEventListener('click', () => {
        this.showAddStatusModal();
      });
    }
    
    // Retry button
    const retryButton = document.getElementById('retry-status');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadStatusTracking();
      });
    }
  }
  
  /**
   * โหลดข้อมูล Status Tracking จาก API
   */
  async loadStatusTracking() {
    try {
      this.showLoading();
      
      const statusData = await dataService.getStatusTracking(this.currentCustomerId);
      this.statusTracking = statusData;
      
      this.displayStatusTracking();
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('โหลดข้อมูลสถานะเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error loading status tracking:', error);
      this.showError('ไม่สามารถโหลดข้อมูลสถานะได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.hideLoading();
    }
  }
  
  /**
   * แสดงข้อมูล Status Tracking
   */
  displayStatusTracking() {
    const contentContainer = document.getElementById('status-tracking-content');
    const emptyState = document.getElementById('status-empty');
    
    if (!contentContainer) return;
    
    if (!this.statusTracking || this.statusTracking.length === 0) {
      contentContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // สร้างตาราง
    const html = `
      <div class="status-table-container">
        <table class="status-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>จำนวน</th>
              <th>ราคา</th>
              <th>สถานะ</th>
              <th>วันที่</th>
              <th>หมายเหตุ</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            ${this.statusTracking.map(item => this.createStatusTrackingRow(item)).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    contentContainer.innerHTML = html;
    
    // Setup event listeners สำหรับแต่ละแถว
    this.setupRowEventListeners();
  }
  
  /**
   * สร้างแถวของตาราง Status Tracking
   */
  createStatusTrackingRow(item) {
    const createdDate = new Date(item.created_at).toLocaleDateString('th-TH');
    const price = window.InfoHubApp ? window.InfoHubApp.formatCurrency(item.product_price) : `฿${item.product_price.toLocaleString()}`;
    
    return `
      <tr data-state-id="${this.escapeHtml(item.state_id)}">
        <td>
          <div class="product-info">
            <div class="product-name">${this.escapeHtml(item.product_name)}</div>
            <div class="product-id">รหัส: ${this.escapeHtml(item.product_id)}</div>
          </div>
        </td>
        <td class="text-center">
          <span class="quantity-badge">${item.quantity}</span>
        </td>
        <td class="text-right">
          <span class="price-text">${price}</span>
        </td>
        <td>
          <select class="status-select" data-state-id="${this.escapeHtml(item.state_id)}" 
                  data-original-status="${this.escapeHtml(item.customer_status)}">
            ${this.statusOptions.map(option => `
              <option value="${this.escapeHtml(option.value)}" 
                      ${option.value === item.customer_status ? 'selected' : ''}>
                ${this.escapeHtml(option.label)}
              </option>
            `).join('')}
          </select>
        </td>
        <td>
          <span class="date-text">${createdDate}</span>
        </td>
        <td>
          <div class="notes-container">
            <textarea class="notes-input" data-state-id="${this.escapeHtml(item.state_id)}" 
                      placeholder="เพิ่มหมายเหตุ...">${this.escapeHtml(item.notes || '')}</textarea>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon save-status" data-state-id="${this.escapeHtml(item.state_id)}" 
                    title="บันทึกการเปลี่ยนแปลง" style="display: none;">
              <i class="fas fa-save"></i>
            </button>
            <button class="btn-icon cancel-status" data-state-id="${this.escapeHtml(item.state_id)}" 
                    title="ยกเลิกการเปลี่ยนแปลง" style="display: none;">
              <i class="fas fa-times"></i>
            </button>
            <button class="btn-icon delete-status" data-state-id="${this.escapeHtml(item.state_id)}" 
                    title="ลบรายการ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }
  
  /**
   * Setup event listeners สำหรับแต่ละแถวในตาราง
   */
  setupRowEventListeners() {
    // Status select change events
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        this.handleStatusChange(e.target);
      });
    });
    
    // Notes input change events
    const notesInputs = document.querySelectorAll('.notes-input');
    notesInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.handleNotesChange(e.target);
      });
    });
    
    // Save buttons
    const saveButtons = document.querySelectorAll('.save-status');
    saveButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const stateId = button.getAttribute('data-state-id');
        this.saveStatusChanges(stateId);
      });
    });
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-status');
    cancelButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const stateId = button.getAttribute('data-state-id');
        this.cancelStatusChanges(stateId);
      });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-status');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const stateId = button.getAttribute('data-state-id');
        this.deleteStatusTracking(stateId);
      });
    });
  }
  
  /**
   * จัดการการเปลี่ยนแปลงสถานะ
   */
  handleStatusChange(selectElement) {
    const stateId = selectElement.getAttribute('data-state-id');
    this.showActionButtons(stateId);
  }
  
  /**
   * จัดการการเปลี่ยนแปลงหมายเหตุ
   */
  handleNotesChange(inputElement) {
    const stateId = inputElement.getAttribute('data-state-id');
    this.showActionButtons(stateId);
  }
  
  /**
   * แสดงปุ่ม Save/Cancel
   */
  showActionButtons(stateId) {
    const row = document.querySelector(`tr[data-state-id="${stateId}"]`);
    if (!row) return;
    
    const saveButton = row.querySelector('.save-status');
    const cancelButton = row.querySelector('.cancel-status');
    
    if (saveButton) saveButton.style.display = 'inline-flex';
    if (cancelButton) cancelButton.style.display = 'inline-flex';
  }
  
  /**
   * ซ่อนปุ่ม Save/Cancel
   */
  hideActionButtons(stateId) {
    const row = document.querySelector(`tr[data-state-id="${stateId}"]`);
    if (!row) return;
    
    const saveButton = row.querySelector('.save-status');
    const cancelButton = row.querySelector('.cancel-status');
    
    if (saveButton) saveButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
  }
  
  /**
   * บันทึกการเปลี่ยนแปลงสถานะ
   */
  async saveStatusChanges(stateId) {
    try {
      const row = document.querySelector(`tr[data-state-id="${stateId}"]`);
      if (!row) return;
      
      const statusSelect = row.querySelector('.status-select');
      const notesInput = row.querySelector('.notes-input');
      
      const newStatus = statusSelect.value;
      const newNotes = notesInput.value.trim();
      
      // Show loading
      const saveButton = row.querySelector('.save-status');
      if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        saveButton.disabled = true;
      }
      
      // Call API to update status
      await dataService.updateStatusTracking(stateId, {
        customer_status: newStatus,
        notes: newNotes
      });
      
      // Update original values
      statusSelect.setAttribute('data-original-status', newStatus);
      
      // Hide action buttons
      this.hideActionButtons(stateId);
      
      // Show success message
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('อัปเดตสถานะเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error saving status changes:', error);
      
      // Reset button
      const saveButton = document.querySelector(`[data-state-id="${stateId}"].save-status`);
      if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.disabled = false;
      }
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('ไม่สามารถอัปเดตสถานะได้', 'error');
      }
    }
  }
  
  /**
   * ยกเลิกการเปลี่ยนแปลงสถานะ
   */
  cancelStatusChanges(stateId) {
    const row = document.querySelector(`tr[data-state-id="${stateId}"]`);
    if (!row) return;
    
    const statusSelect = row.querySelector('.status-select');
    const notesInput = row.querySelector('.notes-input');
    
    // Reset to original values
    const originalStatus = statusSelect.getAttribute('data-original-status');
    statusSelect.value = originalStatus;
    
    const originalItem = this.statusTracking.find(item => item.state_id === stateId);
    if (originalItem) {
      notesInput.value = originalItem.notes || '';
    }
    
    // Hide action buttons
    this.hideActionButtons(stateId);
  }
  
  /**
   * ลบ Status Tracking
   */
  async deleteStatusTracking(stateId) {
    try {
      const confirmed = await this.showDeleteConfirmation(stateId);
      if (!confirmed) return;
      
      // Call API to delete
      await dataService.deleteStatusTracking(stateId);
      
      // Remove from local array
      this.statusTracking = this.statusTracking.filter(item => item.state_id !== stateId);
      
      // Re-render
      this.displayStatusTracking();
      
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('ลบรายการเรียบร้อย', 'success');
      }
      
    } catch (error) {
      console.error('Error deleting status tracking:', error);
      if (window.InfoHubApp) {
        window.InfoHubApp.showNotification('ไม่สามารถลบรายการได้', 'error');
      }
    }
  }
  
  /**
   * แสดง Modal ยืนยันการลบ
   */
  async showDeleteConfirmation(stateId) {
    return new Promise((resolve) => {
      const item = this.statusTracking.find(item => item.state_id === stateId);
      if (!item) {
        resolve(false);
        return;
      }
      
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.style.display = 'flex';
      
      modal.innerHTML = `
        <div class="modal modal-danger">
          <div class="modal-header">
            <h2>ยืนยันการลบ</h2>
            <button class="modal-close" type="button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="delete-confirmation">
              <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="delete-message">
                <h3>คุณแน่ใจหรือไม่?</h3>
                <p>คุณกำลังจะลบการติดตามสถานะ</p>
                <div class="item-info">
                  <strong>${this.escapeHtml(item.product_name)}</strong>
                  <br>
                  <small>สถานะ: ${this.escapeHtml(item.customer_status)}</small>
                  <br>
                  <small>วันที่: ${new Date(item.created_at).toLocaleDateString('th-TH')}</small>
                </div>
                <p class="warning-text">
                  <i class="fas fa-exclamation-circle"></i>
                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-outline modal-close">
              <i class="fas fa-times"></i> ยกเลิก
            </button>
            <button type="button" class="btn btn-danger" id="confirm-delete">
              <i class="fas fa-trash"></i> ลบรายการ
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Setup event listeners
      const closeButtons = modal.querySelectorAll('.modal-close');
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });
      });
      
      const confirmButton = modal.querySelector('#confirm-delete');
      if (confirmButton) {
        confirmButton.addEventListener('click', () => {
          modal.remove();
          resolve(true);
        });
      }
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
    });
  }
  
  /**
   * แสดง Modal เพิ่มสถานะใหม่
   */
  showAddStatusModal() {
    // ฟีเจอร์นี้จะสร้างในขั้นตอนถัดไป
    if (window.InfoHubApp) {
      window.InfoHubApp.showNotification('ฟีเจอร์กำลังพัฒนา กรุณาเพิ่มสถานะผ่านหน้าสินค้า', 'info');
    }
  }
  
  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true;
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
    this.hideError();
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
      const errorText = this.errorMessage.querySelector('.error-text');
      if (errorText) {
        errorText.textContent = message;
      }
      this.errorMessage.style.display = 'flex';
    }
  }
  
  /**
   * Hide error message
   */
  hideError() {
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
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
  
  /**
   * เพิ่ม CSS Styles สำหรับ Status Tracking
   */
  addStatusTrackingStyles() {
    const styleId = 'status-tracking-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Status Tracking Styles */
      .status-tracking-card {
        margin-top: 1.5rem;
      }
      
      .card-header-with-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .status-loading,
      .status-error {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }
      
      .loading-content,
      .error-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .loading-content i {
        color: #3b82f6;
        font-size: 1.25rem;
      }
      
      .error-content i {
        color: #dc2626;
        font-size: 1.25rem;
      }
      
      .status-table-container {
        overflow-x: auto;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
      }
      
      .status-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }
      
      .status-table th {
        background: #f9fafb;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.875rem;
      }
      
      .status-table td {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }
      
      .status-table tr:hover {
        background: #f9fafb;
      }
      
      .product-info {
        min-width: 200px;
      }
      
      .product-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
        line-height: 1.4;
      }
      
      .product-id {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
      
      .quantity-badge {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.875rem;
      }
      
      .price-text {
        font-weight: 600;
        color: #059669;
        font-size: 0.875rem;
      }
      
      .status-select {
        width: 100%;
        min-width: 180px;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: white;
        cursor: pointer;
      }
      
      .status-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .notes-container {
        min-width: 150px;
      }
      
      .notes-input {
        width: 100%;
        min-height: 60px;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        resize: vertical;
        font-family: inherit;
      }
      
      .notes-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .date-text {
        font-size: 0.875rem;
        color: #6b7280;
        white-space: nowrap;
      }
      
      .action-buttons {
        display: flex;
        gap: 0.5rem;
        min-width: 120px;
        justify-content: flex-end;
      }
      
      .btn-icon {
        background: none;
        border: 1px solid #d1d5db;
        color: #6b7280;
        padding: 0.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
      }
      
      .btn-icon:hover {
        background: #f3f4f6;
        color: #374151;
        border-color: #9ca3af;
      }
      
      .btn-icon.save-status {
        color: #059669;
        border-color: #d1fae5;
      }
      
      .btn-icon.save-status:hover {
        background: #ecfdf5;
        border-color: #059669;
      }
      
      .btn-icon.cancel-status {
        color: #dc2626;
        border-color: #fecaca;
      }
      
      .btn-icon.cancel-status:hover {
        background: #fef2f2;
        border-color: #dc2626;
      }
      
      .btn-icon.delete-status {
        color: #dc2626;
        border-color: #fecaca;
      }
      
      .btn-icon.delete-status:hover {
        background: #fef2f2;
        border-color: #dc2626;
      }
      
      .btn-icon:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .status-empty {
        text-align: center;
        padding: 3rem 1rem;
      }
      
      .empty-content i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }
      
      .empty-content h4 {
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      .empty-content p {
        color: #6b7280;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
      }
      
      .text-center {
        text-align: center;
      }
      
      .text-right {
        text-align: right;
      }
      
      /* Delete Confirmation Modal Styles */
      .modal-danger {
        border-top: 4px solid #dc2626;
      }
      
      .delete-confirmation {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .warning-icon {
        background: #fef2f2;
        color: #dc2626;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      
      .delete-message {
        flex: 1;
      }
      
      .delete-message h3 {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      .delete-message p {
        margin: 0 0 1rem 0;
        color: #6b7280;
      }
      
      .item-info {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        border-left: 4px solid #3b82f6;
      }
      
      .item-info strong {
        color: #1f2937;
        font-size: 1rem;
      }
      
      .item-info small {
        color: #6b7280;
        display: block;
        margin-top: 0.25rem;
      }
      
      .warning-text {
        background: #fef2f2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        border: 1px solid #fecaca;
        margin-top: 1rem;
      }
      
      .warning-text i {
        margin-right: 0.5rem;
      }
      
      /* Responsive Design */
      @media (max-width: 1024px) {
        .status-table th,
        .status-table td {
          padding: 0.75rem;
        }
        
        .product-info {
          min-width: 150px;
        }
        
        .status-select {
          min-width: 140px;
        }
        
        .notes-container {
          min-width: 120px;
        }
      }
      
      @media (max-width: 768px) {
        .card-header-with-actions {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }
        
        .status-table {
          font-size: 0.75rem;
        }
        
        .status-table th,
        .status-table td {
          padding: 0.5rem;
        }
        
        .product-name {
          font-size: 0.875rem;
        }
        
        .product-id {
          font-size: 0.6875rem;
        }
        
        .status-select,
        .notes-input {
          font-size: 0.75rem;
        }
        
        .action-buttons {
          min-width: 80px;
          gap: 0.25rem;
        }
        
        .btn-icon {
          min-width: 28px;
          height: 28px;
          padding: 0.25rem;
        }
        
        .delete-confirmation {
          flex-direction: column;
          text-align: center;
        }
        
        .warning-icon {
          align-self: center;
        }
      }
      
      @media (max-width: 640px) {
        .status-table-container {
          font-size: 0.6875rem;
        }
        
        .empty-content {
          padding: 1rem;
        }
        
        .empty-content i {
          font-size: 2rem;
        }
        
        .modal {
          width: 95%;
          margin: 1rem;
        }
      }
      
      /* Animation */
      .status-table tr {
        transition: background-color 0.2s;
      }
      
      .btn-icon {
        transition: all 0.2s;
      }
      
      .status-select,
      .notes-input {
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .status-table tbody tr {
        animation: fadeIn 0.3s ease-out;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// สร้าง instance ของ StatusTrackingController
const statusTrackingController = new StatusTrackingController();

export default statusTrackingController;