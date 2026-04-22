// ============================================
// NEW SERVICE - Form Logic
// ============================================

let screenCondition = 'broken';
let powerCondition = 'off';
let currentServiceId = '';
let editMode = false;
let editServiceId = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check if editing
  const params = new URLSearchParams(window.location.search);
  editServiceId = params.get('edit');

  if (editServiceId) {
    editMode = true;
    currentServiceId = editServiceId;
    document.getElementById('display-service-id').textContent = currentServiceId;
    populateEditForm(editServiceId);
  } else {
    currentServiceId = generateServiceId();
    document.getElementById('display-service-id').textContent = currentServiceId;
    // Set today as received date
    document.getElementById('receivedDate').value = todayISO();
    // Default expected delivery: 3 days later
    const exp = new Date();
    exp.setDate(exp.getDate() + 3);
    document.getElementById('expectedDate').value = exp.toISOString().split('T')[0];
  }

  // Set initial condition
  setCondition('screen', 'broken');
  setCondition('power', 'off');

  // Select default radio chips
  document.querySelectorAll('.radio-chip').forEach(chip => {
    const input = chip.querySelector('input[type="radio"]');
    if (input && input.checked) chip.classList.add('selected');
  });
});

// ── Condition Toggles ──
function setCondition(type, value) {
  if (type === 'screen') {
    screenCondition = value;
    document.getElementById('screen-broken').className = 'toggle-btn' + (value === 'broken' ? ' active-broken' : '');
    document.getElementById('screen-not_broken').className = 'toggle-btn' + (value === 'not_broken' ? ' active-ok' : '');
  } else {
    powerCondition = value;
    document.getElementById('power-on').className = 'toggle-btn' + (value === 'on' ? ' active-on' : '');
    document.getElementById('power-off').className = 'toggle-btn' + (value === 'off' ? ' active-off' : '');
  }
}

// ── Chip Toggle ──
function toggleChip(label) {
  const input = label.querySelector('input[type="checkbox"]');
  if (!input) return;
  setTimeout(() => {
    if (input.checked) label.classList.add('checked');
    else label.classList.remove('checked');
  }, 0);
}

function toggleSpareTag(label) {
  const input = label.querySelector('input[type="checkbox"]');
  if (!input) return;
  setTimeout(() => {
    if (input.checked) label.classList.add('checked');
    else label.classList.remove('checked');
  }, 0);
}

// ── Radio Chip Select ──
function selectRadio(clicked, groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.radio-chip').forEach(c => c.classList.remove('selected'));
  clicked.classList.add('selected');
}

// ── Auto Calc Total ──
function calcTotal() {
  const sc = parseFloat(document.getElementById('serviceCharge').value) || 0;
  const sp = parseFloat(document.getElementById('sparePartsCost').value) || 0;
  const total = sc + sp;
  document.getElementById('totalAmount').textContent = `₹${total.toLocaleString('en-IN')}`;
}

// ── Device Image Update ──
function updateDeviceImage() {
  const mobileName = document.getElementById('mobileName').value.trim();

  const nameDisplay = document.getElementById('device-name-preview');
  const brandBadge = document.getElementById('device-brand-badge');
  const container = document.getElementById('device-img-container');

  if (mobileName) {
    const brand = mobileName.split(' ')[0] || '';
    const model = mobileName.substring(brand.length).trim() || mobileName;

    nameDisplay.textContent = mobileName;
    brandBadge.textContent = brand;

    const imgUrl = resolveDeviceImage(brand, model);

    if (imgUrl) {
      container.innerHTML = `<img src="${imgUrl}" alt="${mobileName}" 
        style="width:100%;height:100%;object-fit:contain;padding:8px"
        onerror="showBrandFallback('${brand}')"/>`;
    } else {
      showBrandFallback(brand);
    }
  } else {
    nameDisplay.textContent = '—';
    brandBadge.textContent = 'Brand';
    container.innerHTML = `
      <div class="device-placeholder">
        <div class="ph-icon">📱</div>
        <p>Enter mobile name</p>
      </div>`;
  }
}

