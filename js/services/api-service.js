/**
 * InfoHub 360 - Share Modal Component
 * 
 * คอมโพเนนต์สำหรับการแชร์ข้อมูลสินค้าให้กับลูกค้าผ่านช่องทางต่างๆ
 * รองรับการดึงข้อมูลสินค้าจาก API และการส่งข้อมูลไปยังช่องทางที่กำหนด
 */

class ShareModal {
  constructor() {
    // ค่าเริ่มต้น
    this.modalElement = null;
    this.productData = null;
    this.selectedMethod = null;
    this.API_ENDPOINT = 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/GetAllProducts';
    
    // binding methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleSend = this.handleSend.bind(this);
  }
  
  /**
   * เปิด Share Modal และโหลดข้อมูลสินค้า
   * @param {string} productId - รหัสสินค้าที่ต้องการแชร์
   */
  async open(productId) {
    try {
      // แสดง loading indicator
      this.showLoading();
      
      // ดึงข้อมูลสินค้าจาก API จริง
      this.productData = await this.fetchProductData(productId);
      
      // ซ่อน loading indicator
      this.hideLoading();
      
      if (!this.productData) {
        this.showToast('ไม่พบข้อมูลสินค้า', 'error');
        return;
      }
      
      // สร้าง Modal
      this.createModal();
      
      // อัพเดทข้อมูลสินค้าใน Modal
      this.updateProductInfo();
      
      // ตั้งค่า Event Listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
      this.hideLoading();
      this.showToast('ไม่สามารถโหลดข้อมูลสินค้าได้ โปรดลองใหม่อีกครั้ง', 'error');
    }
  }
  
  /**
   * ดึงข้อมูลสินค้าจาก API จริง
   * @param {string} productId - รหัสสินค้า
   * @returns {Object} - ข้อมูลสินค้า
   */
  async fetchProductData(productId) {
    try {
      // เรียกใช้ API จริงที่ให้มา
      const url = `${this.API_ENDPOINT}?product_id=${encodeURIComponent(productId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจาก API:', error);
      throw error;
    }
  }
  
  /**
   * สร้าง Loading Indicator
   */
  showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'share-modal-loading';
    loadingDiv.className = 'modal-backdrop';
    loadingDiv.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    `;
    document.body.appendChild(loadingDiv);
  }
  
  /**
   * ซ่อน Loading Indicator
   */
  hideLoading() {
    const loadingDiv = document.getElementById('share-modal-loading');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
  }
  
  /**
   * สร้าง Modal จาก Template
   */
  createModal() {
    // ค้นหา Modal Template
    const modalTemplate = document.getElementById('share-modal-template');
    if (!modalTemplate) {
      console.error('ไม่พบ Share Modal Template');
      return;
    }
    
    // สร้าง Modal element
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'share-modal';
    this.modalElement.className = 'modal-backdrop';
    this.modalElement.style.display = 'flex';
    this.modalElement.innerHTML = modalTemplate.innerHTML;
    
    // เพิ่ม Modal ไปยัง body
    document.body.appendChild(this.modalElement);
  }
  
  /**
   * อัพเดทข้อมูลสินค้าใน Modal
   */
  updateProductInfo() {
    if (!this.modalElement || !this.productData) return;
    
    // อัพเดทชื่อสินค้า
    const productNameElement = this.modalElement.querySelector('#product-name');
    if (productNameElement && this.productData.product_name) {
      productNameElement.textContent = this.productData.product_name;
    }
    
    // อัพเดทรหัสสินค้า
    const productCodeElement = this.modalElement.querySelector('#product-code');
    if (productCodeElement && this.productData.product_id) {
      productCodeElement.textContent = `รหัสสินค้า: ${this.productData.product_id}`;
    }
    
    // อัพเดทราคา
    const productPriceElement = this.modalElement.querySelector('#product-price');
    if (productPriceElement && this.productData.price) {
      productPriceElement.textContent = `฿${Number(this.productData.price).toLocaleString()}`;
    }
    
    // อัพเดทรูปภาพ
    const productImageElement = this.modalElement.querySelector('#product-image');
    if (productImageElement && this.productData.imgurl) {
      productImageElement.style.backgroundImage = `url('${this.productData.imgurl}')`;
      productImageElement.style.backgroundSize = 'cover';
      productImageElement.style.backgroundPosition = 'center';
    }
    
    // อัพเดทสถานะสต๊อก (ถ้ามี)
    if (this.productData.stock !== undefined) {
      // สร้างหรือค้นหา element ที่แสดงสถานะสต๊อก
      let stockStatusElement = this.modalElement.querySelector('#stock-status');
      if (!stockStatusElement) {
        stockStatusElement = document.createElement('p');
        stockStatusElement.id = 'stock-status';
        stockStatusElement.className = 'stock-status';
        // เพิ่มเข้าไปในส่วนของข้อมูลสินค้า
        this.modalElement.querySelector('.preview-header > div').appendChild(stockStatusElement);
      }
      
      // กำหนดสถานะและสี
      const stockStatus = this.productData.stock > 0 ? 'มีสินค้า' : 'สินค้าหมด';
      const stockClass = this.productData.stock > 0 ? 'in-stock' : 'out-of-stock';
      
      stockStatusElement.innerHTML = `
        <span class="${stockClass}">${stockStatus}</span>
        <span class="stock-count">(เหลือ ${this.productData.stock} เครื่อง)</span>
      `;
    }
    
    // อัพเดทหมวดหมู่ (ถ้ามี)
    if (this.productData.category_name) {
      let categoryElement = this.modalElement.querySelector('#product-category');
      if (!categoryElement) {
        categoryElement = document.createElement('p');
        categoryElement.id = 'product-category';
        categoryElement.className = 'product-category';
        // เพิ่มเข้าไปในส่วนของข้อมูลสินค้า
        this.modalElement.querySelector('.preview-header > div').appendChild(categoryElement);
      }
      
      categoryElement.textContent = `หมวดหมู่: ${this.productData.category_name}`;
    }
  }
  
  /**
   * ตั้งค่า Event Listeners
   */
  setupEventListeners() {
    if (!this.modalElement) return;
    
    // ปุ่มปิด Modal
    const closeButtons = this.modalElement.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', this.close);
    });
    
