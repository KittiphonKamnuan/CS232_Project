/**
 * InfoHub 360 - Formatter Utilities
 * 
 * ฟังก์ชั่นช่วยสำหรับการจัดรูปแบบข้อมูลต่างๆ เช่น วันที่ เวลา เงิน หรือข้อความ
 */

const formatter = {
    /**
     * จัดรูปแบบวันที่เป็น Thai format
     * @param {Date|string} date - วันที่หรือ string วันที่
     * @param {boolean} includeTime - รวมเวลาด้วยหรือไม่
     * @returns {string} - วันที่ในรูปแบบ "31 ธ.ค. 2568" หรือ "31 ธ.ค. 2568, 13:45 น."
     */
    formatDate: function(date, includeTime = false) {
      if (!date) return '-';
      
      const d = typeof date === 'string' ? new Date(date) : date;
      
      // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
      if (isNaN(d.getTime())) return '-';
      
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      
      // แปลงปีเป็นปี พ.ศ.
      const thaiYear = d.getFullYear() + 543;
      const day = d.getDate();
      const month = thaiMonths[d.getMonth()];
      
      let result = `${day} ${month} ${thaiYear}`;
      
      // เพิ่มเวลาถ้าต้องการ
      if (includeTime) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        result += `, ${hours}:${minutes} น.`;
      }
      
      return result;
    },
    
    /**
     * จัดรูปแบบเงินเป็นสกุลเงินบาท
     * @param {number} amount - จำนวนเงิน
     * @param {boolean} includeSymbol - แสดงสัญลักษณ์ ฿ หรือไม่
     * @returns {string} - เงินในรูปแบบ "฿1,234.56" หรือ "1,234.56"
     */
    formatCurrency: function(amount, includeSymbol = true) {
      if (amount === null || amount === undefined) return '-';
      
      const formatter = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      
      // รูปแบบเต็มจาก Intl: "฿1,234.56"
      const formatted = formatter.format(amount);
      
      // ถ้าไม่ต้องการสัญลักษณ์ ให้ตัดสัญลักษณ์ออก
      if (!includeSymbol) {
        return formatted.replace('฿', '');
      }
      
      return formatted;
    },
    
    /**
     * แปลงข้อความเป็นตัวอักษรแรกตัวใหญ่
     * @param {string} text - ข้อความที่ต้องการแปลง
     * @returns {string} - ข้อความที่ตัวอักษรแรกเป็นตัวใหญ่
     */
    capitalizeFirstLetter: function(text) {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    /**
     * ตัดข้อความที่ยาวเกินไปและเพิ่ม ellipsis
     * @param {string} text - ข้อความที่ต้องการตัด
     * @param {number} maxLength - ความยาวสูงสุดที่ต้องการ
     * @returns {string} - ข้อความที่ถูกตัดและมี "..." ต่อท้าย
     */
    truncateText: function(text, maxLength = 50) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      
      return text.substring(0, maxLength) + '...';
    },
    
    /**
     * จัดรูปแบบเบอร์โทรศัพท์ให้อยู่ในรูปแบบที่อ่านง่าย
     * @param {string} phone - เบอร์โทรศัพท์
     * @returns {string} - เบอร์โทรศัพท์ในรูปแบบ "089-123-4567"
     */
    formatPhone: function(phone) {
      if (!phone) return '';
      
      // ลบทุกอย่างที่ไม่ใช่ตัวเลข
      const cleaned = phone.replace(/\D/g, '');
      
      // ตรวจสอบความยาว
      if (cleaned.length !== 10) return phone;
      
      // จัดรูปแบบ
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    },
    
    /**
     * แปลงขนาดไฟล์ให้อยู่ในรูปแบบที่อ่านง่าย
     * @param {number} bytes - ขนาดไฟล์ในหน่วย bytes
     * @returns {string} - ขนาดไฟล์ในรูปแบบที่อ่านง่าย เช่น "1.23 MB"
     */
    formatFileSize: function(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * แปลงสถานะการขายเป็นข้อความภาษาไทย
     * @param {string} status - สถานะในรูปแบบ code
     * @returns {string} - สถานะในรูปแบบข้อความภาษาไทย
     */
    formatSaleStatus: function(status) {
      const statusMap = {
        'inquiry': 'สอบถามข้อมูล',
        'interested': 'ลูกค้าสนใจ',
        'quote': 'ส่งใบเสนอราคา',
        'negotiation': 'ต่อรองราคา',
        'confirmed': 'ยืนยันการสั่งซื้อ',
        'delivered': 'ส่งมอบสินค้า',
        'after_sale': 'บริการหลังการขาย'
      };
      
      return statusMap[status] || status;
    },
    
    /**
     * แปลงสถานะสินค้าเป็นข้อความภาษาไทย
     * @param {string} status - สถานะในรูปแบบ code
     * @returns {string} - สถานะในรูปแบบข้อความภาษาไทย
     */
    formatProductStatus: function(status) {
      const statusMap = {
        'in_stock': 'มีสินค้า',
        'low_stock': 'ใกล้หมด',
        'out_of_stock': 'สินค้าหมด',
        'discontinued': 'เลิกจำหน่าย',
        'coming_soon': 'เร็วๆ นี้'
      };
      
      return statusMap[status] || status;
    }
  };
  
  export default formatter;