// ============================================
// MOBITRACKER - Core Data Layer & Utilities
// ============================================

const DB_KEY = 'mobitracker_services';
const COUNTER_KEY = 'mobitracker_counter';

// ── Device Image Sources (GSMArena fallback + brand logos) ──
const BRAND_IMAGES = {
  'samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/480px-Samsung_Logo.svg.png',
  'apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png',
  'iphone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png',
  'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/480px-Xiaomi_logo.svg.png',
  'redmi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/480px-Xiaomi_logo.svg.png',
  'oppo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Oppo_Logo.svg/480px-Oppo_Logo.svg.png',
  'vivo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Vivo_logo.svg/480px-Vivo_logo.svg.png',
  'oneplus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/OnePlus_logo.svg/480px-OnePlus_logo.svg.png',
  'realme': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Realme_logo.svg/480px-Realme_logo.svg.png',
  'nokia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Nokia_wordmark.svg/480px-Nokia_wordmark.svg.png',
  'motorola': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Motorola_logo_2021.svg/480px-Motorola_logo_2021.svg.png',
  'huawei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Huawei_logo.svg/480px-Huawei_logo.svg.png',
  'sony': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/480px-Sony_logo.svg.png',
  'lg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/LG_logo_%282015%29.svg/480px-LG_logo_%282015%29.svg.png',
  'asus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/480px-ASUS_Logo.svg.png',
  'tecno': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Tecno_logo.svg/480px-Tecno_logo.svg.png',
  'infinix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Infinix_Logo.svg/480px-Infinix_Logo.svg.png',
  'itel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Itel_logo.png/480px-Itel_logo.png',
};

// Specific phone model images
const MODEL_IMAGES = {
  'iphone 15 pro': 'https://www.apple.com/v/iphone-15-pro/c/images/overview/hero/hero_endframe__bx048iapmniq_large.jpg',
  'iphone 15': 'https://www.apple.com/v/iphone-15/c/images/overview/hero/hero_endframe__bx048iapmniq_large.jpg',
  'iphone 14': 'https://www.apple.com/v/iphone-14/b/images/overview/hero/hero_endframe__bx048iapmniq_large.jpg',
  'samsung s24': 'https://images.samsung.com/is/image/samsung/p6pim/global/2401/gallery/global-galaxy-s24-s928-sm-s928bzkcxfe-thumb-539716823',
  'samsung galaxy s24': 'https://images.samsung.com/is/image/samsung/p6pim/global/2401/gallery/global-galaxy-s24-s928-sm-s928bzkcxfe-thumb-539716823',
};

// ──────────────────────────────
// Service ID Generator
// ──────────────────────────────
function generateServiceId() {
  const counter = (parseInt(localStorage.getItem(COUNTER_KEY) || '0') + 1);
  localStorage.setItem(COUNTER_KEY, counter.toString());
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `SRV-${year}${month}-${String(counter).padStart(4, '0')}`;
}

// ──────────────────────────────
// Data Layer
// ──────────────────────────────
function getAllServices() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function saveServices(services) {
  localStorage.setItem(DB_KEY, JSON.stringify(services));
}

function getService(id) {
  return getAllServices().find(s => s.serviceId === id);
}

function saveService(service) {
  const services = getAllServices();
  const idx = services.findIndex(s => s.serviceId === service.serviceId);
  if (idx >= 0) {
    services[idx] = service;
  } else {
    services.unshift(service);
  }
  saveServices(services);
  return service;
}

function deleteService(id) {
  const services = getAllServices().filter(s => s.serviceId !== id);
  saveServices(services);
}

// ──────────────────────────────
// SMS Simulation
// ──────────────────────────────
function sendSMS(customerName, phone, serviceId, status, message) {
  // Log the SMS in localStorage history
  const smsLog = JSON.parse(localStorage.getItem('mobitracker_sms') || '[]');
  smsLog.unshift({
    to: phone,
    customerName,
    serviceId,
    status,
    message,
    sentAt: new Date().toISOString()
  });
  localStorage.setItem('mobitracker_sms', JSON.stringify(smsLog.slice(0, 100)));

  // Open WhatsApp Web/App
  const encodedMessage = encodeURIComponent(message);
  let waPhone = phone.replace(/\D/g, '');
  if (waPhone.length === 10) waPhone = '91' + waPhone; // Default to India country code
  window.open(`https://wa.me/${waPhone}?text=${encodedMessage}`, '_blank');

  // Show toast
  showToast('Opening WhatsApp 📱', `Preparing message for ${customerName}`, 'info');
}

function getSMSMessage(serviceId, status, brandModel) {
  const messages = {
    'pending': `Dear Customer, Your ${brandModel} (Ref: ${serviceId}) has been received. We will keep you updated. - MobiTracker`,
    'in_progress': `Dear Customer, Our technician has started working on your ${brandModel} (Ref: ${serviceId}). - MobiTracker`,
    'completed': `Dear Customer, Your ${brandModel} (Ref: ${serviceId}) repair is COMPLETED and ready for pickup! - MobiTracker`,
  };
  return messages[status] || messages['pending'];
}

