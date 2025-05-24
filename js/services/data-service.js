/**
 * InfoHub 360 - Data Service
 * 
 * บริการจัดการข้อมูลหลักของแอปพลิเคชันโดยใช้ API Gateway
 * สำหรับการจัดเก็บข้อมูลสินค้า, ลูกค้า, การขาย และเอกสาร
 * อัปเดต: ใช้ข้อมูลจริงจาก API เท่านั้น
 */

// กำหนด API Endpoints
const API_ENDPOINTS = {
  PRODUCTS: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/GetAllProducts',
  CUSTOMERS: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/GetAllCustomers',
  CREATE_CUSTOMER: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/CreateCustomer',
  UPDATE_CUSTOMER: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/UpdateCustomer',
  DELETE_CUSTOMER: 'https://rbkou2ngki.execute-api.us-east-1.amazonaws.com/DeleteCustomer', // เพิ่ม endpoint ใหม่
  SALES: 'https://api.infohub360.com/sales',
  DOCUMENTS: 'https://api.infohub360.com/documents'
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
    try {
      const allProducts = await this.getProducts();
      
      if (!searchParams || Object.keys(searchParams).length === 0) {
        return allProducts;
      }
      
      let filteredProducts = allProducts;
      
      // กรองตาม search keyword
      if (searchParams.search && searchParams.search.trim()) {
        const searchTerm = searchParams.search.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.id.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
        );
      }
      
      // กรองตาม category
      if (searchParams.category && searchParams.category.trim()) {
        const categoryTerm = searchParams.category.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.category && product.category.toLowerCase().includes(categoryTerm)
        );
      }
      
      return filteredProducts;
    } catch (err) {
      console.error('Error searching products:', err);
      throw new Error('ไม่สามารถค้นหาสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  /**
   * ดึงข้อมูลสินค้าตาม ID
   * @param {string} productId - รหัสสินค้า
   * @returns {Promise<Object>} - ข้อมูลสินค้า
   */
  async getProductById(productId) {
    try {
      console.log('Getting product by ID:', productId);
      
      // เรียก API เพื่อดึงข้อมูลสินค้าตาม ID
      const url = `${API_ENDPOINTS.PRODUCTS}?product_id=${encodeURIComponent(productId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response for product ID:', productId, data);
      
      // ถ้า API ส่งข้อมูลเป็น array ให้หาสินค้าที่ตรงกับ ID
      if (Array.isArray(data)) {
        const product = data.find(p => 
          (p.product_id && p.product_id === productId) || 
          (p.id && p.id === productId)
        );
        if (product) {
          console.log('Product found in array:', product);
          return this._formatProduct(product);
        } else {
          // ถ้าไม่เจอใน array ให้หาจากสินค้าทั้งหมด
          const allProducts = await this.getProducts();
          const foundProduct = allProducts.find(p => p.id === productId);
          if (foundProduct) {
            console.log('Product found in all products:', foundProduct);
            return foundProduct;
          }
        }
      } else if (data && typeof data === 'object') {
        // ถ้า API ส่งข้อมูลเป็น object เดียว
        const productIdFromData = data.product_id || data.id;
        if (productIdFromData === productId) {
          console.log('Product found as single object:', data);
          return this._formatProduct(data);
        }
      }
      
      throw new Error('ไม่พบข้อมูลสินค้า');
    } catch (err) {
      console.error('Error loading product by ID:', err);
      // ถ้าเกิดข้อผิดพลาด ลองหาจากสินค้าทั้งหมด
      try {
        console.log('Fallback: searching in all products');
        const allProducts = await this.getProducts();
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          console.log('Product found in fallback search:', product);
          return product;
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
      
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
      const url = queryParams.toString().length > 0
        ? `${API_ENDPOINTS.CUSTOMERS}?${queryParams}`
        : API_ENDPOINTS.CUSTOMERS;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: HTTP ${response.status}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        return data.map(c => this._formatCustomer(c));
      } else if (typeof data === 'object' && data !== null) {
        return [this._formatCustomer(data)];
      }
      
      return [];
    } catch (err) {
      console.error('Error loading customers:', err);
      throw new Error('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  }

  /**
   * ดึงข้อมูลลูกค้าตาม ID
   * @param {string} customerId - รหัสลูกค้า
   * @returns {Promise<Object>} - ข้อมูลลูกค้า
   */
  async getCustomerById(customerId) {
    try {
      console.log('Getting customer by ID:', customerId);
      
      const url = `${API_ENDPOINTS.CUSTOMERS}?customer_id=${encodeURIComponent(customerId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customer: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response for customer ID:', customerId, data);
      
      if (Array.isArray(data)) {
        const customer = data.find(c => 
          (c.customer_id && c.customer_id === customerId) || 
          (c.id && c.id === customerId)
        );
        if (customer) {
          return this._formatCustomer(customer);
        } else {
          const allCustomers = await this.getCustomers();
          const foundCustomer = allCustomers.find(c => c.id === customerId);
          if (foundCustomer) {
            return foundCustomer;
          }
        }
      } else if (data && typeof data === 'object') {
        const customerIdFromData = data.customer_id || data.id;
        if (customerIdFromData === customerId) {
          return this._formatCustomer(data);
        }
      }
      
      throw new Error('ไม่พบข้อมูลลูกค้า');
    } catch (err) {
      console.error('Error loading customer by ID:', err);
      try {
        const allCustomers = await this.getCustomers();
        const customer = allCustomers.find(c => c.id === customerId);
        if (customer) {
          return customer;
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
      
      throw new Error('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาตรวจสอบรหัสลูกค้าและลองใหม่อีกครั้ง');
    }
  }

/**
 * สร้างลูกค้าใหม่ (อัปเดตแล้ว)
 * @param {Object} customerData - ข้อมูลลูกค้าใหม่
 * @returns {Promise<Object>} - ข้อมูลลูกค้าที่สร้างแล้ว
 */
async createCustomer(customerData) {
  try {
    console.log('Creating new customer:', customerData);
    
    // Validate required fields
    if (!customerData.fname || !customerData.name) {
      throw new Error('กรุณากรอกชื่อลูกค้า');
    }
    
    if (!customerData.tel) {
      throw new Error('กรุณากรอกเบอร์โทรศัพท์');
    }
    
    // Prepare data for API (เอา status ออก)
    const apiData = {
      "fname": customerData.fname || "",
      "lname": customerData.name || "", 
      "tel": customerData.tel || "",
      "email": customerData.email || "",
      "address": customerData.address || "",
      "note": customerData.note || ""
    };
    
    console.log('API Data to send:', JSON.stringify(apiData, null, 2));
    
    const response = await fetch(API_ENDPOINTS.CREATE_CUSTOMER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiData)
    });
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!response.ok) {
      let errorMessage = `Failed to create customer: HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        errorMessage = `Server error: ${responseText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Parse response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      result = { message: responseText };
    }
    
    console.log('Customer created successfully:', result);
    
    return this._formatCustomer({
      ...apiData,
      customer_id: result.customerId || result.customer_id || `CUST_${Date.now()}`,
      created_at: new Date().toISOString(),
      id: result.customerId || result.customer_id || `CUST_${Date.now()}`
    });
    
  } catch (err) {
    console.error('Error creating customer:', err);
    
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    throw new Error(err.message || 'ไม่สามารถสร้างลูกค้าใหม่ได้ กรุณาลองใหม่อีกครั้ง');
  }
}

  /**
 * อัปเดตข้อมูลลูกค้า (อัปเดตแล้ว)
 * @param {string} customerId - รหัสลูกค้า
 * @param {Object} customerData - ข้อมูลลูกค้าที่ต้องการอัปเดต
 * @returns {Promise<Object>} - ข้อมูลลูกค้าที่อัปเดตแล้ว
 */
async updateCustomer(customerId, customerData) {
  try {
    console.log('Updating customer:', customerId, customerData);
    
    // Validate required fields
    if (!customerData.fname || !customerData.name) {
      throw new Error('กรุณากรอกชื่อลูกค้า');
    }
    
    if (!customerData.tel) {
      throw new Error('กรุณากรอกเบอร์โทรศัพท์');
    }
    
    // Prepare data for API (เอา status ออก)
    const apiData = {
      "customer_id": customerId,
      "fname": customerData.fname || "",
      "lname": customerData.name || customerData.lname || "", 
      "tel": customerData.tel || "",
      "email": customerData.email || "",
      "address": customerData.address || "",
      "note": customerData.note || ""
    };
    
    console.log('Update API Data to send:', JSON.stringify(apiData, null, 2));
    
    const response = await fetch(API_ENDPOINTS.UPDATE_CUSTOMER, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiData)
    });
    
    console.log('Update response status:', response.status);
    
    const responseText = await response.text();
    console.log('Update response text:', responseText);
    
    if (!response.ok) {
      let errorMessage = `Failed to update customer: HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
        errorMessage = `Server error: ${responseText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Parse response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('Could not parse success response:', parseError);
      result = { message: responseText };
    }
    
    console.log('Customer updated successfully:', result);
    
    // Return formatted customer data
    return this._formatCustomer({
      ...apiData,
      customer_id: customerId,
      id: customerId,
      updated_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error updating customer:', err);
    
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
    
    throw new Error(err.message || 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
  }
}

  /**
   * ลบข้อมูลลูกค้า
   * @param {string} customerId - รหัสลูกค้า
   * @returns {Promise<boolean>} - สถานะการลบ
   */
  async deleteCustomer(customerId) {
    try {
      console.log('Deleting customer:', customerId);
      
      // Validate customer ID
      if (!customerId) {
        throw new Error('กรุณาระบุรหัสลูกค้า');
      }
      
      // Prepare data for API - ใช้รูปแบบเดียวกับที่เห็นในรูป
      const apiData = {
        "customer_id": customerId
      };
      
      console.log('Delete API Data to send:', JSON.stringify(apiData, null, 2));
      
      const response = await fetch(API_ENDPOINTS.DELETE_CUSTOMER, {
        method: 'DELETE', // หรือ POST ขึ้นอยู่กับ API design
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      console.log('Delete response status:', response.status);
      
      // Get response text first to debug
      const responseText = await response.text();
      console.log('Delete response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = `Failed to delete customer: HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
          errorMessage = `Server error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('Could not parse success response:', parseError);
        result = { message: responseText };
      }
      
      console.log('Customer deleted successfully:', result);
      return true;
      
    } catch (err) {
      console.error('Error deleting customer:', err);
      
      // Provide more specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      }
      
      throw new Error(err.message || 'ไม่สามารถลบข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  }


/**
 * ค้นหาลูกค้าด้วย parameters ต่างๆ
 * @param {Object} searchParams - พารามิเตอร์ในการค้นหา
 * @returns {Promise<Array>} - รายการลูกค้าที่ค้นพบ
 */
async searchCustomers(searchParams) {
  try {
    const allCustomers = await this.getCustomers();
    
    if (!searchParams || Object.keys(searchParams).length === 0) {
      return allCustomers;
    }
    
    let filteredCustomers = allCustomers;
    
    // กรองตาม search keyword
    if (searchParams.search && searchParams.search.trim()) {
      const searchTerm = searchParams.search.trim().toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.id.toLowerCase().includes(searchTerm) ||
        (customer.tel && customer.tel.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
      );
    }
    
    // กรองตาม dateFilter (แทนที่ status filter)
    if (searchParams.dateFilter && searchParams.dateFilter.trim()) {
      const dateFilter = searchParams.dateFilter.trim();
      const dateRange = this.getDateRange(dateFilter);
      
      if (dateRange) {
        filteredCustomers = filteredCustomers.filter(customer => {
          const customerDate = new Date(customer.created_at);
          return customerDate >= dateRange.from && customerDate <= dateRange.to;
        });
      }
    }
    
    // กรองตาม custom date range (ถ้ามี)
    if (searchParams.dateFrom || searchParams.dateTo) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const customerDate = new Date(customer.created_at);
        
        // ตรวจสอบวันที่เริ่มต้น
        if (searchParams.dateFrom) {
          const fromDate = new Date(searchParams.dateFrom);
          if (customerDate < fromDate) return false;
        }
        
        // ตรวจสอบวันที่สิ้นสุด
        if (searchParams.dateTo) {
          const toDate = new Date(searchParams.dateTo);
          toDate.setHours(23, 59, 59, 999); // ตั้งเป็นสิ้นวัน
          if (customerDate > toDate) return false;
        }
        
        return true;
      });
    }
    
    return filteredCustomers;
  } catch (err) {
    console.error('Error searching customers:', err);
    throw new Error('ไม่สามารถค้นหาลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
  }
}

/**
 * คำนวณช่วงวันที่สำหรับการกรอง
 * @param {string} dateFilter - ตัวกรองวันที่
 * @returns {Object|null} - ช่วงวันที่ {from, to}
 */
getDateRange(dateFilter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateFilter) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        from: startOfWeek,
        to: now
      };
    
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return {
        from: lastWeekStart,
        to: lastWeekEnd
      };
    
    case 'this_month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: startOfMonth,
        to: now
      };
    
    case 'last_month':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return {
        from: lastMonthStart,
        to: lastMonthEnd
      };
    
    case 'last_3_months':
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      return {
        from: threeMonthsAgo,
        to: now
      };
    
    case 'last_6_months':
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      return {
        from: sixMonthsAgo,
        to: now
      };
    
    case 'this_year':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        from: startOfYear,
        to: now
      };
    
    case 'last_year':
      const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
      lastYearEnd.setHours(23, 59, 59, 999);
      return {
        from: lastYearStart,
        to: lastYearEnd
      };
    
    default:
      return null;
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
   * ===================================
   * HELPER METHODS
   * ===================================
   */
  
/**
 * จัดรูปแบบข้อมูลลูกค้าจาก API (อัปเดตแล้ว)
 * @private
 * @param {Object} apiCustomer - ข้อมูลลูกค้าจาก API
 * @returns {Object} - ข้อมูลลูกค้าที่จัดรูปแบบแล้ว
 */
_formatCustomer(apiCustomer) {
  // จัดการกับข้อมูลที่อาจจะมีชื่อฟิลด์ต่างกัน
  const customerId = apiCustomer.customer_id || apiCustomer.id;
  const firstName = apiCustomer.customer_fname || apiCustomer.fname || apiCustomer.first_name || '';
  const lastName = apiCustomer.customer_lname || apiCustomer.name || apiCustomer.lname || apiCustomer.last_name || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'ไม่ระบุชื่อ');
  
  return {
    id: customerId,
    firstName: firstName,
    lastName: lastName,
    name: fullName,
    tel: apiCustomer.customer_tel || apiCustomer.tel || apiCustomer.phone || '',
    email: apiCustomer.customer_email || apiCustomer.email || '',
    address: apiCustomer.customer_address || apiCustomer.address || '',
    note: apiCustomer.note || '',
    created_at: apiCustomer.created_at || new Date().toISOString(),
    updated_at: apiCustomer.updated_at || new Date().toISOString(),
    
    // ข้อมูลเพิ่มเติม (เอา status ออก)
    totalOrders: parseInt(apiCustomer.totalOrders) || 0,
    totalSpent: parseFloat(apiCustomer.totalSpent) || 0,
    lastOrderDate: apiCustomer.lastOrderDate || null,
    tags: apiCustomer.tags || [],
    
    // การติดต่อล่าสุด
    lastContact: apiCustomer.lastContact || null,
    contactMethod: apiCustomer.contactMethod || 'phone',
    
    // ข้อมูลอื่นๆ (เอา status ออก)
    priority: apiCustomer.priority || 'normal', // low, normal, high
    source: apiCustomer.source || 'website' // website, referral, social, etc.
  };
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
    
    // จัดการสเปค
    let specifications = null;
    if (apiProduct.specifications) {
      try {
        specifications = typeof apiProduct.specifications === 'string' 
          ? JSON.parse(apiProduct.specifications) 
          : apiProduct.specifications;
      } catch (e) {
        console.warn('Failed to parse specifications:', e);
        specifications = null;
      }
    }
    
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
      specifications: specifications,
      
      // ข้อมูลการจัดส่ง
      delivery: {
        status: stock > 0 ? "available" : "unavailable",
        estimatedDays: stock > 0 ? "1-3 วัน" : "สินค้าหมด",
        method: "บริการส่งถึงบ้าน",
        freeShipping: price >= 1000 // ส่งฟรีเมื่อซื้อเกิน 1000 บาท
      },
      
      // เอกสารที่เกี่ยวข้อง
      documents: {
        specs: apiProduct.specurl || null,
        manual: apiProduct.manualurl || null,
        compare: apiProduct.compareurl || null
      },
      
      // การรับประกัน
      warranty: apiProduct.warranty || "รับประกันตามที่ผู้ผลิตกำหนด",
      
      // ข้อมูลเพิ่มเติม
      features: apiProduct.features || [],
      tags: apiProduct.tags || [],
      rating: parseFloat(apiProduct.rating) || 0,
      reviewCount: parseInt(apiProduct.reviewCount) || 0
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
  
  /**
   * ตรวจสอบการเชื่อมต่อ API
   * @returns {Promise<boolean>} - สถานะการเชื่อมต่อ
   */
  async checkConnection() {
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }
  
  /**
   * Clear cache (สำหรับอนาคต)
   */
  clearCache() {
    console.log('Cache cleared - feature not implemented yet');
  }
}

// สร้าง instance ของ DataService
const dataService = new DataService();
export default dataService;