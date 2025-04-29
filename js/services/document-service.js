/**
 * InfoHub 360 - Document Service using Amazon S3
 * 
 * บริการจัดการเอกสารโดยใช้ Amazon S3 สำหรับจัดเก็บไฟล์เอกสารสำคัญต่างๆ
 * เช่น สเปคสินค้า, คู่มือการใช้งาน, โบรชัวร์ และเอกสารเปรียบเทียบสินค้า
 */

import { AWS_REGION, initializeAWS } from './aws-config.js';

class DocumentService {
  constructor() {
    // ตั้งค่า S3 client
    AWS.config.region = AWS_REGION;
    this.s3 = new AWS.S3();
    
    // ชื่อ bucket สำหรับเก็บเอกสาร
    this.BUCKET_NAME = 'infohub360-documents';
    
    // CloudFront URL (ถ้ามีการใช้งาน)
    this.CLOUDFRONT_URL = 'https://d123xyz.cloudfront.net';
    
    // ประเภทเอกสาร
    this.DOC_TYPES = {
      SPEC: 'product-specs',
      MANUAL: 'user-manuals',
      BROCHURE: 'brochures',
      COMPARE: 'comparisons',
      PRICING: 'pricing'
    };
  }
  
  /**
   * ดึงรายชื่อเอกสารตามประเภท
   * @param {string} type - ประเภทเอกสาร (SPEC, MANUAL, BROCHURE, COMPARE, PRICING)
   * @returns {Promise} - Promise ที่ resolve เป็นรายการเอกสาร
   */
  getDocumentsByType(type) {
    return new Promise((resolve, reject) => {
      const typeFolder = this.DOC_TYPES[type];
      if (!typeFolder) {
        reject(new Error('ประเภทเอกสารไม่ถูกต้อง'));
        return;
      }
      
      const params = {
        Bucket: this.BUCKET_NAME,
        Prefix: `${typeFolder}/`
      };
      
      this.s3.listObjectsV2(params, (err, data) => {
        if (err) {
          console.error('Error listing S3 objects:', err);
          reject(err);
          return;
        }
        
        // จัดรูปแบบข้อมูลให้ใช้งานง่าย
        const documents = data.Contents.map(item => {
          const key = item.Key;
          const fileName = key.split('/').pop();
          return {
            id: key,
            name: fileName,
            type: type,
            url: this._getDocumentUrl(key),
            lastModified: item.LastModified,
            size: item.Size
          };
        });
        
        resolve(documents);
      });
    });
  }
  
