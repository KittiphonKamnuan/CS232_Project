/**
 * InfoHub 360 - Data Service
 * 
 * บริการจัดการข้อมูลหลักของแอปพลิเคชันโดยใช้ Amazon DynamoDB
 * สำหรับการจัดเก็บข้อมูลสินค้า, ลูกค้า, การขาย และเอกสาร
 */

import { AWS_REGION, TABLES, initializeAWS } from './aws-config.js';

class DataService {
  constructor() {
    // ตั้งค่า DynamoDB client
    const { dynamoDB } = initializeAWS();
    this.dynamoDB = dynamoDB;
  }
  
  /**
   * ===================================
   * PRODUCTS API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลสินค้าทั้งหมด
   * @returns {Promise} - Promise ที่ resolve เป็นรายการสินค้า
   */
  getAllProducts() {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.PRODUCTS
      };
      
      this.dynamoDB.scan(params, (err, data) => {
        if (err) {
          console.error('Error fetching products from DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(data.Items);
      });
    });
  }
  
  /**
   * ค้นหาสินค้าด้วย parameters ต่างๆ
   * @param {Object} searchParams - พารามิเตอร์ในการค้นหา
   * @returns {Promise} - Promise ที่ resolve เป็นรายการสินค้าที่ค้นพบ
   */
  searchProducts(searchParams) {
    return new Promise((resolve, reject) => {
      // ในกรณีที่มี GSI (Global Secondary Index) สำหรับการค้นหาตามหมวดหมู่
      if (searchParams.category) {
        const params = {
          TableName: TABLES.PRODUCTS,
          IndexName: 'CategoryIndex',
          KeyConditionExpression: 'category = :cat',
          ExpressionAttributeValues: {
            ':cat': searchParams.category
          }
        };
        
        // ค้นหาตามหมวดหมู่
        this.dynamoDB.query(params, (err, data) => {
          if (err) {
            console.error('Error querying products by category:', err);
            reject(err);
            return;
          }
          
          // กรองเพิ่มเติมตามเงื่อนไขอื่นๆ ที่กำหนด
          let results = data.Items;
          
          // กรองตามช่วงราคา (ถ้ามี)
          if (searchParams.minPrice || searchParams.maxPrice) {
            results = results.filter(product => {
              if (searchParams.minPrice && product.price < searchParams.minPrice) {
                return false;
              }
              if (searchParams.maxPrice && product.price > searchParams.maxPrice) {
                return false;
              }
              return true;
            });
          }
          
          // กรองตามคำค้นหา (ถ้ามี)
          if (searchParams.keyword) {
            const keyword = searchParams.keyword.toLowerCase();
            results = results.filter(product => {
              return (
                product.name.toLowerCase().includes(keyword) ||
                product.description.toLowerCase().includes(keyword) ||
                product.productCode.toLowerCase().includes(keyword)
              );
            });
          }
          
          resolve(results);
        });
      } else {
        // ถ้าไม่มีหมวดหมู่, ดึงทั้งหมดและกรองทางฝั่งแอปพลิเคชัน
        this.getAllProducts()
          .then(products => {
            let results = products;
            
            // กรองตามช่วงราคา (ถ้ามี)
            if (searchParams.minPrice || searchParams.maxPrice) {
              results = results.filter(product => {
                if (searchParams.minPrice && product.price < searchParams.minPrice) {
                  return false;
                }
                if (searchParams.maxPrice && product.price > searchParams.maxPrice) {
                  return false;
                }
                return true;
              });
            }
            
            // กรองตามคำค้นหา (ถ้ามี)
            if (searchParams.keyword) {
              const keyword = searchParams.keyword.toLowerCase();
              results = results.filter(product => {
                return (
                  product.name.toLowerCase().includes(keyword) ||
                  product.description.toLowerCase().includes(keyword) ||
                  product.productCode.toLowerCase().includes(keyword)
                );
              });
            }
            
            resolve(results);
          })
          .catch(reject);
      }
    });
  }
  
  /**
   * ดึงข้อมูลสินค้าตาม ID
   * @param {string} productId - ID ของสินค้า
   * @returns {Promise} - Promise ที่ resolve เป็นข้อมูลสินค้า
   */
  getProductById(productId) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.PRODUCTS,
        Key: {
          productId: productId
        }
      };
      
      this.dynamoDB.get(params, (err, data) => {
        if (err) {
          console.error('Error fetching product from DynamoDB:', err);
          reject(err);
          return;
        }
        
        if (!data.Item) {
          reject(new Error('ไม่พบสินค้า'));
          return;
        }
        
        resolve(data.Item);
      });
    });
  }
  
  /**
   * เพิ่มสินค้าใหม่
   * @param {Object} productData - ข้อมูลสินค้า
   * @returns {Promise} - Promise ที่ resolve เมื่อเพิ่มสำเร็จ
   */
  createProduct(productData) {
    return new Promise((resolve, reject) => {
      // สร้าง ID ใหม่ถ้าไม่มี
      if (!productData.productId) {
        productData.productId = 'PRD_' + Date.now();
      }
      
      // เพิ่ม timestamp
      productData.createdAt = new Date().toISOString();
      productData.updatedAt = new Date().toISOString();
      
      const params = {
        TableName: TABLES.PRODUCTS,
        Item: productData
      };
      
      this.dynamoDB.put(params, (err) => {
        if (err) {
          console.error('Error creating product in DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(productData);
      });
    });
  }
  
  /**
   * อัปเดตข้อมูลสินค้า
   * @param {string} productId - ID ของสินค้า
   * @param {Object} productData - ข้อมูลสินค้าที่ต้องการอัปเดต
   * @returns {Promise} - Promise ที่ resolve เมื่ออัปเดตสำเร็จ
   */
  updateProduct(productId, productData) {
    return new Promise((resolve, reject) => {
      // อัปเดต timestamp
      productData.updatedAt = new Date().toISOString();
      
      // สร้าง expression สำหรับการอัปเดต
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let updateExpression = 'set ';
      
      Object.keys(productData).forEach((key, index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = productData[key];
        
        if (index > 0) {
          updateExpression += ', ';
        }
        updateExpression += `${nameKey} = ${valueKey}`;
      });
      
      const params = {
        TableName: TABLES.PRODUCTS,
        Key: {
          productId: productId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };
      
      this.dynamoDB.update(params, (err, data) => {
        if (err) {
          console.error('Error updating product in DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(data.Attributes);
      });
    });
  }
  
  /**
   * ลบสินค้า
   * @param {string} productId - ID ของสินค้า
   * @returns {Promise} - Promise ที่ resolve เมื่อลบสำเร็จ
   */
  deleteProduct(productId) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.PRODUCTS,
        Key: {
          productId: productId
        }
      };
      
      this.dynamoDB.delete(params, (err) => {
        if (err) {
          console.error('Error deleting product from DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve({ success: true, id: productId });
      });
    });
  }
  
  /**
   * ===================================
   * CUSTOMERS API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลลูกค้าทั้งหมด
   * @returns {Promise} - Promise ที่ resolve เป็นรายการลูกค้า
   */
  getAllCustomers() {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.CUSTOMERS
      };
      
      this.dynamoDB.scan(params, (err, data) => {
        if (err) {
          console.error('Error fetching customers from DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(data.Items);
      });
    });
  }
  
  /**
   * ค้นหาลูกค้าด้วย parameters ต่างๆ
   * @param {Object} searchParams - พารามิเตอร์ในการค้นหา
   * @returns {Promise} - Promise ที่ resolve เป็นรายการลูกค้าที่ค้นพบ
   */
  searchCustomers(searchParams) {
    return new Promise((resolve, reject) => {
      // ถ้ามีเบอร์โทรศัพท์ ใช้ query ด้วย GSI
      if (searchParams.phone) {
        const params = {
          TableName: TABLES.CUSTOMERS,
          IndexName: 'PhoneIndex',
          KeyConditionExpression: 'phone = :phone',
          ExpressionAttributeValues: {
            ':phone': searchParams.phone
          }
        };
        
        this.dynamoDB.query(params, (err, data) => {
          if (err) {
            console.error('Error querying customers by phone:', err);
            reject(err);
            return;
          }
          
          resolve(data.Items);
        });
      } else {
        // ดึงลูกค้าทั้งหมดและกรอง
        this.getAllCustomers()
          .then(customers => {
            let results = customers;
            
            // กรองตามคำค้นหา (ถ้ามี)
            if (searchParams.keyword) {
              const keyword = searchParams.keyword.toLowerCase();
              results = results.filter(customer => {
                return (
                  customer.name.toLowerCase().includes(keyword) ||
                  customer.email?.toLowerCase().includes(keyword) ||
                  customer.phone?.includes(keyword)
                );
              });
            }
            
            // กรองตามสถานะ (ถ้ามี)
            if (searchParams.status) {
              results = results.filter(customer => customer.status === searchParams.status);
            }
            
            resolve(results);
          })
          .catch(reject);
      }
    });
  }
  
  /**
   * ดึงข้อมูลลูกค้าตาม ID
   * @param {string} customerId - ID ของลูกค้า
   * @returns {Promise} - Promise ที่ resolve เป็นข้อมูลลูกค้า
   */
  getCustomerById(customerId) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.CUSTOMERS,
        Key: {
          customerId: customerId
        }
      };
      
      this.dynamoDB.get(params, (err, data) => {
        if (err) {
          console.error('Error fetching customer from DynamoDB:', err);
          reject(err);
          return;
        }
        
        if (!data.Item) {
          reject(new Error('ไม่พบลูกค้า'));
          return;
        }
        
        resolve(data.Item);
      });
    });
  }
  
  /**
   * เพิ่มลูกค้าใหม่
   * @param {Object} customerData - ข้อมูลลูกค้า
   * @returns {Promise} - Promise ที่ resolve เมื่อเพิ่มสำเร็จ
   */
  createCustomer(customerData) {
    return new Promise((resolve, reject) => {
      // สร้าง ID ใหม่ถ้าไม่มี
      if (!customerData.customerId) {
        customerData.customerId = 'CUS_' + Date.now();
      }
      
      // เพิ่ม timestamp
      customerData.createdAt = new Date().toISOString();
      customerData.updatedAt = new Date().toISOString();
      
      const params = {
        TableName: TABLES.CUSTOMERS,
        Item: customerData
      };
      
      this.dynamoDB.put(params, (err) => {
        if (err) {
          console.error('Error creating customer in DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(customerData);
      });
    });
  }
  
  /**
   * อัปเดตข้อมูลลูกค้า
   * @param {string} customerId - ID ของลูกค้า
   * @param {Object} customerData - ข้อมูลลูกค้าที่ต้องการอัปเดต
   * @returns {Promise} - Promise ที่ resolve เมื่ออัปเดตสำเร็จ
   */
  updateCustomer(customerId, customerData) {
    return new Promise((resolve, reject) => {
      // อัปเดต timestamp
      customerData.updatedAt = new Date().toISOString();
      
      // สร้าง expression สำหรับการอัปเดต
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let updateExpression = 'set ';
      
      Object.keys(customerData).forEach((key, index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = customerData[key];
        
        if (index > 0) {
          updateExpression += ', ';
        }
        updateExpression += `${nameKey} = ${valueKey}`;
      });
      
      const params = {
        TableName: TABLES.CUSTOMERS,
        Key: {
          customerId: customerId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };
      
      this.dynamoDB.update(params, (err, data) => {
        if (err) {
          console.error('Error updating customer in DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(data.Attributes);
      });
    });
  }
  
  /**
   * ===================================
   * SALES API
   * ===================================
   */
  
  /**
   * ดึงข้อมูลการขายทั้งหมด
   * @returns {Promise} - Promise ที่ resolve เป็นรายการการขาย
   */
  getAllSales() {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.SALES
      };
      
      this.dynamoDB.scan(params, (err, data) => {
        if (err) {
          console.error('Error fetching sales from DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(data.Items);
      });
    });
  }
  
  /**
   * ดึงการขายของลูกค้า
   * @param {string} customerId - ID ของลูกค้า
   * @returns {Promise} - Promise ที่ resolve เป็นรายการการขาย
   */
  getSalesByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: TABLES.SALES,
        IndexName: 'CustomerIndex',
        KeyConditionExpression: 'customerId = :cusId',
        ExpressionAttributeValues: {
          ':cusId': customerId
        }
      };
      
      this.dynamoDB.query(params, (err, data) => {
        if (err) {
          console.error('Error querying sales by customer:', err);
          reject(err);
          return;
        }
        
        resolve(data.Items);
      });
    });
  }
  
  /**
   * สร้างการขายใหม่
   * @param {Object} saleData - ข้อมูลการขาย
   * @returns {Promise} - Promise ที่ resolve เมื่อสร้างสำเร็จ
   */
  createSale(saleData) {
    return new Promise((resolve, reject) => {
      // สร้าง ID ใหม่ถ้าไม่มี
      if (!saleData.saleId) {
        saleData.saleId = 'SALE_' + Date.now();
      }
      
      // เพิ่ม timestamp
      saleData.createdAt = new Date().toISOString();
      saleData.updatedAt = new Date().toISOString();
      
      const params = {
        TableName: TABLES.SALES,
        Item: saleData
      };
      
      this.dynamoDB.put(params, (err) => {
        if (err) {
          console.error('Error creating sale in DynamoDB:', err);
          reject(err);
          return;
        }
        
        resolve(saleData);
      });
    });
  }
  
  /**
   * ===================================
   * DASHBOARD & REPORTS
   * ===================================
   */
  
  /**
   * ดึงข้อมูลสำหรับ Dashboard
   * @returns {Promise} - Promise ที่ resolve เป็นข้อมูล Dashboard
   */
  getDashboardData() {
    return new Promise((resolve, reject) => {
      // ดึงข้อมูลยอดขายรวมในเดือนปัจจุบัน
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // ในระบบจริง คุณควรใช้ GSI ที่มี date เป็น key เพื่อให้มีประสิทธิภาพมากขึ้น
      // นี่เป็นเพียงตัวอย่างการใช้ scan และกรองข้อมูล
      
      Promise.all([
        this.getAllSales(),
        this.getAllCustomers(),
        this.getAllProducts()
      ])
        .then(([sales, customers, products]) => {
          // กรองยอดขายในเดือนปัจจุบัน
          const currentMonthSales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= firstDayOfMonth;
          });
          
          // คำนวณยอดขายรวม
          const totalSalesAmount = currentMonthSales.reduce((total, sale) => {
            return total + (sale.totalAmount || 0);
          }, 0);
          
          // คำนวณจำนวนการขาย
          const totalSalesCount = currentMonthSales.length;
          
          // คำนวณลูกค้าที่ต้องติดตาม (ที่มีสถานะ "รอติดตาม")
          const pendingFollowups = customers.filter(customer => 
            customer.status === 'รอติดตาม'
          ).length;
          
          // สินค้าขายดี
          const productSalesMap = {};
          currentMonthSales.forEach(sale => {
            (sale.items || []).forEach(item => {
              const productId = item.productId;
              if (!productSalesMap[productId]) {
                productSalesMap[productId] = {
                  count: 0,
                  amount: 0
                };
              }
              productSalesMap[productId].count += item.quantity || 1;
              productSalesMap[productId].amount += (item.price * item.quantity) || 0;
            });
          });
          
          // แปลงเป็นอาร์เรย์และเรียงลำดับ
          const topSellingProducts = Object.keys(productSalesMap)
            .map(productId => {
              const product = products.find(p => p.productId === productId);
              return {
                productId,
                name: product ? product.name : 'Unknown Product',
                category: product ? product.category : 'Unknown',
                salesCount: productSalesMap[productId].count,
                salesAmount: productSalesMap[productId].amount
              };
            })
            .sort((a, b) => b.salesCount - a.salesCount)
            .slice(0, 5); // เลือก 5 อันดับแรก
          
          // ข้อมูลกระบวนการขาย (Sales Pipeline)
          const pipelineStages = {
            'สอบถามข้อมูล': 0,
            'ลูกค้าสนใจ': 0,
            'ส่งใบเสนอราคา': 0,
            'ต่อรองราคา': 0,
            'ยืนยันการสั่งซื้อ': 0,
            'ส่งมอบสินค้า': 0,
            'บริการหลังการขาย': 0
          };
          
          // นับจำนวนลูกค้าในแต่ละขั้นตอน
          customers.forEach(customer => {
            const stage = customer.stage;
            if (pipelineStages.hasOwnProperty(stage)) {
              pipelineStages[stage]++;
            }
          });
          
          resolve({
            totalSalesAmount,
            totalSalesCount,
            pendingFollowups,
            topSellingProducts,
            pipelineStages
          });
        })
        .catch(reject);
    });
  }
}

// สร้าง singleton instance
const dataService = new DataService();
export default dataService;