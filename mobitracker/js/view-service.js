// ============================================
// VIEW SERVICE - Detail Page Logic
// ============================================

let currentService = null;

const PROBLEM_LABELS = {
  display_not_working: '📵 Display Not Working',
  touch_issue: '👆 Touch Issue',
  battery_issue: '🔋 Battery Issue',
  charging_problem: '⚡ Charging Problem',
  sound_problem: '🔇 Sound Problem',
  camera_issue: '📷 Camera Issue',
  wifi_issue: '📶 WiFi/Network Issue',
  overheating: '🌡️ Overheating',
  mic_issue: '🎤 Mic Not Working',
  power_issue: '🔌 Not Switching On',
  software_crash: '💻 Software Crash',
  water_damage: '💧 Water Damage',
};

const SPARE_LABELS = {
  screen: '📱 Screen/Display',
  battery: '🔋 Battery',
  charging_port: '⚡ Charging Port',
  speaker: '🔊 Speaker',
  mic: '🎤 Microphone',
  camera: '📷 Camera Module',
  back_cover: '🛡️ Back Cover',
  power_button: '🔘 Power Button',
  volume_button: '🔉 Volume Button',
  motherboard: '🖥️ Motherboard',
  sim_tray: '📤 SIM Tray',
  front_camera: '🤳 Front Camera',
};

