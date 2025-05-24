/**
 * InfoHub 360 - Data Service
 * 
 * บริการจัดการข้อมูลหลักของแอปพลิเคชันโดยใช้ API Gateway
 * สำหรับการจัดเก็บข้อมูลสินค้า, ลูกค้า, การขาย และเอกสาร
 * อัปเดต: ใช้ข้อมูลจริงจาก API เท่านั้น
 */

import { AWS_REGION } from '../config/aws-config.js';

// กำหนด API Endpoints
const API_ENDPOINTS = {
  PRODUCTS: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/GetAllProducts',
  CUSTOMERS: 'https://api.infohub360.com/customers', // จะต้องเพิ่ม endpoint จริงในอนาคต
  SALES: 'https://api.infohub360.com/sales', // จะต้องเพิ่ม endpoint จริงในอนาคต
  DOCUMENTS: 'https://api.infohub360.com/documents' // จะต้องเพิ่ม endpoint จริงในอนาคต
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
      const url = queryParams.toString().length > 0
        ? `${API_ENDPOINTS.PRODUCTS}?${queryParams}`
        : API_ENDPOINTS.PRODUCTS;
  
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: HTTP ${response.status}`);
      }
      
      const data = await response.json();
  
      if (Array.isArray(data)) {
        return data.map(p => this._formatProduct(p));
      } else if (typeof data === 'object' && data !== null) {
        return [this._formatProduct(data)];
      }
      
      return [];
    } catch (err) {
      console.error('Error loading products:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  /**
   * ค้นหาสินค้าด้วย parameters ต่างๆ
   * @param {Object} searchParams - พารามิเตอร์ในการค้นหา
   * @returns {Promise<Array>} - รายการสินค้าที่ค้นพบ
   */
  async searchProducts(searchParams) {
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data) {
        throw new Error('ไม่พบข้อมูลสินค้า');
      }
      
      return this._formatProduct(data);
    } catch (err) {
      console.error('Error loading product by ID:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาตรวจสอบรหัสสินค้าและลองใหม่อีกครั้ง');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading customers:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลลูกค้าได้ ระบบอยู่ระหว่างการพัฒนา');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customer: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading customer by ID:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลลูกค้าได้ ระบบอยู่ระหว่างการพัฒนา');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sales: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading sales:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลการขายได้ ระบบอยู่ระหว่างการพัฒนา');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sale: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading sale by ID:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลการขายได้ ระบบอยู่ระหว่างการพัฒนา');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading documents:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลเอกสารได้ ระบบอยู่ระหว่างการพัฒนา');
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error loading document by ID:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลเอกสารได้ ระบบอยู่ระหว่างการพัฒนา');
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
      // ดึงข้อมูลจริงจาก API
      const [sales, customers, products] = await Promise.allSettled([
        this.getSales(),
        this.getCustomers(),
        this.getProducts()
      ]);
      
      // จัดการกับข้อมูลที่อาจจะโหลดไม่สำเร็จ
      const salesData = sales.status === 'fulfilled' ? sales.value : [];
      const customersData = customers.status === 'fulfilled' ? customers.value : [];
      const productsData = products.status === 'fulfilled' ? products.value : [];
      
      // คำนวณข้อมูลสถิติจากข้อมูลจริง
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // คำนวณยอดขายในเดือนปัจจุบัน
      const currentMonthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date || sale.created_at);
        return saleDate >= firstDayOfMonth;
      });
      
      // คำนวณยอดขายรวม
      const totalSalesAmount = currentMonthSales.reduce((total, sale) => {
        return total + (parseFloat(sale.total) || parseFloat(sale.amount) || 0);
      }, 0);
      
      // คำนวณจำนวนการขาย
      const totalSalesCount = currentMonthSales.length;
      
      // คำนวณค่าเฉลี่ยต่อการขาย
      const averageOrderValue = totalSalesCount > 0 ? Math.round(totalSalesAmount / totalSalesCount) : 0;
      
      // สร้างข้อมูลสถิติจากข้อมูลจริง
      const statistics = {
        salesOverview: {
          totalSales: totalSalesCount,
          totalAmount: totalSalesAmount,
          averageOrderValue: averageOrderValue,
          totalProducts: productsData.length,
          totalCustomers: customersData.length
        },
        
        // คำนวณสินค้าขายดีจากข้อมูลจริง
        topProducts: this._calculateTopProducts(productsData, salesData),
        
        // ข้อมูลสถิติเพิ่มเติม
        productsSummary: {
          totalProducts: productsData.length,
          inStock: productsData.filter(p => (p.stock || 0) > 0).length,
          outOfStock: productsData.filter(p => (p.stock || 0) <= 0).length
        }
      };
      
      return statistics;
    } catch (error) {
      console.error('Error generating statistics:', error);
      throw new Error('ไม่สามารถสร้างข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  /**
   * จัดรูปแบบข้อมูลสินค้าจาก API
   * @private
   * @param {Object} apiProduct - ข้อมูลสินค้าจาก API
   * @returns {Object} - ข้อมูลสินค้าที่จัดรูปแบบแล้ว
   */
  _formatProduct(apiProduct) {
    // จัดการกับข้อมูลที่อาจจะมีชื่อฟิลด์ต่างกัน
    const productId = apiProduct.product_id || apiProduct.id;
    const productName = apiProduct.product_name || apiProduct.name;
    const categoryName = apiProduct.category_name || apiProduct.category;
    const price = parseFloat(apiProduct.price) || 0;
    const originalPrice = apiProduct.originalPrice ? parseFloat(apiProduct.originalPrice) : null;
    const discount = parseFloat(apiProduct.discount) || 0;
    const stock = parseInt(apiProduct.stock) || 0;
    
    // จัดการรูปภาพ
    const imageUrl = apiProduct.imgurl || apiProduct.imageurl || apiProduct.image;
    const images = imageUrl ? [imageUrl] : [];
    
    return {
      id: productId,
      name: productName,
      category: categoryName,
      brand: apiProduct.brand || 'Unknown',
      model: apiProduct.model || '',
      description: apiProduct.description || `${productName}`,
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      stock: stock,
      images: images,
      
      // ข้อมูลการจัดส่ง
      delivery: {
        status: stock > 0 ? "available" : "unavailable",
        estimatedDays: stock > 0 ? "1-3 วัน" : "สินค้าหมด"
      },
      
      // เอกสารที่เกี่ยวข้อง
      documents: {
        specs: apiProduct.specurl || null,
        manual: apiProduct.manualurl || null,
        compare: apiProduct.compareurl || null
      },
      
      // การรับประกัน
      warranty: apiProduct.warranty || "รับประกันตามที่ผู้ผลิตกำหนด"
    };
  }

  /**
   * คำนวณสินค้าขายดีจากข้อมูลจริง
   * @private
   * @param {Array} products - รายการสินค้าทั้งหมด
   * @param {Array} sales - รายการขายทั้งหมด
   * @returns {Array} - รายการสินค้าขายดี
   */
  _calculateTopProducts(products, sales) {
    if (!Array.isArray(sales) || sales.length === 0) {
      // ถ้าไม่มีข้อมูลการขาย ให้แสดงสินค้าตามสต็อกและราคา
      return products
        .sort((a, b) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 5)
        .map(product => ({
          id: product.id,
          name: product.name,
          unitsSold: 0,
          revenue: 0,
          stock: product.stock || 0
        }));
    }
    
    // สร้าง map เพื่อนับยอดขายของแต่ละสินค้า
    const productSalesMap = {};
    
    // วนลูปรายการขายทั้งหมด
    sales.forEach(sale => {
      // วนลูปรายการสินค้าในแต่ละการขาย
      const items = sale.items || sale.products || [];
      items.forEach(item => {
        const productId = item.productId || item.product_id || item.id;
        const quantity = parseInt(item.quantity) || 1;
        const itemPrice = parseFloat(item.price) || 0;
        
        // ถ้ายังไม่มีข้อมูลสินค้านี้ ให้สร้างใหม่
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            count: 0,
            amount: 0
          };
        }
        
        // เพิ่มจำนวนและยอดขาย
        productSalesMap[productId].count += quantity;
        productSalesMap[productId].amount += (itemPrice * quantity);
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
          stock: product ? (product.stock || 0) : 0
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
    try {
      // ในระบบจริงควรดึงข้อมูลจาก session หรือ token
      // ตอนนี้ยังไม่มี API สำหรับผู้ใช้ จึงต้องแจ้งเตือน
      throw new Error('ระบบการจัดการผู้ใช้อยู่ระหว่างการพัฒนา');
    } catch (error) {
      console.error('Error getting current user:', error);
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้ ระบบอยู่ระหว่างการพัฒนา');
    }
  }
}

// สร้าง instance ของ DataService
const dataService = new DataService();
export default dataService;