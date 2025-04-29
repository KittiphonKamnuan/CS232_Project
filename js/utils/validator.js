/**
 * InfoHub 360 - Validator Utilities
 * 
 * ฟังก์ชั่นช่วยตรวจสอบความถูกต้องของข้อมูลต่างๆ
 * ใช้สำหรับตรวจสอบข้อมูลก่อนส่งไปยัง API หรือแสดงผลในหน้าเว็บ
 */

const validator = {
    /**
     * ตรวจสอบว่าเป็นอีเมลที่ถูกต้องหรือไม่
     * @param {string} email - อีเมลที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
     */
    isValidEmail: function(email) {
      if (!email) return false;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    /**
     * ตรวจสอบว่าเป็นเบอร์โทรศัพท์ไทยที่ถูกต้องหรือไม่
     * @param {string} phone - เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
     */
    isValidThaiPhoneNumber: function(phone) {
      if (!phone) return false;
      
      // ลบทุกอย่างที่ไม่ใช่ตัวเลข
      const cleaned = phone.replace(/\D/g, '');
      
      // เบอร์โทรศัพท์ไทยมี 10 หลัก และขึ้นต้นด้วย 0
      if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
        return false;
      }
      
      // ตรวจสอบความถูกต้องของรหัสนำหน้า
      const prefix = cleaned.substring(0, 2);
      const validPrefixes = ['06', '08', '09', '02', '03', '04', '05', '07']; // มือถือและเบอร์บ้าน
      
      return validPrefixes.includes(prefix);
    },
    
    /**
     * ตรวจสอบว่าข้อมูลมีค่าว่างหรือไม่
     * @param {*} value - ค่าที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าไม่ว่าง, false ถ้าว่าง
     */
    isNotEmpty: function(value) {
      if (value === null || value === undefined) return false;
      
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      
      return true;
    },
    
    /**
     * ตรวจสอบว่าเป็นวันที่ที่ถูกต้องหรือไม่
     * @param {string|Date} date - วันที่ที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
     */
    isValidDate: function(date) {
      if (!date) return false;
      
      let d;
      if (typeof date === 'string') {
        d = new Date(date);
      } else if (date instanceof Date) {
        d = date;
      } else {
        return false;
      }
      
      // ตรวจสอบว่าเป็นวันที่ที่ถูกต้อง
      return !isNaN(d.getTime());
    },
    
    /**
     * ตรวจสอบว่าค่าอยู่ในช่วงที่กำหนดหรือไม่
     * @param {number} value - ค่าที่ต้องการตรวจสอบ
     * @param {number} min - ค่าต่ำสุด
     * @param {number} max - ค่าสูงสุด
     * @returns {boolean} - true ถ้าอยู่ในช่วง, false ถ้าไม่อยู่ในช่วง
     */
    isInRange: function(value, min, max) {
      if (value === null || value === undefined) return false;
      
      const num = Number(value);
      if (isNaN(num)) return false;
      
      return num >= min && num <= max;
    },
    
    /**
     * ตรวจสอบว่าเป็นรหัสไปรษณีย์ไทยที่ถูกต้องหรือไม่
     * @param {string} zipcode - รหัสไปรษณีย์ที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
     */
    isValidThaiZipcode: function(zipcode) {
      if (!zipcode) return false;
      
      // รหัสไปรษณีย์ไทยมี 5 หลัก
      const zipcodeRegex = /^[0-9]{5}$/;
      return zipcodeRegex.test(zipcode);
    },
    
    /**
     * ตรวจสอบความเหมือนของรหัสผ่าน
     * @param {string} password - รหัสผ่าน
     * @param {string} confirmPassword - รหัสผ่านยืนยัน
     * @returns {boolean} - true ถ้าตรงกัน, false ถ้าไม่ตรงกัน
     */
    passwordsMatch: function(password, confirmPassword) {
      return password === confirmPassword;
    },
    
    /**
     * ตรวจสอบความแข็งแรงของรหัสผ่าน
     * @param {string} password - รหัสผ่านที่ต้องการตรวจสอบ
     * @returns {Object} - ผลลัพธ์การตรวจสอบ มี isValid และ message
     */
    checkPasswordStrength: function(password) {
      if (!password) {
        return {
          isValid: false,
          message: 'กรุณากรอกรหัสผ่าน',
          score: 0
        };
      }
      
      let score = 0;
      let message = '';
      
      // ตรวจสอบความยาว
      if (password.length < 8) {
        return {
          isValid: false,
          message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
          score: 0
        };
      } else {
        score += 1;
      }
      
      // ตรวจสอบตัวอักษรพิมพ์ใหญ่
      if (/[A-Z]/.test(password)) {
        score += 1;
      }
      
      // ตรวจสอบตัวอักษรพิมพ์เล็ก
      if (/[a-z]/.test(password)) {
        score += 1;
      }
      
      // ตรวจสอบตัวเลข
      if (/\d/.test(password)) {
        score += 1;
      }
      
      // ตรวจสอบอักขระพิเศษ
      if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
      }
      
      // ตัดสินความแข็งแรง
      if (score <= 2) {
        message = 'รหัสผ่านอ่อนแอเกินไป';
        isValid = false;
      } else if (score === 3) {
        message = 'รหัสผ่านปานกลาง';
        isValid = true;
      } else if (score === 4) {
        message = 'รหัสผ่านแข็งแรง';
        isValid = true;
      } else {
        message = 'รหัสผ่านแข็งแรงมาก';
        isValid = true;
      }
      
      return {
        isValid: isValid,
        message: message,
        score: score
      };
    },
    
    /**
     * ตรวจสอบว่าเป็นเลขประจำตัวประชาชนไทยที่ถูกต้องหรือไม่
     * @param {string} id - เลขประจำตัวประชาชนที่ต้องการตรวจสอบ
     * @returns {boolean} - true ถ้าถูกต้อง, false ถ้าไม่ถูกต้อง
     */
    isValidThaiID: function(id) {
      if (!id) return false;
      
      // ลบทุกอย่างที่ไม่ใช่ตัวเลข
      const cleaned = id.replace(/\D/g, '');
      
      // เลขประจำตัวประชาชนไทยมี 13 หลัก
      if (cleaned.length !== 13) {
        return false;
      }
      
      // ตรวจสอบความถูกต้องตามอัลกอริทึม
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * (13 - i);
      }
      
      const checkDigit = (11 - (sum % 11)) % 10;
      return parseInt(cleaned.charAt(12)) === checkDigit;
    },
    
    /**
     * ตรวจสอบข้อมูลฟอร์มจากชุด validation rules
     * @param {Object} formData - ข้อมูลที่ต้องการตรวจสอบ
     * @param {Object} rules - กฎการตรวจสอบ
     * @returns {Object} - ผลลัพธ์การตรวจสอบ
     */
    validateForm: function(formData, rules) {
      const errors = {};
      let isValid = true;
      
      // ตรวจสอบแต่ละฟิลด์ตามกฎที่กำหนด
      for (const field in rules) {
        const fieldRules = rules[field];
        const value = formData[field];
        
        // ตรวจสอบว่าฟิลด์จำเป็นหรือไม่
        if (fieldRules.required && !this.isNotEmpty(value)) {
          errors[field] = fieldRules.errorMessages?.required || 'กรุณากรอกข้อมูลนี้';
          isValid = false;
          continue;
        }
        
        // ถ้าไม่จำเป็นและค่าว่าง ให้ข้ามไป
        if (!this.isNotEmpty(value) && !fieldRules.required) {
          continue;
        }
        
        // ตรวจสอบประเภทของข้อมูล
        if (fieldRules.type) {
          switch (fieldRules.type) {
            case 'email':
              if (!this.isValidEmail(value)) {
                errors[field] = fieldRules.errorMessages?.email || 'อีเมลไม่ถูกต้อง';
                isValid = false;
              }
              break;
            case 'phone':
              if (!this.isValidThaiPhoneNumber(value)) {
                errors[field] = fieldRules.errorMessages?.phone || 'เบอร์โทรศัพท์ไม่ถูกต้อง';
                isValid = false;
              }
              break;
            case 'zipcode':
              if (!this.isValidThaiZipcode(value)) {
                errors[field] = fieldRules.errorMessages?.zipcode || 'รหัสไปรษณีย์ไม่ถูกต้อง';
                isValid = false;
              }
              break;
            case 'thaiID':
              if (!this.isValidThaiID(value)) {
                errors[field] = fieldRules.errorMessages?.thaiID || 'เลขประจำตัวประชาชนไม่ถูกต้อง';
                isValid = false;
              }
              break;
            case 'number':
              if (isNaN(Number(value))) {
                errors[field] = fieldRules.errorMessages?.number || 'กรุณากรอกตัวเลข';
                isValid = false;
              }
              break;
          }
        }
        
        // ตรวจสอบความยาว
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
          errors[field] = fieldRules.errorMessages?.minLength || `ต้องมีความยาวอย่างน้อย ${fieldRules.minLength} ตัวอักษร`;
          isValid = false;
        }
        
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
          errors[field] = fieldRules.errorMessages?.maxLength || `ต้องมีความยาวไม่เกิน ${fieldRules.maxLength} ตัวอักษร`;
          isValid = false;
        }
        
        // ตรวจสอบช่วงของค่า
        if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
          errors[field] = fieldRules.errorMessages?.min || `ต้องมีค่าอย่างน้อย ${fieldRules.min}`;
          isValid = false;
        }
        
        if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
          errors[field] = fieldRules.errorMessages?.max || `ต้องมีค่าไม่เกิน ${fieldRules.max}`;
          isValid = false;
        }
        
        // ตรวจสอบด้วย pattern
        if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
          errors[field] = fieldRules.errorMessages?.pattern || 'รูปแบบไม่ถูกต้อง';
          isValid = false;
        }
        
        // ตรวจสอบด้วยฟังก์ชันกำหนดเอง
        if (fieldRules.custom && typeof fieldRules.custom === 'function') {
          const customResult = fieldRules.custom(value, formData);
          if (customResult !== true) {
            errors[field] = customResult || 'ข้อมูลไม่ถูกต้อง';
            isValid = false;
          }
        }
      }
      
      return {
        isValid,
        errors
      };
    }
  };
  
  export default validator;