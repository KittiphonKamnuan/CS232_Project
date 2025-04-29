/**
 * mockup-service.js
 * บริการจำลองข้อมูลสำหรับใช้แทน API ที่เชื่อมต่อกับ DynamoDB
 * ใช้สำหรับการพัฒนาในขณะที่ backend ยังไม่พร้อมใช้งาน
 */

import mockupData from './mockup-data.js';

class MockupService {
  constructor() {
    this.data = mockupData;
    this.delay = 500; // จำลองการหน่วงเวลาเหมือนเรียก API จริง (milliseconds)
  }

  /**
   * สร้างการหน่วงเวลาจำลองการเรียก API จริง
   * @param {number} ms - เวลาหน่วงเป็นมิลลิวินาที
   * @returns {Promise} - Promise ที่จะ resolve หลังจากเวลาที่กำหนด
   */
  async simulateDelay(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * จำลองการเกิด error ในบาง case เพื่อทดสอบการจัดการข้อผิดพลาด
   * @param {number} errorRate - อัตราการเกิด error (0-1)
   * @returns {boolean} - true ถ้าควรคืน error, false ถ้าไม่
   */
  shouldReturnError(errorRate = 0.1) {
    return Math.random() < errorRate;
  }

  /**
   * ดึงข้อมูลสินค้าทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลสินค้าทั้งหมด
   */
  async getProducts(filters = {}) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
    }

    let products = [...this.data.products];

    // จำลองการกรองข้อมูล
    if (filters.category) {
      products = products.filter(product => product.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.id.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    return products;
  }

  /**
   * ดึงข้อมูลสินค้าตาม ID
   * @param {string} productId - รหัสสินค้า
   * @returns {Promise<Object>} - ข้อมูลสินค้า
   */
  async getProductById(productId) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error(`ไม่สามารถดึงข้อมูลสินค้ารหัส ${productId} ได้`);
    }

    const product = this.data.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(`ไม่พบสินค้ารหัส ${productId}`);
    }

    return product;
  }

  /**
   * ดึงข้อมูลลูกค้าทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลลูกค้าทั้งหมด
   */
  async getCustomers(filters = {}) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error('ไม่สามารถดึงข้อมูลลูกค้าได้');
    }

    let customers = [...this.data.customers];

    // จำลองการกรองข้อมูล
    if (filters.status) {
      customers = customers.filter(customer => customer.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(filters.search) ||
        customer.email.toLowerCase().includes(searchLower)
      );
    }

    return customers;
  }

  /**
   * ดึงข้อมูลลูกค้าตาม ID
   * @param {string} customerId - รหัสลูกค้า
   * @returns {Promise<Object>} - ข้อมูลลูกค้า
   */
  async getCustomerById(customerId) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error(`ไม่สามารถดึงข้อมูลลูกค้ารหัส ${customerId} ได้`);
    }

    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) {
      throw new Error(`ไม่พบลูกค้ารหัส ${customerId}`);
    }

    return customer;
  }

  /**
   * ดึงข้อมูลการขายทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลการขายทั้งหมด
   */
  async getSales(filters = {}) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error('ไม่สามารถดึงข้อมูลการขายได้');
    }

    let sales = [...this.data.sales];

    // จำลองการกรองข้อมูล
    if (filters.status) {
      sales = sales.filter(sale => sale.status === filters.status);
    }

    if (filters.customerId) {
      sales = sales.filter(sale => sale.customerId === filters.customerId);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      sales = sales.filter(sale => new Date(sale.date) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      sales = sales.filter(sale => new Date(sale.date) <= toDate);
    }

    return sales;
  }

  /**
   * ดึงข้อมูลการขายตาม ID
   * @param {string} saleId - รหัสการขาย
   * @returns {Promise<Object>} - ข้อมูลการขาย
   */
  async getSaleById(saleId) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error(`ไม่สามารถดึงข้อมูลการขายรหัส ${saleId} ได้`);
    }

    const sale = this.data.sales.find(s => s.id === saleId);
    if (!sale) {
      throw new Error(`ไม่พบการขายรหัส ${saleId}`);
    }

    return sale;
  }

  /**
   * ดึงข้อมูลเอกสารทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลเอกสารทั้งหมด
   */
  async getDocuments(filters = {}) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error('ไม่สามารถดึงข้อมูลเอกสารได้');
    }

    let documents = [...this.data.documents];

    // จำลองการกรองข้อมูล
    if (filters.type) {
      documents = documents.filter(doc => doc.type === filters.type);
    }

    if (filters.customerId) {
      documents = documents.filter(doc => doc.customer === filters.customerId);
    }

    if (filters.productId) {
      documents = documents.filter(doc => 
        doc.relatedProducts && doc.relatedProducts.includes(filters.productId)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.id.toLowerCase().includes(searchLower)
      );
    }

    return documents;
  }

  /**
   * ดึงข้อมูลเอกสารตาม ID
   * @param {string} documentId - รหัสเอกสาร
   * @returns {Promise<Object>} - ข้อมูลเอกสาร
   */
  async getDocumentById(documentId) {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error(`ไม่สามารถดึงข้อมูลเอกสารรหัส ${documentId} ได้`);
    }

    const document = this.data.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error(`ไม่พบเอกสารรหัส ${documentId}`);
    }

    return document;
  }

  /**
   * ดึงข้อมูลสถิติและรายงาน
   * @returns {Promise<Object>} - ข้อมูลสถิติและรายงาน
   */
  async getStatistics() {
    await this.simulateDelay();

    if (this.shouldReturnError(0.05)) {
      throw new Error('ไม่สามารถดึงข้อมูลสถิติได้');
    }

    return this.data.statistics;
  }

  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   * @returns {Promise<Object>} - ข้อมูลผู้ใช้ปัจจุบัน
   */
  async getCurrentUser() {
    await this.simulateDelay();

    if (this.shouldReturnError(0.01)) {
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }

    return this.data.user;
  }
}

// สร้าง instance ของ MockupService สำหรับนำไปใช้ในแอปพลิเคชัน
const mockupService = new MockupService();

export default mockupService;