  /**
   * ดึงข้อมูลเอกสารตามรหัสสินค้า
   * @param {string} productCode - รหัสสินค้า
   * @returns {Promise} - Promise ที่ resolve เป็นรายการเอกสารที่เกี่ยวข้องกับสินค้า
   */
  getDocumentsByProduct(productCode) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.BUCKET_NAME,
        Prefix: ''  // ค้นหาทั้งหมด
      };
      
      this.s3.listObjectsV2(params, (err, data) => {
        if (err) {
          console.error('Error listing S3 objects:', err);
          reject(err);
          return;
        }
        
        // กรองเอกสารที่เกี่ยวข้องกับรหัสสินค้า
        const documents = data.Contents
          .filter(item => item.Key.includes(productCode))
          .map(item => {
            const key = item.Key;
            const fileName = key.split('/').pop();
            const typeFolder = key.split('/')[0];
            const type = Object.keys(this.DOC_TYPES).find(
              t => this.DOC_TYPES[t] === typeFolder
            );
            
            return {
              id: key,
              name: fileName,
              type: type,
              url: this._getDocumentUrl(key),
              lastModified: item.LastModified,
              size: item.Size
            };
          });
        
        resolve(documents);
      });
    });
  }
  
  /**
   * ดาวน์โหลดเอกสาร
   * @param {string} documentKey - คีย์ของเอกสารใน S3
   * @returns {Promise} - Promise ที่ resolve เป็น URL สำหรับดาวน์โหลด
   */
  getDocumentDownloadUrl(documentKey) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: documentKey,
        Expires: 3600  // URL หมดอายุใน 1 ชั่วโมง
      };
      
      this.s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) {
          console.error('Error generating download URL:', err);
          reject(err);
          return;
        }
        
        resolve(url);
      });
    });
  }
  
  /**
   * อัปโหลดเอกสารใหม่ (สำหรับแอดมิน)
   * @param {File} file - ไฟล์ที่จะอัปโหลด
   * @param {string} type - ประเภทเอกสาร
   * @param {string} productCode - รหัสสินค้าที่เกี่ยวข้อง (ถ้ามี)
   * @returns {Promise} - Promise ที่ resolve เมื่ออัปโหลดเสร็จ
   */
  uploadDocument(file, type, productCode = '') {
    return new Promise((resolve, reject) => {
      const typeFolder = this.DOC_TYPES[type];
      if (!typeFolder) {
        reject(new Error('ประเภทเอกสารไม่ถูกต้อง'));
        return;
      }
      
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const fileExtension = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      let fileName = file.name;
      
      // ถ้ามีรหัสสินค้า ให้เพิ่มเข้าไปในชื่อไฟล์
      if (productCode) {
        fileName = `${productCode}_${timestamp}.${fileExtension}`;
      } else {
        fileName = `${timestamp}_${fileName}`;
      }
      
      const key = `${typeFolder}/${fileName}`;
      
      // อ่านไฟล์เป็น ArrayBuffer
      const reader = new FileReader();
      reader.onload = (e) => {
        const params = {
          Bucket: this.BUCKET_NAME,
          Key: key,
          Body: new Uint8Array(e.target.result),
          ContentType: file.type,
          ACL: 'private'  // ตั้งค่าการเข้าถึงเป็น private
        };
        
        this.s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading document:', err);
            reject(err);
            return;
          }
          
          resolve({
            id: key,
            name: fileName,
            type: type,
            url: this._getDocumentUrl(key),
            uploadDate: new Date(),
            size: file.size
          });
        });
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * ลบเอกสาร (สำหรับแอดมิน)
   * @param {string} documentKey - คีย์ของเอกสารที่ต้องการลบ
   * @returns {Promise} - Promise ที่ resolve เมื่อลบเสร็จ
   */
  deleteDocument(documentKey) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: documentKey
      };
      
      this.s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error('Error deleting document:', err);
          reject(err);
          return;
        }
        
        resolve({ success: true, key: documentKey });
      });
    });
  }
  
  /**
   * ส่งเอกสารให้ลูกค้า
   * @param {Array} documentKeys - รายการคีย์ของเอกสารที่ต้องการส่ง
   * @param {string} customerEmail - อีเมลของลูกค้า
   * @param {string} message - ข้อความเพิ่มเติม
   * @returns {Promise} - Promise ที่ resolve เมื่อส่งเสร็จ
   */
  shareDocumentsWithCustomer(documentKeys, customerEmail, message = '') {
    // ในสถานการณ์จริง คุณจะใช้ AWS Lambda และ SES เพื่อส่งอีเมลถึงลูกค้า
    // โค้ดนี้เป็นเพียงตัวอย่างการสร้าง URL สำหรับแชร์
    
    return new Promise((resolve, reject) => {
      const shareUrls = [];
      let completed = 0;
      
      documentKeys.forEach(key => {
        const params = {
          Bucket: this.BUCKET_NAME,
          Key: key,
          Expires: 604800  // URL หมดอายุใน 1 สัปดาห์
        };
        
        this.s3.getSignedUrl('getObject', params, (err, url) => {
          completed++;
          
          if (err) {
            console.error(`Error generating share URL for ${key}:`, err);
          } else {
            shareUrls.push({
              key: key,
              url: url,
              name: key.split('/').pop()
            });
          }
          
          // เมื่อครบทุกเอกสารแล้ว
          if (completed === documentKeys.length) {
            if (shareUrls.length === 0) {
              reject(new Error('ไม่สามารถสร้าง URL สำหรับแชร์ได้'));
              return;
            }
            
            // ในที่นี้จะ return URLs ออกมา ในระบบจริงคุณจะส่งอีเมลด้วย SES
            resolve({
              customer: customerEmail,
              message: message,
              documentUrls: shareUrls,
              sentDate: new Date()
            });
          }
        });
      });
    });
  }
  
  /**
   * รับ URL ของเอกสาร (private method)
   * @private
   * @param {string} key - คีย์ของเอกสารใน S3
   * @returns {string} - URL ของเอกสาร
   */
  _getDocumentUrl(key) {
    // ถ้าใช้ CloudFront
    if (this.CLOUDFRONT_URL) {
      return `${this.CLOUDFRONT_URL}/${key}`;
    }
    
    // ถ้าไม่ใช้ CloudFront
    return `https://${this.BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }
}

// สร้าง singleton instance
const documentService = new DocumentService();
export default documentService;