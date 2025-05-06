/**
 * mockup-data.js
 * ไฟล์นี้เก็บข้อมูล mockup สำหรับใช้ในการพัฒนาขณะที่ DynamoDB ยังไม่พร้อม
 */

const mockupData = {
    // ข้อมูลสินค้า
    products: [
      {
        id: "TV-SAM-QN90C-55",
        name: "Samsung QN90C 55\" QLED 4K Smart TV",
        category: "ทีวี",
        brand: "Samsung",
        model: "QN90C",
        description: "Samsung Neo QLED 4K QN90C รุ่นปี 2023 มอบประสบการณ์ภาพที่สมจริงด้วยเทคโนโลยี Quantum Matrix และ Neo Quantum Processor 4K",
        specs: {
          resolution: "3840 x 2160 (4K)",
          displayType: "Neo QLED",
          hdr: "Quantum HDR 1500",
          refreshRate: "120Hz",
          smartFeatures: ["SmartThings", "Bixby", "Google Assistant", "Amazon Alexa"],
          ports: {
            hdmi: 4,
            usb: 2,
            optical: 1,
            ethernet: 1
          },
          audio: "60W, 2.2.2 channels"
        },
        price: 45990,
        originalPrice: 49990,
        discount: 8,
        stock: 2,
        images: [
          "https://infohub-360.s3.us-east-1.amazonaws.com/Infohub-documents/productimg/GOOGLE+CLASSROOM.png",
          "/assets/images/product-images/tv-samsung-qn90c-2.jpg",
          "/assets/images/product-images/tv-samsung-qn90c-3.jpg"
        ],
        delivery: {
          status: "available",
          estimatedDays: "1-2"
        },
        documents: {
          specs: "TV-SAM-QN90C-55-specs.pdf",
          manual: "TV-SAM-QN90C-55-manual.pdf",
          comparison: "Samsung-TV-comparison.pdf"
        },
        warranty: "รับประกัน 2 ปี โดยผู้ผลิต"
      },
      {
        id: "TV-SAM-BU8100-55",
        name: "Samsung BU8100 55\" Crystal UHD 4K Smart TV",
        category: "ทีวี",
        brand: "Samsung",
        model: "BU8100",
        description: "Samsung Crystal UHD 4K BU8100 รุ่นปี 2022 มอบภาพคมชัดระดับ 4K ด้วย Crystal Processor 4K และ Dynamic Crystal Color",
        specs: {
          resolution: "3840 x 2160 (4K)",
          displayType: "Crystal UHD",
          hdr: "HDR",
          refreshRate: "60Hz",
          smartFeatures: ["SmartThings", "Bixby", "Google Assistant", "Amazon Alexa"],
          ports: {
            hdmi: 3,
            usb: 2,
            optical: 1,
            ethernet: 1
          },
          audio: "20W, 2.0 channels"
        },
        price: 17990,
        originalPrice: 20990,
        discount: 14,
        stock: 12,
        images: [
          "/assets/images/product-images/tv-samsung-bu8100.jpg",
          "/assets/images/product-images/tv-samsung-bu8100-2.jpg",
          "/assets/images/product-images/tv-samsung-bu8100-3.jpg"
        ],
        delivery: {
          status: "available",
          estimatedDays: "พร้อมส่งทันที"
        },
        documents: {
          specs: "TV-SAM-BU8100-55-specs.pdf",
          manual: "TV-SAM-BU8100-55-manual.pdf",
          comparison: "Samsung-TV-comparison.pdf"
        },
        warranty: "รับประกัน 1 ปี โดยผู้ผลิต"
      },
      {
        id: "AC-DAIKIN-FTC15TV2S",
        name: "Daikin FTC15TV2S แอร์ผนัง Fixed Speed 15000 BTU",
        category: "เครื่องปรับอากาศ",
        brand: "Daikin",
        model: "FTC15TV2S",
        description: "เครื่องปรับอากาศ Daikin รุ่น FTC ชนิดติดผนัง ประหยัดพลังงานเบอร์ 5 ระบบ Fixed Speed ขนาด 15000 BTU",
        specs: {
          type: "แอร์ผนัง",
          btu: "15000",
          systemType: "Fixed Speed",
          energyRating: "เบอร์ 5",
          coolant: "R32",
          powerConsumption: "1,440 วัตต์",
          features: ["ประหยัดไฟ", "ระบบกรองอากาศ", "ระบบทำความสะอาดตัวเอง"]
        },
        price: 17900,
        originalPrice: 22900,
        discount: 22,
        stock: 8,
        images: [
          "/assets/images/product-images/ac-daikin-ftc15tv2s.jpg",
          "/assets/images/product-images/ac-daikin-ftc15tv2s-2.jpg"
        ],
        delivery: {
          status: "available",
          estimatedDays: "3-5"
        },
        documents: {
          specs: "AC-DAIKIN-FTC15TV2S-specs.pdf",
          manual: "AC-DAIKIN-FTC15TV2S-manual.pdf",
          comparison: "Daikin-AC-comparison.pdf"
        },
        warranty: "รับประกัน 5 ปี คอมเพรสเซอร์ และ 1 ปีอะไหล่"
      }
    ],
    
    // ข้อมูลลูกค้า
    customers: [
      {
        id: "CUST001",
        name: "คุณนภา วงศ์ประดิษฐ์",
        phone: "089-123-4567",
        email: "napha.w@example.com",
        address: "123/45 หมู่บ้านศุภาลัย ถนนเพชรเกษม แขวงหนองค้างพลู เขตหนองแขม กรุงเทพฯ 10160",
        status: "ส่งใบเสนอราคา",
        dateCreated: "2568-03-15T09:30:00",
        lastContact: "2568-04-13T14:30:00",
        notes: "สนใจเครื่องปรับอากาศ Daikin รุ่น FTC15TV2S",
        interestedProducts: ["AC-DAIKIN-FTC15TV2S"],
        documents: ["QUOT-20240413-001"],
        salesHistory: [],
        tags: ["ลูกค้าใหม่", "มีงบประมาณจำกัด"]
      },
      {
        id: "CUST002",
        name: "คุณสมศักดิ์ ใจดี",
        phone: "062-987-6543",
        email: "somsak.j@example.com",
        address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
        status: "ยืนยันการสั่งซื้อ",
        dateCreated: "2568-03-01T11:45:00",
        lastContact: "2568-04-14T09:20:00",
        notes: "ชอบดูหนังและเล่นเกมเป็นประจำ",
        interestedProducts: ["TV-SAM-QN90C-55"],
        documents: ["QUOT-20240410-002", "ORD-20240414-001", "INV-20240414-001"],
        salesHistory: ["SALE-123456"],
        tags: ["ลูกค้าประจำ", "พรีเมียม"]
      },
      {
        id: "CUST003",
        name: "คุณประภา เจริญพร",
        phone: "091-234-5678",
        email: "prapa.j@example.com",
        address: "89/12 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
        status: "สอบถามข้อมูล",
        dateCreated: "2568-04-10T16:30:00",
        lastContact: "2568-04-13T16:30:00",
        notes: "สอบถามข้อมูลเครื่องซักผ้า LG รุ่นใหม่",
        interestedProducts: ["WM-LG-FV1450S2B"],
        documents: [],
        salesHistory: [],
        tags: ["ลูกค้าใหม่"]
      }
    ],
    
    // ข้อมูลการขาย
    sales: [
      {
        id: "SALE-123456",
        customerId: "CUST002",
        customerName: "คุณสมศักดิ์ ใจดี",
        date: "2568-04-14T09:20:00",
        status: "ยืนยันการสั่งซื้อ",
        items: [
          {
            productId: "TV-SAM-QN90C-55",
            productName: "Samsung QN90C 55\" QLED 4K Smart TV",
            quantity: 1,
            unitPrice: 45990,
            discount: 0,
            total: 45990
          }
        ],
        subtotal: 45990,
        discount: 0,
        tax: "รวมในราคา",
        total: 45990,
        payment: {
          method: "บัตรเครดิต",
          status: "ชำระเงินแล้ว",
          date: "2568-04-14T09:20:00",
          reference: "REF123456789"
        },
        delivery: {
          method: "บริการส่งถึงบ้าน",
          address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
          scheduledDate: "2568-04-16",
          status: "รอจัดส่ง",
          notes: "โทรก่อนจัดส่ง 1 ชั่วโมง"
        },
        notes: "ลูกค้าขอให้จัดส่งในวันพฤหัสบดีที่ 16 เม.ย. และแจ้งเตือนก่อนจัดส่ง 1 ชั่วโมง",
        history: [
          {
            status: "ยืนยันการสั่งซื้อ",
            date: "2568-04-14T09:20:00",
            user: "คุณสมชาย (พนักงานขาย)",
            notes: "ลูกค้ายืนยันการสั่งซื้อและชำระเงินเรียบร้อยแล้ว"
          },
          {
            status: "ส่งใบเสนอราคา",
            date: "2568-04-13T14:30:00",
            user: "คุณสมชาย (พนักงานขาย)",
            notes: "ส่งใบเสนอราคาให้ลูกค้าผ่านทางอีเมล"
          },
          {
            status: "ลูกค้าสนใจ",
            date: "2568-04-12T11:15:00",
            user: "คุณสมชาย (พนักงานขาย)",
            notes: "ลูกค้าแสดงความสนใจในสินค้า Samsung QN90C 55\""
          },
          {
            status: "สอบถามข้อมูล",
            date: "2568-04-10T09:45:00",
            user: "คุณสมชาย (พนักงานขาย)",
            notes: "ลูกค้าสอบถามข้อมูลเกี่ยวกับทีวี Samsung"
          }
        ],
        documents: ["QUOT-20240410-002", "ORD-20240414-001", "INV-20240414-001"]
      }
    ],
    
    // ข้อมูลเอกสาร
    documents: [
      {
        id: "QUOT-20240413-001",
        type: "ใบเสนอราคา",
        title: "ใบเสนอราคา: เครื่องปรับอากาศ Daikin FTC15TV2S",
        customer: "CUST001",
        customerName: "คุณนภา วงศ์ประดิษฐ์",
        date: "2568-04-13T14:30:00",
        expiryDate: "2568-04-20T23:59:59",
        createdBy: "คุณสมชาย (พนักงานขาย)",
        fileName: "QUOT-20240413-001.pdf",
        fileSize: "245 KB",
        status: "ส่งให้ลูกค้าแล้ว",
        relatedProducts: ["AC-DAIKIN-FTC15TV2S"]
      },
      {
        id: "QUOT-20240410-002",
        type: "ใบเสนอราคา",
        title: "ใบเสนอราคา: Samsung QN90C 55\" QLED 4K Smart TV",
        customer: "CUST002",
        customerName: "คุณสมศักดิ์ ใจดี",
        date: "2568-04-10T15:45:00",
        expiryDate: "2568-04-17T23:59:59",
        createdBy: "คุณสมชาย (พนักงานขาย)",
        fileName: "QUOT-20240410-002.pdf",
        fileSize: "230 KB",
        status: "ลูกค้ายอมรับแล้ว",
        relatedProducts: ["TV-SAM-QN90C-55"]
      },
      {
        id: "ORD-20240414-001",
        type: "ใบสั่งซื้อ",
        title: "ใบสั่งซื้อ: Samsung QN90C 55\" QLED 4K Smart TV",
        customer: "CUST002",
        customerName: "คุณสมศักดิ์ ใจดี",
        date: "2568-04-14T09:20:00",
        createdBy: "คุณสมชาย (พนักงานขาย)",
        fileName: "ORD-20240414-001.pdf",
        fileSize: "210 KB",
        status: "ดำเนินการแล้ว",
        relatedProducts: ["TV-SAM-QN90C-55"]
      },
      {
        id: "INV-20240414-001",
        type: "ใบเสร็จรับเงิน",
        title: "ใบเสร็จรับเงิน: Samsung QN90C 55\" QLED 4K Smart TV",
        customer: "CUST002",
        customerName: "คุณสมศักดิ์ ใจดี",
        date: "2568-04-14T09:20:00",
        createdBy: "คุณสมชาย (พนักงานขาย)",
        fileName: "INV-20240414-001.pdf",
        fileSize: "198 KB",
        status: "ชำระเงินแล้ว",
        relatedProducts: ["TV-SAM-QN90C-55"]
      },
      {
        id: "DOC-SPEC-TV-SAM-QN90C-55",
        type: "สเปคสินค้า",
        title: "สเปคสินค้า: Samsung QN90C 55\" QLED 4K Smart TV",
        date: "2568-02-01T00:00:00",
        createdBy: "ระบบ",
        fileName: "TV-SAM-QN90C-55-specs.pdf",
        fileSize: "1.2 MB",
        status: "เผยแพร่",
        relatedProducts: ["TV-SAM-QN90C-55"]
      },
      {
        id: "DOC-MANUAL-TV-SAM-QN90C-55",
        type: "คู่มือการใช้งาน",
        title: "คู่มือการใช้งาน: Samsung QN90C 55\" QLED 4K Smart TV",
        date: "2568-02-01T00:00:00",
        createdBy: "ระบบ",
        fileName: "TV-SAM-QN90C-55-manual.pdf",
        fileSize: "5.4 MB",
        status: "เผยแพร่",
        relatedProducts: ["TV-SAM-QN90C-55"]
      }
    ],
    
    // ข้อมูลสถิติและรายงาน
    statistics: {
      salesOverview: {
        totalSales: 8,
        totalAmount: 342500,
        targetAmount: 400000,
        completionRate: 85,
        averageOrderValue: 42812.5,
        conversionRate: 75
      },
      salesByMonth: [
        { month: "ม.ค.", amount: 28500 },
        { month: "ก.พ.", amount: 47500 },
        { month: "มี.ค.", amount: 82500 },
        { month: "เม.ย.", amount: 184000 },
        { month: "พ.ค.", amount: 0 },
        { month: "มิ.ย.", amount: 0 },
        { month: "ก.ค.", amount: 0 },
        { month: "ส.ค.", amount: 0 },
        { month: "ก.ย.", amount: 0 },
        { month: "ต.ค.", amount: 0 },
        { month: "พ.ย.", amount: 0 },
        { month: "ธ.ค.", amount: 0 }
      ],
      salesPipeline: [
        { status: "สอบถามข้อมูล", count: 5, amount: 123500 },
        { status: "ลูกค้าสนใจ", count: 3, amount: 72000 },
        { status: "ส่งใบเสนอราคา", count: 4, amount: 98000 },
        { status: "ต่อรองราคา", count: 2, amount: 62000 },
        { status: "ยืนยันการสั่งซื้อ", count: 3, amount: 95000 },
        { status: "ส่งมอบสินค้า", count: 1, amount: 45990 },
        { status: "บริการหลังการขาย", count: 1, amount: 38000 }
      ],
      topProducts: [
        {
          id: "TV-SAM-QN90C-55",
          name: "Samsung QN90C 55\" QLED 4K Smart TV",
          unitsSold: 3,
          revenue: 137970,
          profitMargin: 22
        },
        {
          id: "TV-SAM-BU8100-55",
          name: "Samsung BU8100 55\" Crystal UHD 4K Smart TV",
          unitsSold: 2,
          revenue: 35980,
          profitMargin: 18
        },
        {
          id: "AC-DAIKIN-FTC15TV2S",
          name: "Daikin FTC15TV2S แอร์ผนัง Fixed Speed 15000 BTU",
          unitsSold: 2,
          revenue: 35800,
          profitMargin: 15
        }
      ]
    },
    
    // ข้อมูลผู้ใช้
    user: {
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
    }
  };
  

  // ฟังก์ชันเปิด Share Modal และดึงข้อมูลจาก API