function showBrandFallback(brand) {
  const container = document.getElementById('device-img-container');
  const emoji = getBrandEmoji(brand);
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px">
      <div style="font-size:60px">${emoji}</div>
      <div style="font-size:12px;font-weight:700;color:var(--accent-primary)">${brand}</div>
    </div>`;
}

function getBrandEmoji(brand) {
  const map = {
    'samsung': '🌌', 'iphone': '🍎', 'apple': '🍎',
    'xiaomi': '🔴', 'redmi': '🔴', 'oppo': '🟢',
    'vivo': '🔵', 'oneplus': '🟠', 'realme': '⚡',
    'nokia': '🔷', 'motorola': '〽️', 'sony': '🎵',
    'huawei': '🌸', 'lg': '🟣', 'asus': '⚙️',
  };
  for (const [k, v] of Object.entries(map)) {
    if (brand.toLowerCase().includes(k)) return v;
  }
  return '📱';
}

// ── Customer Preview ──
function updatePreview() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const card = document.getElementById('customer-preview-card');

  if (name || phone) {
    card.style.display = 'block';
    document.getElementById('cust-name-preview').textContent = name || '—';
    document.getElementById('cust-phone-preview').textContent = phone ? `📞 ${phone}` : '—';
  } else {
    card.style.display = 'none';
  }
}

// ── Collect Form Data ──
function collectFormData() {
  const problems = [...document.querySelectorAll('#problems-group input:checked')].map(i => i.value);
  const problemType = (document.querySelector('input[name="problemType"]:checked') || {}).value || '';
  const serviceStatus = (document.querySelector('input[name="serviceStatus"]:checked') || {}).value || 'pending';
  const paymentStatus = (document.querySelector('input[name="paymentStatus"]:checked') || {}).value || 'unpaid';
  const spareParts = [...document.querySelectorAll('#spare-parts-group input:checked')].map(i => i.value);
  const serviceCharge = parseFloat(document.getElementById('serviceCharge').value) || 0;
  const sparePartsCost = parseFloat(document.getElementById('sparePartsCost').value) || 0;

  return {
    serviceId: currentServiceId,
    receivedDate: document.getElementById('receivedDate').value,
    expectedDate: document.getElementById('expectedDate').value,
    deliveryDate: document.getElementById('deliveryDate').value,
    customerName: document.getElementById('customerName').value.trim(),
    customerPhone: document.getElementById('customerPhone').value.trim(),
    customerEmail: '',
    brand: document.getElementById('mobileName').value.trim().split(' ')[0] || '',
    model: document.getElementById('mobileName').value.trim().substring((document.getElementById('mobileName').value.trim().split(' ')[0] || '').length).trim() || document.getElementById('mobileName').value.trim(),
    imei: document.getElementById('imei').value.trim(),
    color: document.getElementById('color').value.trim(),
    problems,
    problemType,
    problemDescription: document.getElementById('problemDescription').value.trim(),
    screenCondition,
    powerCondition,
    technician: document.getElementById('technician').value.trim(),
    workDone: document.getElementById('workDone').value.trim(),
    spareParts,
    serviceStatus,
    serviceCharge,
    sparePartsCost,
    totalAmount: serviceCharge + sparePartsCost,
    paymentStatus,
    createdAt: new Date().toISOString(),
  };
}

// ── Validate ──
function validate(data) {
  const errors = [];
  if (!data.customerName) errors.push('Customer name is required');
  if (!data.customerPhone || data.customerPhone.length < 10) errors.push('Valid phone number is required');
  if (!data.brand) errors.push('Mobile name is required');
  if (data.problems.length === 0) errors.push('Select at least one problem');
  if (!data.problemType) errors.push('Select problem type');
  if (!data.receivedDate) errors.push('Received date is required');
  return errors;
}

// ── Save Form ──
function saveForm() {
  const data = collectFormData();
  const errors = validate(data);

  if (errors.length > 0) {
    showToast('Validation Error', errors[0], 'error');
    return;
  }

  saveService(data);
  showToast('Service Saved! ✅', `${data.serviceId} – ${data.brand} ${data.model}`, 'success');

  setTimeout(() => {
    window.location.href = `view-service.html?id=${data.serviceId}`;
  }, 1500);
}

// ── Save + Send SMS ──
function saveAndSendSMS() {
  const data = collectFormData();
  const errors = validate(data);

  if (errors.length > 0) {
    showToast('Validation Error', errors[0], 'error');
    return;
  }

  saveService(data);

  // Send SMS
  const brandModel = `${data.brand} ${data.model}`;
  const smsMsg = getSMSMessage(data.serviceId, data.serviceStatus, brandModel);
  sendSMS(data.customerName, data.customerPhone, data.serviceId, data.serviceStatus, smsMsg);

  setTimeout(() => {
    window.location.href = `view-service.html?id=${data.serviceId}`;
  }, 2000);
}

// ── Reset Form ──
function resetForm() {
  if (!confirm('Reset all fields? This cannot be undone.')) return;
  document.querySelectorAll('.form-control').forEach(el => el.value = '');
  document.querySelectorAll('.checkbox-chip').forEach(c => c.classList.remove('checked'));
  document.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
  document.querySelectorAll('.spare-tag').forEach(c => c.classList.remove('checked'));
  document.querySelectorAll('.radio-chip').forEach(c => c.classList.remove('selected'));
  setCondition('screen', 'broken');
  setCondition('power', 'off');
  document.getElementById('receivedDate').value = todayISO();
  document.getElementById('totalAmount').textContent = '₹0';
  updateDeviceImage();
  showToast('Form Reset', 'All fields have been cleared', 'info');
}

// ── Populate Edit Form ──
function populateEditForm(sid) {
  const s = getService(sid);
  if (!s) { showToast('Error', 'Service not found', 'error'); return; }

  document.getElementById('customerName').value = s.customerName || '';
  document.getElementById('customerPhone').value = s.customerPhone || '';
  document.getElementById('mobileName').value = ((s.brand ? s.brand + ' ' : '') + (s.model || '')).trim();
  document.getElementById('imei').value = s.imei || '';
  document.getElementById('color').value = s.color || '';
  document.getElementById('problemDescription').value = s.problemDescription || '';
  document.getElementById('receivedDate').value = s.receivedDate || '';
  document.getElementById('expectedDate').value = s.expectedDate || '';
  document.getElementById('deliveryDate').value = s.deliveryDate || '';
  document.getElementById('technician').value = s.technician || '';
  document.getElementById('workDone').value = s.workDone || '';
  document.getElementById('serviceCharge').value = s.serviceCharge || '';
  document.getElementById('sparePartsCost').value = s.sparePartsCost || '';

  // Problems
  if (s.problems) {
    s.problems.forEach(p => {
      const input = document.querySelector(`#problems-group input[value="${p}"]`);
      if (input) { input.checked = true; input.closest('.checkbox-chip').classList.add('checked'); }
    });
  }

  // Problem type
  if (s.problemType) {
    const ptInput = document.querySelector(`input[name="problemType"][value="${s.problemType}"]`);
    if (ptInput) {
      ptInput.checked = true;
      ptInput.closest('.radio-chip').classList.add('selected');
    }
  }

  // Spare parts
  if (s.spareParts) {
    s.spareParts.forEach(p => {
      const input = document.querySelector(`#spare-parts-group input[value="${p}"]`);
      if (input) { input.checked = true; input.closest('.spare-tag').classList.add('checked'); }
    });
  }

  // Status
  const stInput = document.querySelector(`input[name="serviceStatus"][value="${s.serviceStatus}"]`);
  if (stInput) { stInput.checked = true; stInput.closest('.radio-chip').classList.add('selected'); }

  // Payment
  const pmInput = document.querySelector(`input[name="paymentStatus"][value="${s.paymentStatus}"]`);
  if (pmInput) { pmInput.checked = true; pmInput.closest('.radio-chip').classList.add('selected'); }

  // Conditions
  setCondition('screen', s.screenCondition || 'not_broken');
  setCondition('power', s.powerCondition || 'on');

  calcTotal();
  updateDeviceImage();
  updatePreview();
}
