// ============================================
// DASHBOARD - Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Set date
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  loadStats();
  loadRecentServices();
  loadRevenueChart();
  loadStatusBreakdown();
});

function loadStats() {
  const services = getAllServices();
  const total = services.length;
  const pending = services.filter(s => s.serviceStatus === 'pending').length;
  const inProgress = services.filter(s => s.serviceStatus === 'in_progress').length;
  const completed = services.filter(s => s.serviceStatus === 'completed').length;
  const totalRevenue = services.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const unpaid = services.filter(s => s.paymentStatus === 'unpaid').reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const statsGrid = document.getElementById('stats-grid');
  if (!statsGrid) return;

  const stats = [
    { label: 'Total Services', value: total, icon: '📱', color: 'purple', change: 'All time records' },
    { label: 'Pending', value: pending, icon: '⏳', color: 'orange', change: 'Awaiting repair' },
    { label: 'In Progress', value: inProgress, icon: '🔧', color: 'blue', change: 'Being repaired' },
    { label: 'Completed', value: completed, icon: '✅', color: 'green', change: 'Successfully done' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: 'cyan', change: 'Collected payments' },
  ];

  statsGrid.innerHTML = stats.map(s => `
    <div class="stat-card ${s.color} fade-in" style="cursor:pointer" onclick="window.location='records.html'">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change neutral">
        <span>${s.change}</span>
      </div>
    </div>
  `).join('');
}

function loadRecentServices() {
  const services = getAllServices().slice(0, 6);
  const list = document.getElementById('recent-list');
  if (!list) return;

  if (services.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No Services Yet</h3>
        <p>Create your first service entry</p>
        <a href="new-service.html" class="btn btn-primary" style="margin-top:16px">+ New Service</a>
      </div>`;
    return;
  }

  list.innerHTML = services.map(s => `
    <div class="quick-item" onclick="window.location='view-service.html?id=${s.serviceId}'">
      <div class="quick-device-icon">📱</div>
      <div class="quick-info">
        <div class="quick-name">${s.brand} ${s.model}</div>
        <div class="quick-id">${s.serviceId} · ${s.customerName}</div>
      </div>
      <div class="quick-right">
        <div class="quick-amount">₹${(s.totalAmount||0).toLocaleString('en-IN')}</div>
        <div style="margin-top:4px">${statusBadge(s.serviceStatus)}</div>
      </div>
    </div>
  `).join('');
}

function loadRevenueChart() {
  const services = getAllServices();
  const chart = document.getElementById('revenue-chart');
  const revenueEl = document.getElementById('monthly-revenue');
  const subEl = document.getElementById('revenue-sub');
  if (!chart) return;

  // Last 7 days
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayRevenue = services
      .filter(s => s.receivedDate === key && s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    days.push({ key, label, revenue: dayRevenue });
  }

  const max = Math.max(...days.map(d => d.revenue), 1);
  chart.innerHTML = days.map(d => `
    <div class="chart-bar" title="₹${d.revenue.toLocaleString('en-IN')}" style="height:${Math.max(10, (d.revenue / max) * 90)}px">
      <span class="bar-label">${d.label}</span>
    </div>
  `).join('');

  // This month revenue
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = services
    .filter(s => s.paymentStatus === 'paid' && s.receivedDate && s.receivedDate.startsWith(monthStart))
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  if (revenueEl) revenueEl.textContent = `₹${monthRevenue.toLocaleString('en-IN')}`;
  if (subEl) subEl.textContent = `${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
}

function loadStatusBreakdown() {
  const services = getAllServices();
  const total = services.length || 1;
  const breakdown = [
    { label: 'Pending', count: services.filter(s => s.serviceStatus === 'pending').length, color: '#f59e0b' },
    { label: 'In Progress', count: services.filter(s => s.serviceStatus === 'in_progress').length, color: '#3b82f6' },
    { label: 'Completed', count: services.filter(s => s.serviceStatus === 'completed').length, color: '#10b981' },
  ];

  const el = document.getElementById('status-breakdown');
  if (!el) return;

  el.innerHTML = breakdown.map(b => `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">${b.label}</span>
        <span style="font-size:12px;font-weight:700;color:${b.color}">${b.count}</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.round((b.count/total)*100)}%;background:${b.color};border-radius:3px;transition:width 1s ease"></div>
      </div>
    </div>
  `).join('');
}