async function openShareModal(productId) {
  console.log('กำลังเปิด Share Modal สำหรับสินค้า:', productId);
  
  try {
    // แสดง loading indicator
    const loadingModal = createLoadingModal();
    document.body.appendChild(loadingModal);
    
    // ดึงข้อมูลสินค้าจาก API
    const product = await fetchProductFromAPI(productId);
    
    // ปิด loading indicator
    document.body.removeChild(loadingModal);
    
    if (!product) {
      showErrorToast('ไม่พบข้อมูลสินค้า');
      return;
    }
    
    // สร้าง Modal element
    const modalBackdrop = createModalFromTemplate();
    
    // เพิ่ม Modal ไปยัง body
    document.body.appendChild(modalBackdrop);
    
    // อัพเดทข้อมูลสินค้าใน Modal
    updateProductInfo(modalBackdrop, product);
    
    // ตั้งค่า event listeners
    setupEventListeners(modalBackdrop, product);
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
    showErrorToast('ไม่สามารถโหลดข้อมูลสินค้าได้ โปรดลองใหม่อีกครั้ง');
  }
}

// ฟังก์ชันดึงข้อมูลสินค้าจาก API
async function fetchProductFromAPI(productId) {
  try {
    const response = await fetch(`https://s9ohxtt51a.execute-api.us-east-1.amazonaws.com/GetProducts?product_id=${productId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจาก API:', error);
    throw error;
  }
}

// ฟังก์ชันสร้าง loading modal
function createLoadingModal() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'modal-backdrop';
  loadingDiv.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>กำลังโหลดข้อมูลสินค้า...</p>
    </div>
  `;
  return loadingDiv;
}

// ฟังก์ชันสร้าง Modal จาก Template
function createModalFromTemplate() {
  const modalTemplate = document.getElementById('share-modal-template');
  const modalContent = modalTemplate.innerHTML;
  
  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.style.display = 'flex';
  modalBackdrop.innerHTML = modalContent;
  
  return modalBackdrop;
}

// ฟังก์ชันอัพเดทข้อมูลสินค้าใน Modal
function updateProductInfo(modalElement, product) {
  // อัพเดทชื่อสินค้า
  const productNameElement = modalElement.querySelector('#product-name');
  if (productNameElement) {
    productNameElement.textContent = product.product_name;
  }
  
  // อัพเดทรหัสสินค้า
  const productCodeElement = modalElement.querySelector('#product-code');
  if (productCodeElement) {
    productCodeElement.textContent = `รหัสสินค้า: ${product.product_id}`;
  }
  
  // อัพเดทราคา
  const productPriceElement = modalElement.querySelector('#product-price');
  if (productPriceElement) {
    productPriceElement.textContent = `฿${Number(product.price).toLocaleString()}`;
  }
  
  // อัพเดทรูปภาพ
  const productImageElement = modalElement.querySelector('#product-image');
  if (productImageElement && product.imgurl) {
    productImageElement.style.backgroundImage = `url('${product.imgurl}')`;
    productImageElement.style.backgroundSize = 'cover';
    productImageElement.style.backgroundPosition = 'center';
  }
}

// ฟังก์ชันตั้งค่า event listeners
function setupEventListeners(modalElement, product) {
  // ปุ่มปิด Modal
  const closeButtons = modalElement.querySelectorAll('.modal-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.body.removeChild(modalElement);
    });
  });
  
  // ปุ่มส่งข้อมูล
  const sendButton = modalElement.querySelector('#sendDocuments');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      handleSendData(modalElement, product);
    });
  }
  
  // ช่องทางการส่ง
  const shareMethods = modalElement.querySelectorAll('.share-method');
  shareMethods.forEach(method => {
    method.addEventListener('click', (event) => {
      const methodType = event.currentTarget.getAttribute('data-method');
      selectShareMethod(modalElement, methodType);
    });
  });
}

