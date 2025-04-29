/**
 * InfoHub 360 - API Service
 * 
 * บริการเชื่อมต่อกับ API Gateway ที่เรียกใช้ AWS Lambda Functions
 * ใช้สำหรับการดึงข้อมูลและส่งข้อมูลไปยังระบบหลังบ้านอย่างปลอดภัย
 */

import { AWS_REGION } from './aws-config.js';

class ApiService {
  constructor() {
    // ตั้งค่า API Endpoints
    this.API_URL = 'https://api.example.com/infohub360/v1'; // เปลี่ยนเป็น URL ของ API Gateway ของคุณ
    this.API_KEY = ''; // API Key (ถ้ามี)
    
    // ตรวจสอบว่ามี Token หรือไม่
    this.authToken = sessionStorage.getItem('infohub_auth');
  }
  
  /**
   * ตั้งค่า Auth Token
   * @param {string} token - JWT Token สำหรับการยืนยันตัวตน
   */
  setAuthToken(token) {
    this.authToken = token;
    sessionStorage.setItem('infohub_auth', token);
  }
  
  /**
   * ล้าง Auth Token
   */
  clearAuthToken() {
    this.authToken = null;
    sessionStorage.removeItem('infohub_auth');
  }
  
  /**
   * สร้าง Headers สำหรับ request
   * @param {boolean} includeAuth - ใส่ Auth Token หรือไม่
   * @returns {Headers} - Headers object
   */
  _createHeaders(includeAuth = true) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // เพิ่ม API Key (ถ้ามี)
    if (this.API_KEY) {
      headers.append('x-api-key', this.API_KEY);
    }
    
    // เพิ่ม Auth Token (ถ้ามี)
    if (includeAuth && this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }
    
