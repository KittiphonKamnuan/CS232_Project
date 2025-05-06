/**
 * InfoHub 360 - Data Service
 * 
 * บริการจัดการข้อมูลหลักของแอปพลิเคชันโดยใช้ API Gateway
 * สำหรับการจัดเก็บข้อมูลสินค้า, ลูกค้า, การขาย และเอกสาร
 */

import { AWS_REGION } from '../config/aws-config.js';

// กำหนด API Endpoints
const API_ENDPOINTS = {
  PRODUCTS: 'https://s9ohxtt51a.execute-api.us-east-1.amazonaws.com/GetProducts'
};

class DataService {
  constructor() {
    // ไม่จำเป็นต้องสร้าง DynamoDB client อีกต่อไป เนื่องจากใช้ API Gateway แทน
  }
  
  /**
   * ===================================
   * PRODUCTS API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลสินค้าทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลสินค้าทั้งหมด
   */
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const url =
        queryParams.toString().length > 0
          ? `${API_ENDPOINTS.PRODUCTS}?${queryParams}`
          : `${API_ENDPOINTS.PRODUCTS}?product_id=TV-SAM-QN90C-55`; // fallback test product
  
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
  
      if (Array.isArray(data)) {
        return data.map(p => this._formatProduct(p));
      } else if (typeof data === 'object') {
        return [this._formatProduct(data)];
      }
      return [];
    } catch (err) {
      console.error('Error loading products:', err);
      throw err;
    }
  }
  
  
  /**
   * ค้นหาสินค้าด้วย parameters ต่างๆ
   * @param {Object} searchParams - พารามิเตอร์ในการค้นหา
   * @returns {Promise<Array>} - รายการสินค้าที่ค้นพบ
   */
  async searchProducts(searchParams) {
    // ใช้ method getProducts โดยส่ง searchParams เป็น filters
    return this.getProducts(searchParams);
  }
  
  /**
   * ดึงข้อมูลสินค้าตาม ID
   * @param {string} productId - รหัสสินค้า
   * @returns {Promise<Object>} - ข้อมูลสินค้า
   */
  async getProductById(productId) {
    try {
      const url = `${API_ENDPOINTS.PRODUCTS}?product_id=${encodeURIComponent(productId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return this._formatProduct(data);
    } catch (err) {
      console.error('Error loading product by ID:', err);
      throw err;
    }
  }
  
  /**
   * ===================================
   * CUSTOMERS API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลลูกค้าทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลลูกค้าทั้งหมด
   */
  async getCustomers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.CUSTOMERS}?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading customers:', err);
      throw err;
    }
  }
  
  /**
   * ดึงข้อมูลลูกค้าตาม ID
   * @param {string} customerId - รหัสลูกค้า
   * @returns {Promise<Object>} - ข้อมูลลูกค้า
   */
  async getCustomerById(customerId) {
    try {
      const url = `${API_ENDPOINTS.CUSTOMERS}/${encodeURIComponent(customerId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading customer by ID:', err);
      throw err;
    }
  }
  
  /**
   * ===================================
   * SALES API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลการขายทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลการขายทั้งหมด
   */
  async getSales(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.SALES}?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading sales:', err);
      throw err;
    }
  }
  
  /**
   * ดึงข้อมูลการขายตาม ID
   * @param {string} saleId - รหัสการขาย
   * @returns {Promise<Object>} - ข้อมูลการขาย
   */
  async getSaleById(saleId) {
    try {
      const url = `${API_ENDPOINTS.SALES}/${encodeURIComponent(saleId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading sale by ID:', err);
      throw err;
    }
  }
  
  /**
   * ===================================
   * DOCUMENTS API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลเอกสารทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - ข้อมูลเอกสารทั้งหมด
   */
  async getDocuments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_ENDPOINTS.DOCUMENTS}?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading documents:', err);
      throw err;
    }
  }
  
  /**
   * ดึงข้อมูลเอกสารตาม ID
   * @param {string} documentId - รหัสเอกสาร
   * @returns {Promise<Object>} - ข้อมูลเอกสาร
   */
  async getDocumentById(documentId) {
    try {
      const url = `${API_ENDPOINTS.DOCUMENTS}/${encodeURIComponent(documentId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error loading document by ID:', err);
      throw err;
    }
  }
  
  /**
   * ===================================
   * DASHBOARD & REPORTS
   * ===================================
   */
  
  /**
   * ดึงข้อมูลสำหรับ Dashboard
   * @returns {Promise<Object>} - ข้อมูล Dashboard
   */
  async getStatistics() {
    try {
      // ยังคงใช้ข้อมูลจำลองไปก่อน จนกว่าจะมี API จริง
      // ในระบบจริงควรมี API ที่คำนวณและส่งข้อมูลสถิติกลับมา
      
      // ดึงข้อมูลการขาย
      const sales = await this.getSales();
      
      // ดึงข้อมูลลูกค้า
      const customers = await this.getCustomers();
      
      // ดึงข้อมูลสินค้า
      const products = await this.getProducts();
      
      // คำนวณข้อมูลสถิติ (ตัวอย่าง)
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // คำนวณยอดขายในเดือนปัจจุบัน
      const currentMonthSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= firstDayOfMonth;
      });
      
      // คำนวณยอดขายรวม
      const totalSalesAmount = currentMonthSales.reduce((total, sale) => {
        return total + (sale.total || 0);
      }, 0);
      
      // คำนวณจำนวนการขาย
      const totalSalesCount = currentMonthSales.length;
      
      // สร้างข้อมูลสถิติ
      const statistics = {
        salesOverview: {
          totalSales: totalSalesCount,
          totalAmount: totalSalesAmount,
          targetAmount: 400000, // ตั้งค่าเป้าหมายตามความเหมาะสม
          completionRate: Math.round((totalSalesAmount / 400000) * 100),
          averageOrderValue: totalSalesCount > 0 ? Math.round(totalSalesAmount / totalSalesCount) : 0,
          conversionRate: 75 // ตัวเลขตัวอย่าง
        },
        // ข้อมูลสถิติอื่นๆ
        salesByMonth: [
          // ตัวอย่างข้อมูล
          { month: "ม.ค.", amount: 28500 },
          { month: "ก.พ.", amount: 47500 },
          { month: "มี.ค.", amount: 82500 },
          { month: "เม.ย.", amount: 184000 },
          { month: "พ.ค.", amount: totalSalesAmount },
          { month: "มิ.ย.", amount: 0 },
          { month: "ก.ค.", amount: 0 },
          { month: "ส.ค.", amount: 0 },
          { month: "ก.ย.", amount: 0 },
          { month: "ต.ค.", amount: 0 },
          { month: "พ.ย.", amount: 0 },
          { month: "ธ.ค.", amount: 0 }
        ],
        // ข้อมูลอื่นๆ ตามต้องการ
        salesPipeline: [
          { status: "สอบถามข้อมูล", count: 5, amount: 123500 },
          { status: "ลูกค้าสนใจ", count: 3, amount: 72000 },
          { status: "ส่งใบเสนอราคา", count: 4, amount: 98000 },
          { status: "ต่อรองราคา", count: 2, amount: 62000 },
          { status: "ยืนยันการสั่งซื้อ", count: 3, amount: 95000 },
          { status: "ส่งมอบสินค้า", count: 1, amount: 45990 },
          { status: "บริการหลังการขาย", count: 1, amount: 38000 }
        ],
        // สินค้าขายดี
        topProducts: this._calculateTopProducts(products, sales)
      };
      
      return statistics;
    } catch (error) {
      console.error('Error generating statistics:', error);
      throw error;
    }
  }
  
  _formatProduct(apiProduct) {
    return {
      id: apiProduct.product_id,
      name: apiProduct.product_name,
      category: apiProduct.category_name,
      brand: apiProduct.brand || 'Samsung',
      model: apiProduct.model || apiProduct.product_id.split('-')[2] || '',
      description: apiProduct.description || `${apiProduct.product_name} คุณภาพสูง`,
      specs: apiProduct.specs || {},
      price: Number(apiProduct.price),
      originalPrice: apiProduct.originalPrice ? Number(apiProduct.originalPrice) : Number(apiProduct.price),
      discount: apiProduct.discount || 0,
      stock: apiProduct.stock,
      images: apiProduct.imgurl ? [apiProduct.imgurl] : ['/assets/images/product-images/default.jpg'],
      delivery: {
        status: apiProduct.stock > 0 ? "available" : "unavailable",
        estimatedDays: apiProduct.stock > 0 ? "1-3 วัน" : "สินค้าหมด"
      },
      documents: apiProduct.documents || {
        specs: `${apiProduct.product_id}-specs.pdf`,
        manual: `${apiProduct.product_id}-manual.pdf`
      },
      warranty: apiProduct.warranty || "รับประกัน 1 ปี โดยผู้ผลิต"
    };
  }  

  /**
   * คำนวณสินค้าขายดี
   * @private
   * @param {Array} products - รายการสินค้าทั้งหมด
   * @param {Array} sales - รายการขายทั้งหมด
   * @returns {Array} - รายการสินค้าขายดี
   */
  _calculateTopProducts(products, sales) {
    // สร้าง map เพื่อนับยอดขายของแต่ละสินค้า
    const productSalesMap = {};
    
    // วนลูปรายการขายทั้งหมด
    sales.forEach(sale => {
      // วนลูปรายการสินค้าในแต่ละการขาย
      (sale.items || []).forEach(item => {
        const productId = item.productId;
        
        // ถ้ายังไม่มีข้อมูลสินค้านี้ ให้สร้างใหม่
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            count: 0,
            amount: 0
          };
        }
        
        // เพิ่มจำนวนและยอดขาย
        productSalesMap[productId].count += item.quantity || 1;
        productSalesMap[productId].amount += (item.price * item.quantity) || 0;
      });
    });
    
    // แปลงเป็นอาร์เรย์และเรียงลำดับ
    const topSellingProducts = Object.keys(productSalesMap)
      .map(productId => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product ? product.name : 'Unknown Product',
          unitsSold: productSalesMap[productId].count,
          revenue: productSalesMap[productId].amount,
          profitMargin: 20 // ตั้งค่าเริ่มต้น
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5); // เลือก 5 อันดับแรก
    
    return topSellingProducts;
  }
  
  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   * @returns {Promise<Object>} - ข้อมูลผู้ใช้ปัจจุบัน
   */
  async getCurrentUser() {
    // ในระบบจริงควรดึงข้อมูลจาก session หรือ token
    // สำหรับตอนนี้ส่งข้อมูลตัวอย่างกลับไป
    return {
      id: "USER001",
      username: "somchai",
      firstName: "สมชาย",
      lastName: "ใจดี",
      email: "somchai@example.com",
      phone: "081-234-5678",
      position: "พนักงานขาย",
      department: "ฝ่ายขายอิเล็กทรอนิกส์",
      avatar: null,
      joinDate: "2566-10-15",
      permissions: ["view_products", "view_customers", "edit_customers", "view_sales", "edit_sales", "view_documents"]
    };
  }
}

// สร้าง instance ของ DataService
const dataService = new DataService();
export default dataService;