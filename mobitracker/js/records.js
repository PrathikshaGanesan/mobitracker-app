// ============================================
// RECORDS - Table Logic
// ============================================

let deleteTarget = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for pre-set filters
  const params = new URLSearchParams(window.location.search);
  const statusFilter = params.get('filter');
  const paymentFilter = params.get('payment');

  if (statusFilter) {
    document.getElementById('status-filter').value = statusFilter;
    updateFilterChipsFromDropdowns();
  }
  if (paymentFilter) {
    document.getElementById('payment-filter').value = paymentFilter;
    updateFilterChipsFromDropdowns();
  }

  renderTable();
});

function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusF = document.getElementById('status-filter').value;
  const paymentF = document.getElementById('payment-filter').value;

  let services = getAllServices();

  // Filter
  services = services.filter(s => {
    const matchSearch = !search ||
      (s.customerName && s.customerName.toLowerCase().includes(search)) ||
      (s.customerPhone && s.customerPhone.includes(search)) ||
      (s.serviceId && s.serviceId.toLowerCase().includes(search)) ||
      (s.brand && s.brand.toLowerCase().includes(search)) ||
      (s.model && s.model.toLowerCase().includes(search)) ||
      (s.imei && s.imei.includes(search));

    const matchStatus = !statusF || s.serviceStatus === statusF;
    const matchPayment = !paymentF || s.paymentStatus === paymentF;

    return matchSearch && matchStatus && matchPayment;
  });

  const tbody = document.getElementById('records-tbody');
  const emptyEl = document.getElementById('empty-records');
  document.getElementById('records-count').textContent = services.length;

  if (services.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  const PROBLEM_TYPE_LABELS = {
    display_issue: '📵 Display Issue',
    software_issue: '💻 Software Issue',
    hardware_issue: '🔧 Hardware Issue',
    water_damage: '💧 Water Damage',
  };

  tbody.innerHTML = services.map(s => `
    <tr>
      <td class="td-accent">${s.serviceId}</td>
      <td>
        <div class="customer-cell">
          <div class="customer-name">${s.customerName || '—'}</div>
          <div class="customer-phone">📞 ${s.customerPhone || '—'}</div>
        </div>
      </td>
      <td>
        <div class="mobile-cell">
          <div class="mobile-icon">${getBrandEmojiSmall(s.brand)}</div>
          <div>
            <div class="mobile-name">${s.brand || ''} ${s.model || ''}</div>
            ${s.imei ? `<div class="mobile-model">IMEI: ${s.imei}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="td-primary">${PROBLEM_TYPE_LABELS[s.problemType] || s.problemType || '—'}</td>
      <td class="td-muted">${formatDate(s.receivedDate)}</td>
      <td class="td-muted">${formatDate(s.expectedDate)}</td>
      <td>${statusBadge(s.serviceStatus)}</td>
      <td class="amount-cell">₹${(s.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td>${paymentBadge(s.paymentStatus)}</td>
      <td>
        <div class="action-btns">
          <a href="view-service.html?id=${s.serviceId}" class="btn btn-secondary btn-sm" title="View">👁️</a>
          <a href="new-service.html?edit=${s.serviceId}" class="btn btn-secondary btn-sm" title="Edit">✏️</a>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${s.serviceId}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getBrandEmojiSmall(brand) {
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

function setStatusChip(val) {
  document.getElementById('status-filter').value = val;
  document.getElementById('payment-filter').value = '';
  updateFilterChipsFromDropdowns();
  renderTable();
}

function setPaymentChip(val) {
  document.getElementById('payment-filter').value = val;
  document.getElementById('status-filter').value = '';
  updateFilterChipsFromDropdowns();
  renderTable();
}

function updateFilterChipsFromDropdowns() {
  const statusF = document.getElementById('status-filter').value;
  const paymentF = document.getElementById('payment-filter').value;
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(c => c.classList.remove('active'));

  if (!statusF && !paymentF) { chips[0].classList.add('active'); return; }
  if (statusF === 'pending') chips[1].classList.add('active');
  if (statusF === 'in_progress') chips[2].classList.add('active');
  if (statusF === 'completed') chips[3].classList.add('active');
  if (paymentF === 'unpaid') chips[4].classList.add('active');
  if (paymentF === 'paid') chips[5].classList.add('active');
}

function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('status-filter').value = '';
  document.getElementById('payment-filter').value = '';
  document.querySelectorAll('.filter-chip').forEach((c, i) => {
    c.classList.toggle('active', i === 0);
  });
  renderTable();
}

// ── Delete Modal ──
function openDeleteModal(serviceId) {
  deleteTarget = serviceId;
  document.getElementById('del-service-id').textContent = serviceId;
  document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
  deleteTarget = null;
  document.getElementById('delete-modal').classList.remove('active');
}

function confirmDelete() {
  if (!deleteTarget) return;
  deleteService(deleteTarget);
  closeDeleteModal();
  showToast('Deleted', `Service ${deleteTarget} has been removed`, 'info');
  renderTable();
}