    return headers;
  }
  
  /**
   * ส่ง Request ไปยัง API
   * @param {string} endpoint - Endpoint ที่ต้องการเรียก (ไม่รวม Base URL)
   * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
   * @param {Object} data - ข้อมูลที่ต้องการส่ง (สำหรับ POST และ PUT)
   * @param {boolean} requiresAuth - ต้องการ Auth Token หรือไม่
   * @returns {Promise} - Promise ที่ resolve เป็น response data
   */
  async _makeRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${this.API_URL}/${endpoint}`;
    const headers = this._createHeaders(requiresAuth);
    
    const options = {
      method: method,
      headers: headers,
      mode: 'cors'
    };
    
    // เพิ่ม body สำหรับ POST, PUT
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      // ตรวจสอบสถานะ response
      if (!response.ok) {
        // ถ้าเป็น 401 Unauthorized, ให้ล้าง token และนำทางไปหน้า login
        if (response.status === 401) {
          this.clearAuthToken();
          window.location.href = 'login.html';
          throw new Error('การยืนยันตัวตนหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        }
        
        // ข้อผิดพลาดอื่นๆ
        const errorData = await response.json();
        throw new Error(errorData.message || `เกิดข้อผิดพลาด: ${response.status}`);
      }
      
      // ส่งคืนข้อมูล
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }
  
  /**
   * API Endpoints สำหรับผลิตภัณฑ์
   */
  
  // ดึงรายการสินค้าทั้งหมดหรือค้นหา
  async getProducts(searchParams = {}) {
    let queryString = '';
    
    // สร้าง query string จาก parameters
    if (Object.keys(searchParams).length > 0) {
      queryString = '?' + new URLSearchParams(searchParams).toString();
    }
    
    return await this._makeRequest(`products${queryString}`);
  }
  
  // ดึงข้อมูลสินค้าตาม ID
  async getProductById(productId) {
    return await this._makeRequest(`products/${productId}`);
  }
  
  // เพิ่มสินค้าใหม่
  async createProduct(productData) {
    return await this._makeRequest('products', 'POST', productData);
  }
  
  // อัปเดตข้อมูลสินค้า
  async updateProduct(productId, productData) {
    return await this._makeRequest(`products/${productId}`, 'PUT', productData);
  }
  
  // ลบสินค้า
  async deleteProduct(productId) {
    return await this._makeRequest(`products/${productId}`, 'DELETE');
  }
  
  /**
   * API Endpoints สำหรับลูกค้า
   */
  
  // ดึงรายการลูกค้าทั้งหมดหรือค้นหา
  async getCustomers(searchParams = {}) {
    let queryString = '';
    
    if (Object.keys(searchParams).length > 0) {
      queryString = '?' + new URLSearchParams(searchParams).toString();
    }
    
    return await this._makeRequest(`customers${queryString}`);
  }
  
  // ดึงข้อมูลลูกค้าตาม ID
  async getCustomerById(customerId) {
    return await this._makeRequest(`customers/${customerId}`);
  }
  
  // เพิ่มลูกค้าใหม่
  async createCustomer(customerData) {
    return await this._makeRequest('customers', 'POST', customerData);
  }
  
  // อัปเดตข้อมูลลูกค้า
  async updateCustomer(customerId, customerData) {
    return await this._makeRequest(`customers/${customerId}`, 'PUT', customerData);
  }
  
  // ลบลูกค้า
  async deleteCustomer(customerId) {
    return await this._makeRequest(`customers/${customerId}`, 'DELETE');
  }
  
  /**
   * API Endpoints สำหรับการขาย
   */
  
  // ดึงรายการขาย
  async getSales(searchParams = {}) {
    let queryString = '';
    
    if (Object.keys(searchParams).length > 0) {
      queryString = '?' + new URLSearchParams(searchParams).toString();
    }
    
    return await this._makeRequest(`sales${queryString}`);
  }
  
  // ดึงข้อมูลการขายตาม ID
  async getSaleById(saleId) {
    return await this._makeRequest(`sales/${saleId}`);
  }
  
  // สร้างการขายใหม่
  async createSale(saleData) {
    return await this._makeRequest('sales', 'POST', saleData);
  }
  
  // อัปเดตข้อมูลการขาย
  async updateSale(saleId, saleData) {
    return await this._makeRequest(`sales/${saleId}`, 'PUT', saleData);
  }
  
  // ลบการขาย
  async deleteSale(saleId) {
    return await this._makeRequest(`sales/${saleId}`, 'DELETE');
  }
  
  /**
   * API Endpoints สำหรับ Dashboard และรายงาน
   */
  
  // ดึงข้อมูลภาพรวมสำหรับ Dashboard
  async getDashboardData() {
    return await this._makeRequest('dashboard');
  }
  
  // ดึงรายงานการขายตามช่วงเวลา
  async getSalesReport(startDate, endDate) {
    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }).toString();
    
    return await this._makeRequest(`reports/sales?${queryParams}`);
  }
  
  // ดึงรายงานสินค้าขายดี
  async getTopSellingProducts(period = 'month', limit = 10) {
    const queryParams = new URLSearchParams({
      period: period,
      limit: limit
    }).toString();
    
    return await this._makeRequest(`reports/products/top-selling?${queryParams}`);
  }
  
  /**
   * API Endpoints สำหรับผู้ใช้งาน
   */
  
  // เข้าสู่ระบบ
  async login(username, password) {
    const loginData = {
      username: username,
      password: password
    };
    
    const response = await this._makeRequest('auth/login', 'POST', loginData, false);
    
    // เก็บ token เมื่อเข้าสู่ระบบสำเร็จ
    if (response && response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }
  
  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  async getCurrentUser() {
    return await this._makeRequest('users/me');
  }
  
  // อัปเดตข้อมูลผู้ใช้
  async updateUser(userData) {
    return await this._makeRequest('users/me', 'PUT', userData);
  }
  
  // เปลี่ยนรหัสผ่าน
  async changePassword(currentPassword, newPassword) {
    const passwordData = {
      currentPassword: currentPassword,
      newPassword: newPassword
    };
    
    return await this._makeRequest('users/me/password', 'PUT', passwordData);
  }
  
  // ออกจากระบบ
  logout() {
    this.clearAuthToken();
    // นำทางกลับไปยังหน้าเข้าสู่ระบบ
    window.location.href = 'login.html';
  }
}

// สร้าง singleton instance
const apiService = new ApiService();
export default apiService;