    // ปุ่มส่งข้อมูล
    const sendButton = this.modalElement.querySelector('#sendDocuments');
    if (sendButton) {
      sendButton.addEventListener('click', this.handleSend);
    }
    
    // ช่องทางการส่ง
    const shareMethods = this.modalElement.querySelectorAll('.share-method');
    shareMethods.forEach(method => {
      method.addEventListener('click', (event) => {
        this.selectShareMethod(event.currentTarget.getAttribute('data-method'));
      });
    });
  }
  
  /**
   * เลือกช่องทางการส่ง
   * @param {string} methodType - ประเภทของช่องทางการส่ง (line, email, sms, qr)
   */
  selectShareMethod(methodType) {
    if (!this.modalElement) return;
    
    // บันทึกช่องทางที่เลือก
    this.selectedMethod = methodType;
    
    // ล้างการเลือกช่องทางทั้งหมด
    const shareMethods = this.modalElement.querySelectorAll('.share-method');
    shareMethods.forEach(method => {
      method.classList.remove('selected');
    });
    
    // เลือกช่องทางที่คลิก
    const selectedMethod = this.modalElement.querySelector(`.share-method[data-method="${methodType}"]`);
    if (selectedMethod) {
      selectedMethod.classList.add('selected');
    }
  }
  
  /**
   * ปิด Modal
   */
  close() {
    if (this.modalElement) {
      // เพิ่ม class fade-out animation
      this.modalElement.classList.add('fade-out');
      
      // รอให้ animation เสร็จก่อนลบ element
      setTimeout(() => {
        document.body.removeChild(this.modalElement);
        this.modalElement = null;
        this.productData = null;
        this.selectedMethod = null;
      }, 300);
    }
  }
  
  /**
   * จัดการการส่งข้อมูล
   */
  async handleSend() {
    if (!this.modalElement || !this.productData) return;
    
    // ตรวจสอบว่าเลือกลูกค้าหรือไม่
    const customerSelect = this.modalElement.querySelector('#customer-select');
    const customerContact = this.modalElement.querySelector('#customer-contact');
    
    let recipient = '';
    let recipientId = '';
    
    if (customerSelect && customerSelect.value) {
      recipientId = customerSelect.value;
      recipient = customerSelect.options[customerSelect.selectedIndex].text;
    } else if (customerContact && customerContact.value) {
      recipient = customerContact.value;
    } else {
      this.showToast('กรุณาเลือกหรือระบุลูกค้าที่ต้องการส่งข้อมูล', 'error');
      return;
    }
    
    // ตรวจสอบว่าเลือกช่องทางการส่งหรือไม่
    if (!this.selectedMethod) {
      this.showToast('กรุณาเลือกช่องทางการส่งข้อมูล', 'error');
      return;
    }
    
    // รวบรวมข้อมูลที่เลือก
    const sharedData = this.gatherSharedData();
    
    // สร้างข้อมูลสำหรับส่งไปยัง API
    const shareRequest = {
      productId: this.productData.product_id,
      recipientId: recipientId,
      recipientContact: recipient,
      shareMethod: this.selectedMethod,
      sharedData: sharedData,
      message: this.modalElement.querySelector('#custom-message').value,
      timestamp: new Date().toISOString()
    };
    
    try {
      // แสดง loading
      this.showLoading();
      
      // จำลองการส่งข้อมูล (ในกรณีจริงจะส่งไปยัง API)
      console.log('ส่งข้อมูล:', shareRequest);
      
      // จำลองการรอการตอบกลับ
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ซ่อน loading
      this.hideLoading();
      
      // แสดงข้อความสำเร็จ
      this.showToast(`ส่งข้อมูลสินค้า ${this.productData.product_name} ให้ ${recipient} ทาง ${this.getMethodName(this.selectedMethod)} เรียบร้อยแล้ว`, 'success');
      
      // ปิด Modal
      this.close();
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งข้อมูล:', error);
      this.hideLoading();
      this.showToast('ไม่สามารถส่งข้อมูลได้ โปรดลองใหม่อีกครั้ง', 'error');
    }
  }
  
  /**
   * รวบรวมข้อมูลที่เลือกเพื่อส่ง
   * @returns {Object} - ข้อมูลที่เลือก
   */
  gatherSharedData() {
    if (!this.modalElement) return {};
    
    const sharedData = {
      documents: [],
      info: []
    };
    
    // ตรวจสอบเอกสารที่เลือก
    const documentCheckboxes = this.modalElement.querySelectorAll('#document-options input[type="checkbox"]');
    documentCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        sharedData.documents.push(checkbox.id);
      }
    });
    
    // ตรวจสอบข้อมูลราคาและสต๊อกที่เลือก
    if (this.modalElement.querySelector('#price')?.checked) {
      sharedData.info.push('price');
    }
    
    if (this.modalElement.querySelector('#stock')?.checked) {
      sharedData.info.push('stock');
    }
    
    if (this.modalElement.querySelector('#delivery')?.checked) {
      sharedData.info.push('delivery');
    }
    
    if (this.modalElement.querySelector('#warranty')?.checked) {
      sharedData.info.push('warranty');
    }
    
    return sharedData;
  }
  
  /**
   * แปลงชื่อช่องทางการส่ง
   * @param {string} methodType - ประเภทช่องทางการส่ง
   * @returns {string} - ชื่อช่องทางการส่งที่แสดงผล
   */
  getMethodName(methodType) {
    const methodNames = {
      'line': 'LINE',
      'email': 'อีเมล',
      'sms': 'SMS',
      'qr': 'QR Code'
    };
    
    return methodNames[methodType] || methodType;
  }
  
  /**
   * แสดง Toast notification
   * @param {string} message - ข้อความที่ต้องการแสดง
   * @param {string} type - ประเภทของ toast (success, error, info)
   */
  showToast(message, type = 'info') {
    // ตรวจสอบว่ามี toast-container หรือไม่
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // สร้าง toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // เลือกไอคอนตามประเภท
    let icon = 'info-circle';
    if (type === 'success') {
      icon = 'check-circle';
    } else if (type === 'error') {
      icon = 'exclamation-circle';
    }
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="toast-content">
        <p>${message}</p>
      </div>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // เพิ่ม toast ไปยัง container
    toastContainer.appendChild(toast);
    
    // ตั้งค่า event listener สำหรับปุ่มปิด
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    });
    
    // ตั้งเวลาลบ toast
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }
}

// ตั้งค่า event listener เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
  // สร้าง instance ของ ShareModal
  const shareModal = new ShareModal();
  
  // ตั้งค่า event listener สำหรับปุ่มแชร์สินค้า
  const shareButtons = document.querySelectorAll('.share-product');
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      shareModal.open(productId);
    });
  });
  
  // ทดสอบการเรียกใช้ ShareModal (ถ้าต้องการ)
  // window.testShareModal = (productId) => {
  //   shareModal.open(productId);
  // }
});

export default ShareModal;