// ฟังก์ชันเลือกช่องทางการส่ง
function selectShareMethod(modalElement, methodType) {
  // ล้างการเลือกช่องทางทั้งหมด
  const shareMethods = modalElement.querySelectorAll('.share-method');
  shareMethods.forEach(method => {
    method.classList.remove('selected');
  });
  
  // เลือกช่องทางที่คลิก
  const selectedMethod = modalElement.querySelector(`.share-method[data-method="${methodType}"]`);
  if (selectedMethod) {
    selectedMethod.classList.add('selected');
  }
}

// ฟังก์ชันจัดการการส่งข้อมูล
function handleSendData(modalElement, product) {
  // ตรวจสอบว่าเลือกลูกค้าหรือไม่
  const customerSelect = modalElement.querySelector('#customer-select');
  const customerContact = modalElement.querySelector('#customer-contact');
  
  let recipient = '';
  
  if (customerSelect && customerSelect.value) {
    recipient = customerSelect.options[customerSelect.selectedIndex].text;
  } else if (customerContact && customerContact.value) {
    recipient = customerContact.value;
  } else {
    showErrorToast('กรุณาเลือกหรือระบุลูกค้าที่ต้องการส่งข้อมูล');
    return;
  }
  
  // ตรวจสอบว่าเลือกช่องทางการส่งหรือไม่
  const selectedMethod = modalElement.querySelector('.share-method.selected');
  if (!selectedMethod) {
    showErrorToast('กรุณาเลือกช่องทางการส่งข้อมูล');
    return;
  }
  
  const methodType = selectedMethod.getAttribute('data-method');
  
  // รวบรวมข้อมูลที่เลือก
  const selectedOptions = getSelectedOptions(modalElement);
  
  // ข้อความเพิ่มเติม
  const customMessage = modalElement.querySelector('#custom-message').value;
  
  // แสดงข้อความยืนยัน
  showSuccessToast(`ส่งข้อมูลสินค้า ${product.product_name} ให้ ${recipient} ทาง ${getMethodName(methodType)} เรียบร้อยแล้ว`);
  
  // ปิด Modal
  document.body.removeChild(modalElement);
}