const PROBLEM_TYPE_LABELS = {
  display_issue: '📵 Display Issue',
  software_issue: '💻 Software Issue',
  hardware_issue: '🔧 Hardware Issue',
  water_damage: '💧 Water Damage',
};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'records.html'; return; }

  currentService = getService(id);
  if (!currentService) {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Service Not Found</h3>
        <p>The service ID "${id}" does not exist.</p>
        <a href="records.html" class="btn btn-primary" style="margin-top:16px">← Back to Records</a>
      </div>`;
    return;
  }

  renderPage(currentService);
});

function renderPage(s) {
  // Update topbar
  document.getElementById('topbar-title').innerHTML = `
    <span style="color:var(--text-muted);font-size:13px">Service / </span>${s.serviceId}`;

  document.getElementById('topbar-actions').innerHTML = `
    <a href="records.html" class="btn btn-secondary">← Records</a>
    <a href="new-service.html?edit=${s.serviceId}" class="btn btn-secondary">✏️ Edit</a>
    <button class="btn btn-primary" onclick="openSMSModal()">📱 Send WhatsApp</button>
  `;

  // Device image
  const deviceImgHtml = buildDeviceImageHtml(s);

  // Problems
  const problemChips = (s.problems || []).map(p =>
    `<span class="problem-chip-display">${PROBLEM_LABELS[p] || p}</span>`
  ).join('') || '<span class="text-muted text-sm">None specified</span>';

  // Spare parts
  const spareChips = (s.spareParts || []).map(p =>
    `<span class="spare-chip-display">${SPARE_LABELS[p] || p}</span>`
  ).join('') || '<span class="text-muted text-sm">None used</span>';

  // Conditions
  const screenCond = s.screenCondition === 'broken'
    ? '<span class="cond-badge cond-broken">💔 Screen Broken</span>'
    : '<span class="cond-badge cond-ok">✅ Screen OK</span>';
  const powerCond = s.powerCondition === 'off'
    ? '<span class="cond-badge cond-off">❌ Power Off</span>'
    : '<span class="cond-badge cond-on">⚡ Power On</span>';

  // SMS History
  const smsLog = JSON.parse(localStorage.getItem('mobitracker_sms') || '[]')
    .filter(m => m.serviceId === s.serviceId);

  const smsHistoryHtml = smsLog.length === 0
    ? '<div style="color:var(--text-muted);font-size:12px">No WhatsApp messages sent yet</div>'
    : smsLog.map(m => `
        <div class="sms-item">
          <div class="sms-meta">
            <span class="sms-to">📞 ${m.to}</span>
            <span class="sms-time">${new Date(m.sentAt).toLocaleString('en-IN')}</span>
          </div>
          <div class="sms-text">${m.message}</div>
        </div>`).join('');

  // Status update buttons
  const statuses = [
    { val: 'pending', label: '⏳ Pending', cls: 'pending' },
    { val: 'in_progress', label: '🔧 In Progress', cls: 'progress' },
    { val: 'completed', label: '✅ Completed', cls: 'completed' },
  ];
  const statusBtns = statuses.map(st => {
    const isCurrent = s.serviceStatus === st.val;
    return `<button class="status-update-btn ${isCurrent ? `current-${st.cls}` : ''}"
      onclick="updateStatus('${st.val}')">${st.label}${isCurrent ? ' ✓' : ''}</button>`;
  }).join('');

  // Payment toggle
  const payToggle = s.paymentStatus === 'paid'
    ? `<button class="btn btn-danger btn-sm" onclick="togglePayment('unpaid')">Mark as Unpaid</button>`
    : `<button class="btn btn-success btn-sm" onclick="togglePayment('paid')">✅ Mark as Paid</button>`;

  document.getElementById('page-content').innerHTML = `
  <div class="view-layout">

    <!-- LEFT: All Details -->
    <div>

      <!-- ① Customer Details -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(108,99,255,0.15)">👤</div>
          <div class="info-block-title">Customer Details</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${s.customerName || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone Number</div>
            <div class="info-value">
              <a href="tel:${s.customerPhone}" style="color:var(--accent-tertiary)">📞 ${s.customerPhone || '—'}</a>
            </div>
          </div>
        </div>
      </div>

      <!-- ② Mobile Details -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(6,182,212,0.15)">📱</div>
          <div class="info-block-title">Mobile Details</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Brand</div>
            <div class="info-value">${s.brand || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Model</div>
            <div class="info-value">${s.model || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">IMEI / Serial</div>
            <div class="info-value muted">${s.imei || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Color</div>
            <div class="info-value muted">${s.color || '—'}</div>
          </div>
        </div>
      </div>

      <!-- ③ Problem Details -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(239,68,68,0.15)">⚠️</div>
          <div class="info-block-title">Problem Details</div>
        </div>

        <div style="margin-bottom:14px">
          <div class="info-label" style="margin-bottom:8px">Issues Reported</div>
          <div class="problem-chips-display">${problemChips}</div>
        </div>

        <div class="info-grid" style="margin-bottom:14px">
          <div class="info-item">
            <div class="info-label">Problem Type</div>
            <div class="info-value">${PROBLEM_TYPE_LABELS[s.problemType] || s.problemType || '—'}</div>
          </div>
        </div>

        ${s.problemDescription ? `
        <div style="margin-bottom:14px">
          <div class="info-label" style="margin-bottom:6px">Description</div>
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;font-size:13px;color:var(--text-secondary);line-height:1.7;border:1px solid var(--border-subtle)">
            ${s.problemDescription}
          </div>
        </div>` : ''}

        <div class="info-item">
          <div class="info-label" style="margin-bottom:8px">Device Condition</div>
          <div class="condition-badges">${screenCond}${powerCond}</div>
        </div>
      </div>

      <!-- ④ Service Details -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(245,158,11,0.15)">📅</div>
          <div class="info-block-title">Service Details</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Service ID</div>
            <div class="info-value accent">${s.serviceId}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Technician</div>
            <div class="info-value muted">${s.technician || 'Not assigned'}</div>
          </div>
        </div>

        <!-- Timeline -->
        <div style="margin-top:16px">
          <div class="info-label" style="margin-bottom:12px">Service Timeline</div>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-line-wrap">
                <div class="timeline-dot" style="background:var(--accent-primary)"></div>
                <div class="timeline-connector"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-label">Received Date</div>
                <div class="timeline-val done">${formatDate(s.receivedDate)}</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-line-wrap">
                <div class="timeline-dot" style="background:${s.expectedDate ? 'var(--accent-warning)' : 'var(--border-subtle)'}"></div>
                <div class="timeline-connector"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-label">Expected Delivery</div>
                <div class="timeline-val ${s.expectedDate ? 'pending' : 'empty'}">${s.expectedDate ? formatDate(s.expectedDate) : 'Not set'}</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-line-wrap">
                <div class="timeline-dot" style="background:${s.deliveryDate ? 'var(--accent-success)' : 'var(--border-subtle)'}"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-label">Delivery Date</div>
                <div class="timeline-val ${s.deliveryDate ? 'done' : 'empty'}">${s.deliveryDate ? formatDate(s.deliveryDate) : 'Pending delivery'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Update -->
        <div class="divider"></div>
        <div class="info-label" style="margin-bottom:8px">Update Service Status</div>
        <div class="status-update-row">${statusBtns}</div>
      </div>

      <!-- ⑤ Repair Details -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(59,130,246,0.15)">🔧</div>
          <div class="info-block-title">Repair Details</div>
        </div>

        ${s.workDone ? `
        <div style="margin-bottom:16px">
          <div class="info-label" style="margin-bottom:6px">Work Done</div>
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;font-size:13px;color:var(--text-secondary);line-height:1.7;border:1px solid var(--border-subtle)">
            ${s.workDone}
          </div>
        </div>` : `
        <div style="margin-bottom:16px;color:var(--text-muted);font-size:13px">No repair notes added yet.</div>`}

        <div>
          <div class="info-label" style="margin-bottom:8px">Spare Parts Used</div>
          <div class="spare-chips-display">${spareChips}</div>
        </div>
      </div>

      <!-- SMS History -->
      <div class="info-block">
        <div class="info-block-header">
          <div class="info-block-icon" style="background:rgba(16,185,129,0.15)">📲</div>
          <div class="info-block-title">WhatsApp History</div>
          <button class="btn btn-secondary btn-sm" onclick="openSMSModal()" style="margin-left:auto">+ Send WhatsApp</button>
        </div>
        ${smsHistoryHtml}
      </div>

    </div>

    <!-- RIGHT PANEL -->
    <div class="right-panel">

      <!-- Device Preview -->
      <div class="device-card">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:16px">📱 Device</div>
        <div class="device-big-img" id="view-device-img">${deviceImgHtml}</div>
        <div style="font-size:16px;font-weight:800;font-family:'Space Grotesk',sans-serif;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
          ${s.brand} ${s.model}
        </div>
        ${s.color ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">${s.color}</div>` : ''}
        ${s.imei ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-family:'Space Grotesk',sans-serif">IMEI: ${s.imei}</div>` : ''}
        <div style="margin-top:14px">${statusBadge(s.serviceStatus)}</div>
      </div>

      <!-- Payment Summary -->
      <div class="payment-card">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:14px">💰 Payment Summary</div>
        <div class="pay-row">
          <span class="pay-label">Service Charge</span>
          <span class="pay-val">₹${(s.serviceCharge || 0).toLocaleString('en-IN')}</span>
        </div>
        <div class="pay-row">
          <span class="pay-label">Spare Parts Cost</span>
          <span class="pay-val">₹${(s.sparePartsCost || 0).toLocaleString('en-IN')}</span>
        </div>
        <div class="pay-row total">
          <span class="pay-label">Total Amount</span>
          <span class="pay-val">₹${(s.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between">
          <div id="payment-badge-wrap">${paymentBadge(s.paymentStatus)}</div>
          <div id="pay-toggle-btn">${payToggle}</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="info-block" style="margin-bottom:0">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:14px">⚡ Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <a href="new-service.html?edit=${s.serviceId}" class="btn btn-secondary" style="justify-content:center">✏️ Edit Service</a>
          <button class="btn btn-secondary" onclick="openSMSModal()" style="justify-content:center">📱 Send WhatsApp</button>
          <button class="btn btn-secondary" onclick="printService()" style="justify-content:center">🖨️ Print Receipt</button>
          <a href="records.html" class="btn btn-secondary" style="justify-content:center">📋 All Records</a>
        </div>
      </div>

    </div>
  </div>`;
}

// ── Build Device Image HTML ──
function buildDeviceImageHtml(s) {
  const imgUrl = resolveDeviceImage(s.brand || '', s.model || '');
  const emoji = getBrandEmojiView(s.brand);

  if (imgUrl) {
    return `<img src="${imgUrl}" alt="${s.brand} ${s.model}" 
      style="width:100%;height:100%;object-fit:contain;padding:10px"
      onerror="this.parentElement.innerHTML='<div style=\\'font-size:60px\\'>${emoji}</div>'"/>`;
  }
  return `<div style="font-size:60px">${emoji}</div>`;
}

function getBrandEmojiView(brand) {
  if (!brand) return '📱';
  const b = brand.toLowerCase();
  if (b.includes('samsung')) return '🌌';
  if (b.includes('iphone') || b.includes('apple')) return '🍎';
  if (b.includes('xiaomi') || b.includes('redmi')) return '🔴';
  if (b.includes('oppo')) return '🟢';
  if (b.includes('vivo')) return '🔵';
  if (b.includes('oneplus')) return '🟠';
  if (b.includes('realme')) return '⚡';
  if (b.includes('nokia')) return '🔷';
  if (b.includes('motorola')) return '〽️';
  return '📱';
}

// ── Status Update ──
function updateStatus(newStatus) {
  if (!currentService) return;
  currentService.serviceStatus = newStatus;

  // Set delivery date if completing
  if (newStatus === 'completed' && !currentService.deliveryDate) {
    currentService.deliveryDate = todayISO();
  }

  saveService(currentService);

  const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
  showToast('Status Updated! ✅', `Service marked as "${labels[newStatus]}"`, 'success');

  // Ask to send SMS
  setTimeout(() => {
    openSMSModal(newStatus);
  }, 700);

  setTimeout(() => renderPage(currentService), 100);
}

// ── Payment Toggle ──
function togglePayment(val) {
  if (!currentService) return;
  currentService.paymentStatus = val;
  saveService(currentService);

  const msg = val === 'paid' ? 'Payment marked as Paid ✅' : 'Payment marked as Unpaid';
  showToast('Payment Updated', msg, val === 'paid' ? 'success' : 'info');

  setTimeout(() => renderPage(currentService), 100);
}

// ── SMS Modal ──
function openSMSModal(forStatus) {
  if (!currentService) return;
  const status = forStatus || currentService.serviceStatus;
  const brandModel = `${currentService.brand} ${currentService.model}`;

  document.getElementById('sms-to').value = `${currentService.customerName} – ${currentService.customerPhone}`;
  document.getElementById('sms-message').value = getSMSMessage(currentService.serviceId, status, brandModel);
  document.getElementById('sms-modal').classList.add('active');
}

function closeSMSModal() {
  document.getElementById('sms-modal').classList.remove('active');
}

function confirmSendSMS() {
  if (!currentService) return;
  const msg = document.getElementById('sms-message').value.trim();
  sendSMS(
    currentService.customerName,
    currentService.customerPhone,
    currentService.serviceId,
    currentService.serviceStatus,
    msg
  );
  closeSMSModal();
  setTimeout(() => renderPage(currentService), 300);
}

// ── Print Receipt ──
function printService() {
  if (!currentService) return;
  const s = currentService;

  const printWin = window.open('', '_blank', 'width=700,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Service Receipt – ${s.serviceId}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
        .section { margin-bottom: 18px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .row { display: flex; margin-bottom: 4px; }
        .label { font-size: 12px; color: #666; width: 160px; flex-shrink: 0; }
        .value { font-size: 13px; font-weight: 600; }
        .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 2px solid #111; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        .id-big { font-size: 24px; font-weight: 800; color: #6c63ff; letter-spacing: 2px; }
        @media print { @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <h1>📱 MobiTracker</h1>
      <div class="sub">Mobile Service Management · Service Receipt</div>

      <div class="id-big">${s.serviceId}</div>
      <br/>

      <div class="section">
        <div class="section-title">Customer</div>
        <div class="row"><span class="label">Name</span><span class="value">${s.customerName}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${s.customerPhone}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Device</div>
        <div class="row"><span class="label">Brand &amp; Model</span><span class="value">${s.brand} ${s.model}</span></div>
        ${s.imei ? `<div class="row"><span class="label">IMEI</span><span class="value">${s.imei}</span></div>` : ''}
        ${s.color ? `<div class="row"><span class="label">Color</span><span class="value">${s.color}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Problem</div>
        <div class="row"><span class="label">Type</span><span class="value">${s.problemType || '—'}</span></div>
        ${s.problemDescription ? `<div class="row"><span class="label">Description</span><span class="value">${s.problemDescription}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Service</div>
        <div class="row"><span class="label">Received</span><span class="value">${formatDate(s.receivedDate)}</span></div>
        <div class="row"><span class="label">Expected Delivery</span><span class="value">${formatDate(s.expectedDate)}</span></div>
        <div class="row"><span class="label">Status</span><span class="value">${s.serviceStatus}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Payment</div>
        <div class="row"><span class="label">Service Charge</span><span class="value">₹${(s.serviceCharge||0).toLocaleString('en-IN')}</span></div>
        <div class="row"><span class="label">Spare Parts Cost</span><span class="value">₹${(s.sparePartsCost||0).toLocaleString('en-IN')}</span></div>
        <div class="total-row"><span>Total Amount</span><span>₹${(s.totalAmount||0).toLocaleString('en-IN')}</span></div>
        <div class="row" style="margin-top:8px"><span class="label">Payment Status</span><span class="value">${s.paymentStatus.toUpperCase()}</span></div>
      </div>

      <div class="footer">
        Thank you for choosing MobiTracker! · Generated on ${new Date().toLocaleString('en-IN')}
      </div>
    </body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