// ──────────────────────────────
// Device Image Resolver
// ──────────────────────────────
function resolveDeviceImage(brand, model) {
  const combined = `${brand} ${model}`.toLowerCase().trim();
  const brandLower = brand.toLowerCase().trim();
  const modelLower = model.toLowerCase().trim();

  // Check specific model first
  for (const [key, url] of Object.entries(MODEL_IMAGES)) {
    if (combined.includes(key) || modelLower.includes(key)) return url;
  }

  // Then try brand image
  for (const [key, url] of Object.entries(BRAND_IMAGES)) {
    if (brandLower.includes(key) || combined.includes(key)) return url;
  }

  // Fallback: use DummyImage with brand name
  return null;
}

// ──────────────────────────────
// Toast System
// ──────────────────────────────
function showToast(title, message, type = 'success', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || '🔔'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:0 4px;">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutToast 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ──────────────────────────────
// Date Utilities
// ──────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// ──────────────────────────────
// Status Helpers
// ──────────────────────────────
function statusBadge(status) {
  const map = {
    'pending': '<span class="badge badge-pending"><span class="badge-dot"></span>Pending</span>',
    'in_progress': '<span class="badge badge-progress"><span class="badge-dot"></span>In Progress</span>',
    'completed': '<span class="badge badge-completed"><span class="badge-dot"></span>Completed</span>',
  };
  return map[status] || '<span class="badge badge-pending">—</span>';
}

function paymentBadge(status) {
  const map = {
    'paid': '<span class="badge badge-paid"><span class="badge-dot"></span>Paid</span>',
    'unpaid': '<span class="badge badge-unpaid"><span class="badge-dot"></span>Unpaid</span>',
  };
  return map[status] || '<span class="badge badge-unpaid">—</span>';
}

// ──────────────────────────────
// Active Nav Highlight
// ──────────────────────────────
function highlightActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && (href === current || (current === '' && href === 'index.html'))) {
      item.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightActiveNav);

// ──────────────────────────────
// Seed Demo Data (first run)
// ──────────────────────────────
function seedDemoData() {
  if (getAllServices().length > 0) return;

  const demos = [
    {
      serviceId: 'SRV-202604-0001',
      receivedDate: '2026-04-01',
      expectedDate: '2026-04-05',
      deliveryDate: '2026-04-05',
      brand: 'Samsung',
      model: 'Galaxy S24',
      imei: '354678901234567',
      color: 'Phantom Black',
      customerName: 'Rajesh Kumar',
      customerPhone: '9876543210',
      customerEmail: 'rajesh@email.com',
      problems: ['display_not_working', 'touch_issue'],
      problemType: 'display_issue',
      problemDescription: 'Display not working after drop. Touch also not responding.',
      screenCondition: 'broken',
      powerCondition: 'off',
      workDone: 'Replaced display assembly with original Samsung screen.',
      spareParts: ['screen'],
      serviceStatus: 'completed',
      serviceCharge: 500,
      sparePartsCost: 3200,
      totalAmount: 3700,
      paymentStatus: 'paid',
    },
    {
      serviceId: 'SRV-202604-0002',
      receivedDate: '2026-04-03',
      expectedDate: '2026-04-07',
      deliveryDate: '',
      brand: 'iPhone',
      model: '14 Pro',
      imei: '352011021234567',
      color: 'Deep Purple',
      customerName: 'Priya Sharma',
      customerPhone: '9123456789',
      customerEmail: 'priya@email.com',
      problems: ['battery_issue'],
      problemType: 'hardware_issue',
      problemDescription: 'Battery draining very fast. Device turns off at 30%.',
      screenCondition: 'not_broken',
      powerCondition: 'on',
      workDone: '',
      spareParts: ['battery'],
      serviceStatus: 'in_progress',
      serviceCharge: 300,
      sparePartsCost: 1800,
      totalAmount: 2100,
      paymentStatus: 'unpaid',
    },
    {
      serviceId: 'SRV-202604-0003',
      receivedDate: '2026-04-08',
      expectedDate: '2026-04-12',
      deliveryDate: '',
      brand: 'Xiaomi',
      model: 'Redmi Note 13',
      imei: '860342011234567',
      color: 'Midnight Black',
      customerName: 'Arun Babu',
      customerPhone: '9988776655',
      customerEmail: '',
      problems: ['charging_problem'],
      problemType: 'hardware_issue',
      problemDescription: 'Phone not charging. Charging port seems damaged.',
      screenCondition: 'not_broken',
      powerCondition: 'on',
      workDone: '',
      spareParts: ['charging_port'],
      serviceStatus: 'pending',
      serviceCharge: 200,
      sparePartsCost: 350,
      totalAmount: 550,
      paymentStatus: 'unpaid',
    }
  ];

  localStorage.setItem(COUNTER_KEY, '3');
  saveServices(demos);
}

// Run seed on first load
seedDemoData();