// ฟังก์ชันรวบรวมตัวเลือกที่เลือก
function getSelectedOptions(modalElement) {
  const selectedOptions = {
    documents: [],
    info: []
  };
  
  // ตรวจสอบเอกสารที่เลือก
  const documentCheckboxes = modalElement.querySelectorAll('#document-options input[type="checkbox"]');
  documentCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedOptions.documents.push(checkbox.id);
    }
  });
  
  // ตรวจสอบข้อมูลราคาและสต๊อกที่เลือก
  if (modalElement.querySelector('#price').checked) {
    selectedOptions.info.push('price');
  }
  
  if (modalElement.querySelector('#stock').checked) {
    selectedOptions.info.push('stock');
  }
  
  if (modalElement.querySelector('#delivery').checked) {
    selectedOptions.info.push('delivery');
  }
  
  if (modalElement.querySelector('#warranty').checked) {
    selectedOptions.info.push('warranty');
  }
  
  return selectedOptions;
}

// ฟังก์ชันแปลงชื่อช่องทางการส่ง
function getMethodName(methodType) {
  const methodNames = {
    'line': 'LINE',
    'email': 'อีเมล',
    'sms': 'SMS',
    'qr': 'QR Code'
  };
  
  return methodNames[methodType] || methodType;
}

// ฟังก์ชันแสดง Toast สำเร็จ
function showSuccessToast(message) {
  showToast(message, 'success');
}

// ฟังก์ชันแสดง Toast ผิดพลาด
function showErrorToast(message) {
  showToast(message, 'error');
}

// ฟังก์ชันแสดง Toast
function showToast(message, type = 'info') {
  // ตรวจสอบว่ามี toast-container หรือไม่
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // สร้าง toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // เลือกไอคอนตามประเภท
  let icon = 'info-circle';
  if (type === 'success') {
    icon = 'check-circle';
  } else if (type === 'error') {
    icon = 'exclamation-circle';
  }
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="toast-content">
      <p>${message}</p>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // เพิ่ม toast ไปยัง container
  toastContainer.appendChild(toast);
  
  // ตั้งค่า event listener สำหรับปุ่มปิด
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  });
  
  // ตั้งเวลาลบ toast
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// ตั้งค่า event listener สำหรับปุ่มแชร์สินค้า
document.addEventListener('DOMContentLoaded', () => {
  const shareButtons = document.querySelectorAll('.share-product');
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      openShareModal(productId);
    });
  });
});
  // ส่งออกข้อมูล mockup สำหรับนำไปใช้ในส่วนอื่นๆ ของแอปพลิเคชัน
  export default mockupData;