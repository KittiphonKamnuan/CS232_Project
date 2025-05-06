/**
 * InfoHub 360 - Document Service using AWS API Gateway
 * 
 * บริการจัดการเอกสารโดยใช้ API Gateway เพื่อเข้าถึง Amazon S3
 * สำหรับจัดเก็บไฟล์เอกสารสำคัญต่างๆ เช่น สเปคสินค้า, คู่มือการใช้งาน, โบรชัวร์
 */

// กำหนด API Endpoints
const API_ENDPOINTS = {
  DOCUMENTS: 'https://s9ohxtt51a.execute-api.us-east-1.amazonaws.com/documents'
};

// ประเภทเอกสาร
const DOC_TYPES = {
  SPEC: 'product-specs',
  MANUAL: 'user-manuals',
  BROCHURE: 'brochures',
  COMPARE: 'comparisons',
  PRICING: 'pricing'
};

class DocumentService {
  constructor() {
    // ไม่จำเป็นต้องกำหนด AWS S3 client โดยตรงแล้ว
    // เนื่องจากเราใช้ API Gateway แทน
  }
  
  /**
   * ดึงรายชื่อเอกสารตามประเภท
   * @param {string} type - ประเภทเอกสาร (SPEC, MANUAL, BROCHURE, COMPARE, PRICING)
   * @returns {Promise} - Promise ที่ resolve เป็นรายการเอกสาร
   */
  async getDocumentsByType(type) {
    try {
      const typeFolder = DOC_TYPES[type];
      if (!typeFolder) {
        throw new Error('ประเภทเอกสารไม่ถูกต้อง');
      }
      
      // สร้าง query string
      const url = `${API_ENDPOINTS.DOCUMENTS}?type=${encodeURIComponent(type)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data.map(doc => this._formatDocumentData(doc)) : [];
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      throw error;
    }
  }
  
  /**
   * ดึงข้อมูลเอกสารตามรหัสสินค้า
   * @param {string} productCode - รหัสสินค้า
   * @returns {Promise} - Promise ที่ resolve เป็นรายการเอกสารที่เกี่ยวข้องกับสินค้า
   */
  async getDocumentsByProduct(productCode) {
    try {
      // สร้าง query string
      const url = `${API_ENDPOINTS.DOCUMENTS}?product_id=${encodeURIComponent(productCode)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // แปลงข้อมูลถ้าจำเป็น
      const documents = Array.isArray(data) ? data.map(doc => this._formatDocumentData(doc)) : [];
      return documents;
    } catch (error) {
      console.error('Error fetching documents by product:', error);
      throw error;
    }
  }
  
  /**
   * ดาวน์โหลดเอกสาร
   * @param {string} documentId - ID ของเอกสาร
   * @returns {Promise} - Promise ที่ resolve เป็น URL สำหรับดาวน์โหลด
   */
  async getDocumentDownloadUrl(documentId) {
    try {
      // สร้าง query string
      const url = `${API_ENDPOINTS.DOCUMENTS}/${encodeURIComponent(documentId)}/download`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw error;
    }
  }
  
  /**
   * อัปโหลดเอกสารใหม่ (สำหรับแอดมิน)
   * @param {File} file - ไฟล์ที่จะอัปโหลด
   * @param {string} type - ประเภทเอกสาร
   * @param {string} productCode - รหัสสินค้าที่เกี่ยวข้อง (ถ้ามี)
   * @returns {Promise} - Promise ที่ resolve เมื่ออัปโหลดเสร็จ
   */
  async uploadDocument(file, type, productCode = '') {
    try {
      const typeFolder = DOC_TYPES[type];
      if (!typeFolder) {
        throw new Error('ประเภทเอกสารไม่ถูกต้อง');
      }
      
      // สร้าง FormData สำหรับ multipart/form-data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('productCode', productCode);
      
      // เรียกใช้ API
      const url = `${API_ENDPOINTS.DOCUMENTS}/upload`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
  
  /**
   * ลบเอกสาร (สำหรับแอดมิน)
   * @param {string} documentId - ID ของเอกสารที่ต้องการลบ
   * @returns {Promise} - Promise ที่ resolve เมื่อลบเสร็จ
   */
  async deleteDocument(documentId) {
    try {
      // เรียกใช้ API
      const url = `${API_ENDPOINTS.DOCUMENTS}/${encodeURIComponent(documentId)}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
  
  /**
   * ส่งเอกสารให้ลูกค้า
   * @param {Array} documentIds - รายการ ID ของเอกสารที่ต้องการส่ง
   * @param {string} customerEmail - อีเมลของลูกค้า
   * @param {string} message - ข้อความเพิ่มเติม
   * @returns {Promise} - Promise ที่ resolve เมื่อส่งเสร็จ
   */
  async shareDocumentsWithCustomer(documentIds, customerEmail, message = '') {
    try {
      // สร้างข้อมูลสำหรับส่ง
      const requestData = {
        documentIds,
        customerEmail,
        message
      };
      
      // เรียกใช้ API
      const url = `${API_ENDPOINTS.DOCUMENTS}/share`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sharing documents:', error);
      throw error;
    }
  }
  
  /**
   * แปลงรูปแบบข้อมูลเอกสารให้ตรงกับที่ controller ต้องการ
   * @private
   * @param {Object} apiDocument - ข้อมูลเอกสารจาก API
   * @returns {Object} - ข้อมูลเอกสารที่แปลงแล้ว
   */
  _formatDocumentData(apiDocument) {
    // อ้างอิงโครงสร้างข้อมูลจาก mockupData.js (documents)
    return {
      id: apiDocument.id || apiDocument.document_id,
      type: apiDocument.type || apiDocument.document_type,
      title: apiDocument.title || apiDocument.document_name,
      customer: apiDocument.customer || apiDocument.customer_id,
      customerName: apiDocument.customerName || apiDocument.customer_name,
      date: apiDocument.date || apiDocument.created_at,
      createdBy: apiDocument.createdBy || apiDocument.created_by || 'ระบบ',
      fileName: apiDocument.fileName || apiDocument.file_name,
      fileSize: apiDocument.fileSize || apiDocument.file_size || '0 KB',
      status: apiDocument.status || 'เผยแพร่',
      relatedProducts: apiDocument.relatedProducts || apiDocument.related_products || []
    };
  }
  
  /**
   * ดึงข้อมูลเอกสารตาม ID
   * @param {string} documentId - ID ของเอกสาร
   * @returns {Promise} - Promise ที่ resolve เป็นข้อมูลเอกสาร
   */
  async getDocumentById(documentId) {
    try {
      // เรียกใช้ API
      const url = `${API_ENDPOINTS.DOCUMENTS}/${encodeURIComponent(documentId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data) {
        throw new Error(`ไม่พบเอกสารรหัส ${documentId}`);
      }
      
      // แปลงรูปแบบข้อมูล
      return this._formatDocumentData(data);
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error;
    }
  }
}

// สร้าง instance ของ DocumentService
const documentService = new DocumentService();
export default documentService;