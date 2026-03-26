/**
 * MAHALLA TIZIMI — ADMIN PANEL LOGIKASI
 */

// Kirish tekshiruvi
const currentUser = Auth.require('admin');
if (!currentUser) throw new Error('Admin auth required');

let monthlyChartInstance = null;
let typeChartInstance    = null;
let dailyChartInstance   = null;
let topChartInstance     = null;
let indChartInstance     = null;

let allReportsCached      = [];
let raislarCached         = [];
let tasksDataCached       = [];
let raisSummaryCached     = [];
let raisDetailCached      = [];   // tanlangan raisning hisobotlari
let raisDetailId          = null;

// =====================================================
// NAVIGATSIYA
// =====================================================
function showAdminSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  const navItem = document.querySelector(`.nav-item[data-section="${name}"]`);
  if (section) section.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const titles = {
    dashboard: { h: 'Dashboard',          p: 'Umumiy holat ko\'rinishi' },
    reports:   { h: 'Barcha Hisobotlar',   p: 'Barcha raislar hisobotlari' },
    raislar:   { h: 'Raislar Ro\'yxati',   p: '39 mahalla raisi ma\'lumotlari' },
    tasks:     { h: 'Topshiriqlar',        p: 'Raislar uchun topshiriqlar boshqaruvi' },
    analytics: { h: 'Tahlil',             p: 'Statistika va grafiklari' },
    settings:  { h: 'Sozlamalar',          p: 'Tizim sozlamalari' },
  };
  const t = titles[name] || { h: name, p: '' };
  document.getElementById('pageTitle').textContent    = t.h;
  document.getElementById('pageSubtitle').textContent = t.p;

  if (name === 'dashboard') AdminPanel.loadDashboard();
  if (name === 'reports')   AdminPanel.loadAllReports();
  if (name === 'raislar')   AdminPanel.loadRaislar();
  if (name === 'tasks')     AdminPanel.loadTasks();
  if (name === 'analytics') AdminPanel.loadAnalytics();

  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    showAdminSection(this.dataset.section);
  });
});

// =====================================================
// ADMIN PANEL OBJECT
// =====================================================
const AdminPanel = {

  // ===== DASHBOARD =====
  async loadDashboard() {
    const now    = new Date();
    const month  = now.getMonth() + 1;
    const year   = now.getFullYear();
    const MONTHS = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

    const monthLabel = document.getElementById('dashboardMonthLabel');
    if (monthLabel) monthLabel.textContent = `— ${MONTHS[month]} ${year}`;
    const antiLabel = document.getElementById('antiRatingMonth');
    if (antiLabel) antiLabel.textContent = `${MONTHS[month]} ${year}`;

    // Stats
    const stats = await API.getAdminStats();
    document.getElementById('adminStatRaislar').textContent = stats.totalRaislar;
    document.getElementById('adminStatTotal').textContent   = stats.totalReports;
    document.getElementById('adminStatToday').textContent   = stats.todayReports;
    document.getElementById('adminStatMonth').textContent   = stats.monthReports;
    document.getElementById('adminStatMissing').textContent = stats.missingCount;

    // Progress bar
    const submitted = stats.totalRaislar - stats.missingCount;
    const pct = stats.totalRaislar > 0 ? Math.round((submitted / stats.totalRaislar) * 100) : 0;
    const bar = document.getElementById('submissionProgress');
    bar.style.width = pct + '%';
    bar.innerHTML   = `<span>${pct}%</span>`;
    document.getElementById('submittedCount').textContent = `${submitted}/${stats.totalRaislar}`;

    // Rais summary (kartalar + anti-reyting)
    const summaryRes = await API.getRaisSummary(month, year);
    raisSummaryCached = summaryRes.data || [];
    this._buildRaisCards(raisSummaryCached);
    this._buildAntiRating(raisSummaryCached);

    // So'nggi hisobotlar
    const res = await API.getAllReports();
    allReportsCached = res.data || [];
    this._renderReportsTable(allReportsCached.slice(0, 10), 'adminRecentReports', false);
  },

  // ===== RAIS KARTALAR =====
  _buildRaisCards(summary) {
    const grid = document.getElementById('raisCardsGrid');
    if (!grid) return;

    const q = (document.getElementById('raisCardSearch')?.value || '').toLowerCase();
    const list = q
      ? summary.filter(r => r.fullName.toLowerCase().includes(q) || r.mahalla.toLowerCase().includes(q))
      : summary;

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Topilmadi</p></div>`;
      return;
    }

    grid.innerHTML = list.map(r => {
      let cls = 'rais-card-red';
      let icon = 'fa-times-circle';
      let statusTxt = 'Hisobot bermagan';
      if (r.submittedToday) {
        cls = 'rais-card-green'; icon = 'fa-check-circle'; statusTxt = 'Bugun topshirdi';
      } else if (r.monthCount > 0) {
        cls = 'rais-card-yellow'; icon = 'fa-clock'; statusTxt = `${r.monthCount} ta topshirdi`;
      }

      const nameParts = r.fullName.split(' ');
      const shortName = nameParts.slice(0, 2).join(' ');

      return `
        <div class="rais-card ${cls}" onclick="AdminPanel.showRaisDetail(${r.raisId},'${escHtml(r.fullName)}','${escHtml(r.mahalla)}')" title="Hisobotlarni ko'rish">
          <div class="rais-card-icon"><i class="fas ${icon}"></i></div>
          <div class="rais-card-info">
            <div class="rais-card-name">${escHtml(shortName)}</div>
            <div class="rais-card-mahalla">${escHtml(r.mahalla)}</div>
            <div class="rais-card-count">${statusTxt}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterRaisCards() {
    this._buildRaisCards(raisSummaryCached);
  },

  // ===== ANTI-REYTING =====
  _buildAntiRating(summary) {
    const el = document.getElementById('antiRatingTable');
    if (!el) return;

    // Kamdan-ko'pga saralash (0 ta topshirganlar birinchi)
    const sorted = [...summary].sort((a, b) => a.monthCount - b.monthCount);

    const rows = sorted.map((r, i) => {
      const statusColor = r.monthCount === 0 ? '#B71C1C' : r.submittedToday ? '#1B5E20' : '#E65100';
      const statusIcon  = r.monthCount === 0 ? 'fa-times-circle' : r.submittedToday ? 'fa-check-circle' : 'fa-clock';
      const lastDate    = r.lastSubmit ? formatDate(r.lastSubmit) : '—';

      return `
        <tr class="${r.monthCount === 0 ? 'anti-row-zero' : ''}">
          <td style="font-weight:700;color:${statusColor}">${i + 1}</td>
          <td>
            <div style="font-weight:600">${escHtml(r.fullName)}</div>
            <div style="font-size:0.78rem;color:#64748b">${escHtml(r.mahalla)}</div>
          </td>
          <td style="text-align:center">
            <span class="anti-count ${r.monthCount === 0 ? 'anti-count-zero' : r.monthCount < 5 ? 'anti-count-low' : 'anti-count-ok'}">
              ${r.monthCount}
            </span>
          </td>
          <td style="text-align:center;color:${statusColor}">
            <i class="fas ${statusIcon}"></i>
          </td>
          <td style="font-size:0.82rem;color:#64748b">${lastDate}</td>
          <td>
            <button class="btn-view" onclick="AdminPanel.showRaisDetail(${r.raisId},'${escHtml(r.fullName)}','${escHtml(r.mahalla)}')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Rais / Mahalla</th>
            <th style="text-align:center">Bu Oy</th>
            <th style="text-align:center">Bugun</th>
            <th>Oxirgi Hisobot</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  // ===== RAIS DETAIL MODAL =====
  async showRaisDetail(raisId, fullName, mahalla) {
    raisDetailId = raisId;
    document.getElementById('raisDetailName').textContent    = fullName;
    document.getElementById('raisDetailMahalla').textContent = mahalla;
    document.getElementById('raisDetailDateFrom').value = '';
    document.getElementById('raisDetailDateTo').value   = '';
    document.getElementById('raisDetailModal').style.display = 'flex';

    const el = document.getElementById('raisDetailReportsList');
    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

    const res = await API.getAllReports({ raisId });
    raisDetailCached = res.data || [];
    this._renderRaisDetailReports(raisDetailCached);
  },

  filterRaisDetailReports() {
    const from = document.getElementById('raisDetailDateFrom').value;
    const to   = document.getElementById('raisDetailDateTo').value;
    let list   = [...raisDetailCached];
    if (from) list = list.filter(r => r.reportDate >= from);
    if (to)   list = list.filter(r => r.reportDate <= to);
    this._renderRaisDetailReports(list);
  },

  clearRaisDetailFilter() {
    document.getElementById('raisDetailDateFrom').value = '';
    document.getElementById('raisDetailDateTo').value   = '';
    this._renderRaisDetailReports(raisDetailCached);
  },

  _renderRaisDetailReports(list) {
    const el = document.getElementById('raisDetailReportsList');
    const countEl = document.getElementById('raisDetailCount');
    if (countEl) countEl.textContent = `${list.length} ta hisobot`;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Hisobotlar topilmadi</p></div>`;
      return;
    }

    const rows = list.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${formatDate(r.reportDate)}</td>
        <td><strong>${escHtml(r.reportTitle)}</strong></td>
        <td>
          <span class="badge ${r.reportType === 'daily' ? 'badge-daily' : 'badge-monthly'}">
            ${r.reportType === 'daily' ? 'Kunlik' : 'Oylik'}
          </span>
        </td>
        <td>${r.ind1 || 0}</td>
        <td>${r.ind2 || 0}</td>
        <td style="font-size:0.78rem;color:#64748b">${formatDateTime(r.submittedAt)}</td>
        <td>
          <button class="btn-view" onclick="AdminPanel.viewReportFromDetail('${r.id}')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');

    el.innerHTML = `
      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th><th>Sana</th><th>Sarlavha</th><th>Tur</th>
            <th>Murojaat</th><th>Hal et.</th><th>Yuborilgan</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  async viewReportFromDetail(id) {
    let r = raisDetailCached.find(rep => String(rep.id) === String(id));
    if (!r) {
      const res = await API.getReportDetail(id);
      if (!res?.success) return;
      r = res.data;
    }
    document.getElementById('raisDetailModal').style.display = 'none';
    // Reportni viewReport orqali ko'rsatish uchun cached ga qo'shamiz
    if (!allReportsCached.find(x => String(x.id) === String(id))) {
      allReportsCached.push(r);
    }
    this.viewReport(id);
  },

  // ===== BARCHA HISOBOTLAR =====
  async loadAllReports() {
    const el = document.getElementById('allReportsList');
    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

    // Rais filterini to'ldirish
    const raisSelect = document.getElementById('filterRais');
    if (raisSelect && raisSelect.options.length <= 1) {
      RAISLAR_DATA.filter(u => u.role === 'rais').forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.fullName;
        raisSelect.appendChild(opt);
      });
    }

    const res = await API.getAllReports();
    allReportsCached = res.data || [];

    // Oy filterini to'ldirish
    const monthSel = document.getElementById('filterMonth');
    if (monthSel && monthSel.options.length <= 1) {
      const monthNames = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
      const months = [...new Set(allReportsCached.map(r => `${r.year}-${String(r.month).padStart(2,'0')}`))].sort().reverse();
      months.forEach(m => {
        const [y, mo] = m.split('-');
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `${monthNames[parseInt(mo)]} ${y}`;
        monthSel.appendChild(opt);
      });
    }
    this._renderReportsTable(allReportsCached, 'allReportsList', true);
  },

  filterReports() {
    const raisId     = document.getElementById('filterRais')?.value     || 'all';
    const monthFilter = document.getElementById('filterMonth')?.value   || 'all';
    const dateFrom   = document.getElementById('filterDateFrom')?.value || '';
    const dateTo     = document.getElementById('filterDateTo')?.value   || '';

    let list = [...allReportsCached];
    if (raisId !== 'all') list = list.filter(r => r.raisId == raisId);
    if (monthFilter !== 'all') {
      const [y, mo] = monthFilter.split('-');
      list = list.filter(r => r.year === parseInt(y) && r.month === parseInt(mo));
    }
    if (dateFrom) list = list.filter(r => r.reportDate >= dateFrom);
    if (dateTo)   list = list.filter(r => r.reportDate <= dateTo);

    this._renderReportsTable(list, 'allReportsList', true);
  },

  clearFilters() {
    document.getElementById('filterRais').value      = 'all';
    document.getElementById('filterMonth').value     = 'all';
    document.getElementById('filterDateFrom').value  = '';
    document.getElementById('filterDateTo').value    = '';
    this._renderReportsTable(allReportsCached, 'allReportsList', true);
  },

  _renderReportsTable(list, containerId, showRais) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Hisobotlar topilmadi</p></div>`;
      return;
    }

    const raisCol = showRais ? `<th>Rais</th><th>Mahalla</th>` : '';
    const rows = list.map((r, i) => {
      const raisCols = showRais
        ? `<td><strong>${escHtml(r.raisName)}</strong></td><td>${escHtml(r.mahalla)}</td>`
        : '';
      return `
        <tr>
          <td>${i+1}</td>
          ${raisCols}
          <td>
            <span class="badge ${r.reportType === 'daily' ? 'badge-daily' : 'badge-monthly'}">
              ${r.reportType === 'daily' ? 'Kunlik' : 'Oylik'}
            </span>
          </td>
          <td>${formatDate(r.reportDate)}</td>
          <td><strong>${escHtml(r.reportTitle)}</strong></td>
          <td>${r.ind1 || 0}</td>
          <td>${r.ind2 || 0}</td>
          <td>${formatDateTime(r.submittedAt)}</td>
          <td>
            <button class="btn-view" onclick="AdminPanel.viewReport('${r.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th>
            ${raisCol}
            <th>Tur</th>
            <th>Sana</th>
            <th>Sarlavha</th>
            <th>Murojaat</th>
            <th>Hal et.</th>
            <th>Yuborilgan</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  async viewReport(id) {
    let r = allReportsCached.find(rep => String(rep.id) === String(id) || String(rep._id) === String(id));
    if (!r) {
      const res = await API.getReportDetail(id);
      if (!res || !res.success) return;
      r = res.data;
    }

    document.getElementById('modalTitle').textContent = r.reportTitle;
    document.getElementById('modalBody').innerHTML = `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Rais</span>
        <span class="modal-detail-value">${escHtml(r.raisName)}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Mahalla</span>
        <span class="modal-detail-value">${escHtml(r.mahalla)}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Tuman</span>
        <span class="modal-detail-value">${escHtml(r.district || '—')}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Hisobot Turi</span>
        <span class="modal-detail-value">
          <span class="badge ${r.reportType === 'daily' ? 'badge-daily' : 'badge-monthly'}">
            ${r.reportType === 'daily' ? 'Kunlik' : 'Oylik'}
          </span>
        </span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Hisobot Sanasi</span>
        <span class="modal-detail-value">${formatDate(r.reportDate)}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Ko'rsatkichlar</span>
        <span class="modal-detail-value">
          <table style="font-size:0.82rem;border-collapse:collapse;width:100%">
            <tr><td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Aholidan murojaat</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind1||0}</strong></td>
                <td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Hal etilgan</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind2||0}</strong></td></tr>
            <tr><td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Oilaviy ziyorat</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind3||0}</strong></td>
                <td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Yoshlar tadbirlari</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind4||0}</strong></td></tr>
            <tr><td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Ijtimoiy yordam</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind5||0}</strong></td>
                <td style="padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0">Uy-joy muammosi</td><td style="padding:3px 8px;border:1px solid #e2e8f0"><strong>${r.ind6||0}</strong></td></tr>
          </table>
        </span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Hisobot Matni</span>
        <span class="modal-detail-value">
          <div class="modal-text-block">${escHtml(r.content)}</div>
        </span>
      </div>
      ${r.issues ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Muammolar</span>
        <span class="modal-detail-value">
          <div class="modal-text-block">${escHtml(r.issues)}</div>
        </span>
      </div>
      ` : ''}
      <div class="modal-detail-row">
        <span class="modal-detail-label">Yuborilgan Vaqt</span>
        <span class="modal-detail-value">${formatDateTime(r.submittedAt)}</span>
      </div>
      ${r.photos && r.photos.length > 0 ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label"><i class="fas fa-camera" style="color:#C9A227"></i> Rasmlar</span>
        <span class="modal-detail-value">
          <div class="modal-photos-grid">
            ${r.photos.map(p => `<img src="${p}" class="modal-photo" onclick="(function(s){var o=document.createElement('div');o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';o.innerHTML='<img src=\\''+s+'\\' style=\\'max-width:95vw;max-height:90vh;border-radius:8px;\\'>';o.onclick=()=>document.body.removeChild(o);document.body.appendChild(o);})(this.src)" loading="lazy">`).join('')}
          </div>
        </span>
      </div>` : ''}
      ${r.latitude && r.longitude ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label"><i class="fas fa-map-marker-alt" style="color:#E63946"></i> Joylashuv</span>
        <span class="modal-detail-value">
          <div class="report-map-coords">${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}</div>
          <div id="reportMapAdmin" class="report-map-container"></div>
        </span>
      </div>
      ` : ''}
    `;
    document.getElementById('reportModal').style.display = 'flex';
    if (r.latitude && r.longitude) {
      setTimeout(() => _initReportMap('reportMapAdmin', Number(r.latitude), Number(r.longitude)), 150);
    }
  },

  // ===== RAISLAR =====
  async loadRaislar() {
    const el = document.getElementById('raislarTable');
    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

    const res = await API.getRaislar();
    raislarCached = res.data || [];
    this._renderRaislarTable(raislarCached);
  },

  _renderRaislarTable(list) {
    const el = document.getElementById('raislarTable');
    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>Raislar topilmadi</p></div>`;
      return;
    }

    // Count reports per rais (cached dan)
    const reportCounts = {};
    allReportsCached.forEach(r => {
      reportCounts[r.raisId] = (reportCounts[r.raisId] || 0) + 1;
    });

    el.innerHTML = `
      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th>
            <th>To'liq Ism</th>
            <th>Mahalla</th>
            <th>Tuman</th>
            <th>Telefon</th>
            <th>Login</th>
            <th>Hisobotlar</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((r, i) => `
            <tr>
              <td>${i+1}</td>
              <td><strong>${escHtml(r.fullName)}</strong></td>
              <td>${escHtml(r.mahalla)}</td>
              <td>${escHtml(r.district || '—')}</td>
              <td>${escHtml(r.phone || '—')}</td>
              <td><code>${escHtml(r.login)}</code></td>
              <td>
                <span style="font-weight:700;color:${(reportCounts[r.id]||0)>0?'#1B5E20':'#B71C1C'}">
                  ${reportCounts[r.id] || 0}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  searchRaislar() {
    const q = document.getElementById('raisSearch').value.toLowerCase();
    const filtered = raislarCached.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      r.mahalla.toLowerCase().includes(q) ||
      r.district?.toLowerCase().includes(q) ||
      r.login.toLowerCase().includes(q)
    );
    this._renderRaislarTable(filtered);
  },

  // ===== ANALYTICS =====
  async loadAnalytics() {
    // Kunlik grafik
    const daily = await API.getDailyChartData();
    const ctxD  = document.getElementById('dailyChart');
    if (ctxD) {
      if (dailyChartInstance) dailyChartInstance.destroy();
      dailyChartInstance = new Chart(ctxD, {
        type: 'line',
        data: {
          labels: daily.labels,
          datasets: [{
            label: 'Kunlik hisobotlar',
            data: daily.data,
            borderColor: '#1565C0',
            backgroundColor: 'rgba(21,101,192,0.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    // Top raislar
    const top    = await API.getTopRaislar(10);
    const ctxTop = document.getElementById('topRaisChart');
    if (ctxTop && top.length > 0) {
      if (topChartInstance) topChartInstance.destroy();
      topChartInstance = new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: top.map(r => r.name.split(' ')[1] || r.name),
          datasets: [{
            label: 'Hisobotlar',
            data: top.map(r => r.count),
            backgroundColor: [
              '#0D2B5C','#1E4080','#1565C0','#1976D2','#1E88E5',
              '#42A5F5','#64B5F6','#90CAF9','#BBDEFB','#E3F2FD',
            ],
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    // Ko'rsatkichlar
    const indLabels = ['Murojaat','Hal etilgan','Oilaviy ziyorat','Yoshlar','Ijtimoiy','Uy-joy'];
    const indData   = [
      allReportsCached.reduce((s,r) => s+(r.ind1||0), 0),
      allReportsCached.reduce((s,r) => s+(r.ind2||0), 0),
      allReportsCached.reduce((s,r) => s+(r.ind3||0), 0),
      allReportsCached.reduce((s,r) => s+(r.ind4||0), 0),
      allReportsCached.reduce((s,r) => s+(r.ind5||0), 0),
      allReportsCached.reduce((s,r) => s+(r.ind6||0), 0),
    ];
    const ctxInd = document.getElementById('indicatorsChart');
    if (ctxInd) {
      if (indChartInstance) indChartInstance.destroy();
      indChartInstance = new Chart(ctxInd, {
        type: 'radar',
        data: {
          labels: indLabels,
          datasets: [{
            label: 'Jami',
            data: indData,
            borderColor: '#C9A227',
            backgroundColor: 'rgba(201,162,39,0.2)',
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          scales: { r: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    // Oylik xulosaviy jadval
    this.loadMonthlySummary();
  },

  loadMonthlySummary() {
    const month = parseInt(document.getElementById('analyticMonth')?.value || new Date().getMonth() + 1);
    const year  = new Date().getFullYear();
    const el    = document.getElementById('monthlySummaryTable');
    if (!el) return;

    const monthReps = allReportsCached.filter(r => r.month === month && r.year === year);
    const raislar   = RAISLAR_DATA.filter(u => u.role === 'rais');

    const rows = raislar.map((rais, i) => {
      const rReps = monthReps.filter(r => r.raisId === rais.id);
      const submitted = rReps.length > 0;
      const ind1 = rReps.reduce((s,r) => s+(r.ind1||0), 0);
      const ind2 = rReps.reduce((s,r) => s+(r.ind2||0), 0);
      return `
        <tr>
          <td>${i+1}</td>
          <td><strong>${escHtml(rais.fullName)}</strong></td>
          <td>${escHtml(rais.mahalla)}</td>
          <td style="text-align:center">
            <span style="color:${submitted?'#1B5E20':'#B71C1C'};font-weight:700">
              ${submitted ? '✓' : '✗'}
            </span>
          </td>
          <td style="text-align:center">${rReps.length}</td>
          <td style="text-align:center">${ind1}</td>
          <td style="text-align:center">${ind2}</td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <table class="reports-table">
        <thead>
          <tr>
            <th>#</th><th>Rais</th><th>Mahalla</th>
            <th>Hisobot berdi</th><th>Hisobotlar</th>
            <th>Murojaat</th><th>Hal etilgan</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  // ============================================================
  // TOPSHIRIQLAR
  // ============================================================
  toggleTaskForm() {
    const body    = document.getElementById('taskFormBody');
    const chevron = document.getElementById('taskFormChevron');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    chevron.className  = open ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
  },

  async loadTasks() {
    const el     = document.getElementById('tasksList');
    if (!el) return;
    const filter = document.getElementById('taskStatusFilter')?.value || 'active';
    el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

    const res  = await API.getAllTasks();
    tasksDataCached = res.data || [];
    let list   = tasksDataCached;
    if (filter === 'active') list = list.filter(t => t.status === 'active');
    if (filter === 'closed') list = list.filter(t => t.status === 'closed');

    // Badge
    const activeCnt = tasksDataCached.filter(t => t.status==='active').length;
    const badge = document.getElementById('activeTasksBadge');
    if (badge) { badge.textContent = activeCnt; badge.style.display = activeCnt > 0 ? 'inline-flex' : 'none'; }

    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>Topshiriqlar yo'q</p></div>`;
      return;
    }

    // Barcha topshiriqlar uchun submitterlarni parallel yuklaymiz
    const submitterSets = await Promise.all(list.map(t => API.getTaskSubmitters(t.id)));

    const priorityLabel = { low:'Past', normal:'Oddiy', high:'Muhim', urgent:'Shoshilinch' };
    const priorityClass = { low:'priority-low', normal:'priority-normal', high:'priority-high', urgent:'priority-urgent' };

    el.innerHTML = list.map((t, idx) => {
      const submitters = submitterSets[idx];
      const total = t.assignedTo === 'all' ? 39 : (Array.isArray(t.assignedTo) ? t.assignedTo.length : 39);
      const done  = submitters.size;
      const pct   = Math.round((done / total) * 100);
      const overdue = t.deadline && new Date(t.deadline) < new Date() && t.status === 'active';

      return `
        <div class="task-card ${t.status === 'closed' ? 'task-closed' : ''}">
          <div class="task-card-top">
            <div class="task-card-left">
              <div class="task-title-row">
                <span class="task-title">${escHtml(t.title)}</span>
                ${t.isHokimiyat ? '<span class="task-geo-badge"><i class="fas fa-map-marker-alt"></i> Geo majburiy</span>' : ''}
                <span class="priority-badge ${priorityClass[t.priority]||'priority-normal'}">${priorityLabel[t.priority]||'Oddiy'}</span>
                ${overdue ? '<span class="task-overdue-badge"><i class="fas fa-exclamation-triangle"></i> Muddat o\'tgan</span>' : ''}
              </div>
              ${t.description ? `<p class="task-desc">${escHtml(t.description)}</p>` : ''}
              <div class="task-meta">
                <span><i class="fas fa-calendar-plus"></i> ${formatDateTime(t.createdAt)}</span>
                ${t.deadline ? `<span><i class="fas fa-calendar-times"></i> Muddat: <strong>${formatDate(t.deadline)}</strong></span>` : ''}
                <span><i class="fas fa-users"></i> ${t.assignedTo === 'all' ? 'Barcha raislar' : `${total} ta rais`}</span>
              </div>
            </div>
            <div class="task-card-right">
              <div class="task-progress-circle">
                <svg viewBox="0 0 36 36"><path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e2e8f0" stroke-width="3"/><path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="${pct>=80?'#1B5E20':pct>=50?'#DAA520':'#1565C0'}" stroke-width="3" stroke-dasharray="${pct}, 100"/></svg>
                <span>${pct}%</span>
              </div>
              <div class="task-progress-label">${done}/${total}</div>
            </div>
          </div>
          ${t.status === 'active' ? `
          <div class="task-card-actions">
            <button class="btn-view" onclick="AdminPanel.viewTaskReports('${t.id}')">
              <i class="fas fa-eye"></i> Hisobotlarni Ko'rish
            </button>
            <button class="btn-close-task" onclick="AdminPanel.closeTask('${t.id}')">
              <i class="fas fa-check-double"></i> Topshiriqni Yopish
            </button>
          </div>` : `<div class="task-closed-label"><i class="fas fa-lock"></i> Yopilgan</div>`}
        </div>
      `;
    }).join('');
  },

  async viewTaskReports(taskId) {
    const task    = tasksDataCached.find(t => t.id === taskId);
    if (!task) return;
    const reports = await API.getTaskReports(taskId);
    const raislar = RAISLAR_DATA.filter(u => u.role === 'rais');
    const submittedIds = new Set(reports.map(r => r.raisId));

    document.getElementById('modalTitle').textContent = `"${task.title}" — Hisobotlar`;
    document.getElementById('modalBody').innerHTML = `
      <div style="margin-bottom:14px">
        <strong>${submittedIds.size}</strong> ta rais hisobot topshirdi,
        <strong style="color:#B71C1C">${raislar.length - submittedIds.size}</strong> ta topshirmadi.
      </div>
      ${reports.length === 0
        ? '<div class="empty-state"><i class="fas fa-inbox"></i><p>Hali hisobot topshirilmagan</p></div>'
        : `<table class="reports-table">
            <thead><tr><th>#</th><th>Rais</th><th>Mahalla</th><th>Vaqt</th><th>Geo</th></tr></thead>
            <tbody>${reports.map((r,i) => `
              <tr>
                <td>${i+1}</td>
                <td><strong>${escHtml(r.raisName)}</strong></td>
                <td>${escHtml(r.mahalla)}</td>
                <td>${formatDateTime(r.submittedAt)}</td>
                <td>${r.latitude ? `<span style="color:#1B5E20;font-size:0.8rem"><i class="fas fa-map-marker-alt"></i> ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}</span>` : '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>`
      }
    `;
    document.getElementById('reportModal').style.display = 'flex';
  },

  async closeTask(taskId) {
    if (!confirm('Topshiriqni yopmoqchimisiz? Raislar artiq hisobot topshira olmaydi.')) return;
    await API.closeTask(taskId);
    this.loadTasks();
  },

  // ===== RAISLAR MULTI-SELECT =====
  toggleAssignDropdown() {
    const dd = document.getElementById('taskAssignDropdown');
    const tr = document.getElementById('taskAssignTrigger');
    if (!dd) return;
    _assignState.open = !_assignState.open;
    dd.classList.toggle('open', _assignState.open);
    tr.classList.toggle('open', _assignState.open);
    if (_assignState.open) {
      document.getElementById('taskAssignSearch')?.focus();
    }
  },

  filterAssignList() {
    const q = document.getElementById('taskAssignSearch')?.value || '';
    _buildAssignList(q);
  },

  onAssignAllChange(chk) {
    _assignState.selected.clear();
    _buildAssignList(document.getElementById('taskAssignSearch')?.value || '');
  },

  onAssignItemChange(chk) {
    const id = Number(chk.value);
    if (chk.checked) {
      _assignState.selected.add(id);
    } else {
      _assignState.selected.delete(id);
    }
    _updateAssignUI();
  },

  clearAssign() {
    _assignState.selected.clear();
    _buildAssignList(document.getElementById('taskAssignSearch')?.value || '');
  },

  // ===== YANGILASH =====
  refresh() {
    const active = document.querySelector('.content-section.active');
    if (!active) return;
    const name = active.id.replace('section-', '');
    showAdminSection(name);
  },

  // ===== EKSPORT =====
  async exportReports() {
    const res = await API.getAllReports();
    API.exportToCSV(res.data || []);
  },

  // ===== ULANISH TEKSHIRUVI =====
  async testConnection() {
    const res = await API.testConnection();
    const el  = document.getElementById('settingsResult');
    el.style.display = 'flex';
    el.className = res.success ? 'alert-success' : 'alert-error';
    el.innerHTML = `<i class="fas ${res.success ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${res.message}`;
  },

  saveSettings() {
    const url = (document.getElementById('settingsApiUrl')?.value || '').trim();
    if (url) {
      localStorage.setItem('mahalla_api_url', url);
      CONFIG.API_URL = url;
    }
    const el = document.getElementById('settingsResult');
    el.style.display = 'flex';
    el.className = 'alert-success';
    el.innerHTML = '<i class="fas fa-check-circle"></i> Sozlamalar saqlandi! Sahifani yangilang.';
    setTimeout(() => el.style.display = 'none', 4000);
  },
};

// =====================================================
// RAIS QO'SHISH FORM
// =====================================================
document.getElementById('addRaisForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const el = document.getElementById('addRaisResult');
  const data = {
    fullName: document.getElementById('newRaisName').value.trim(),
    mahalla:  document.getElementById('newRaisMahalla').value.trim(),
    district: document.getElementById('newRaisDistrict').value.trim(),
    phone:    document.getElementById('newRaisPhone').value.trim(),
    login:    document.getElementById('newRaisLogin').value.trim(),
    password: document.getElementById('newRaisPass').value,
  };

  if (!data.fullName || !data.mahalla || !data.login || !data.password) {
    el.style.display = 'flex';
    el.className = 'alert-error';
    el.innerHTML = '<i class="fas fa-times-circle"></i> Majburiy maydonlarni to\'ldiring!';
    return;
  }

  const res = await API.addRais(data);
  el.style.display = 'flex';
  el.className = res.success ? 'alert-success' : 'alert-error';
  el.innerHTML = `<i class="fas ${res.success?'fa-check-circle':'fa-times-circle'}"></i> ${res.success ? 'Rais muvaffaqiyatli qo\'shildi!' : res.message}`;
  if (res.success) this.reset();
});

// =====================================================
// TOPSHIRIQ YARATISH FORM
// =====================================================
// =====================================================
// RAISLAR MULTI-SELECT
// =====================================================
const _assignState = { open: false, selected: new Set() }; // bo'sh = barchasi

function _buildAssignList(query = '') {
  const list = document.getElementById('taskAssignList');
  if (!list) return;
  const raislar = RAISLAR_DATA.filter(u => u.role === 'rais');
  const q = query.toLowerCase();
  const filtered = q
    ? raislar.filter(r => r.fullName.toLowerCase().includes(q) || r.mahalla.toLowerCase().includes(q))
    : raislar;

  list.innerHTML = filtered.map(r => {
    const checked = _assignState.selected.has(r.id) ? 'checked' : '';
    return `
      <label class="rais-ms-item" data-id="${r.id}">
        <input type="checkbox" value="${r.id}" ${checked} onchange="AdminPanel.onAssignItemChange(this)">
        <span class="rais-ms-check"></span>
        <span class="rais-ms-name">
          ${escHtml(r.fullName)}
          <span class="rais-ms-sub">${escHtml(r.mahalla)}</span>
        </span>
      </label>
    `;
  }).join('');
  _updateAssignUI();
}

function _updateAssignUI() {
  const total  = RAISLAR_DATA.filter(u => u.role === 'rais').length;
  const n      = _assignState.selected.size;
  const label  = document.getElementById('taskAssignLabel');
  const count  = document.getElementById('taskAssignCount');
  const allChk = document.getElementById('taskAssignAll');

  if (label) label.textContent = n === 0 ? `Barcha raislar (${total} ta)` : `${n} ta rais tanlangan`;
  if (count) count.textContent = n === 0 ? `Barcha ${total} ta` : `${n} ta tanlangan`;
  if (allChk) {
    allChk.checked = n === 0;
    allChk.indeterminate = n > 0 && n < total;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _buildAssignList();

  // Tashqariga bosganda yopish
  document.addEventListener('click', e => {
    const wrap = document.getElementById('taskAssignWrap');
    if (wrap && !wrap.contains(e.target)) {
      const dd = document.getElementById('taskAssignDropdown');
      const tr = document.getElementById('taskAssignTrigger');
      if (dd) dd.classList.remove('open');
      if (tr) tr.classList.remove('open');
      _assignState.open = false;
    }
  });
});

document.getElementById('createTaskForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const el = document.getElementById('taskCreateResult');

  // assignedTo: bo'sh Set = barchasi, aks holda tanlangan id lar
  const assignedTo = _assignState.selected.size === 0
    ? 'all'
    : [..._assignState.selected];

  const data = {
    title:        document.getElementById('taskTitle').value.trim(),
    description:  document.getElementById('taskDesc').value.trim(),
    deadline:     document.getElementById('taskDeadline').value,
    assignedTo,
    priority:     document.getElementById('taskPriority').value,
    isHokimiyat:  document.getElementById('taskIsHokimiyat').checked,
  };

  if (!data.title) {
    el.style.display = 'flex'; el.className = 'alert-error';
    el.innerHTML = '<i class="fas fa-times-circle"></i> Topshiriq sarlavhasini kiriting!';
    return;
  }

  const res = await API.createTask(data);
  el.style.display = 'flex';
  el.className = res.success ? 'alert-success' : 'alert-error';
  el.innerHTML = `<i class="fas ${res.success?'fa-check-circle':'fa-times-circle'}"></i>
    ${res.success ? 'Topshiriq muvaffaqiyatli yuborildi!' : res.message}`;
  if (res.success) {
    this.reset();
    _assignState.selected.clear();
    _buildAssignList();
    AdminPanel.loadTasks();
    setTimeout(() => el.style.display = 'none', 3000);
  }
});

// =====================================================
// XARITA YORDAMCHISI (Leaflet)
// =====================================================
let _reportMapInstance = null;
function _initReportMap(containerId, lat, lng) {
  if (_reportMapInstance) {
    _reportMapInstance.remove();
    _reportMapInstance = null;
  }
  const el = document.getElementById(containerId);
  if (!el || typeof L === 'undefined') return;
  el.style.height = '260px';
  _reportMapInstance = L.map(el, { zoomControl: true }).setView([lat, lng], 16);
  // Satellite tiles (Esri World Imagery)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri, DigitalGlobe',
    maxZoom: 19,
  }).addTo(_reportMapInstance);
  L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, opacity: 0.7,
  }).addTo(_reportMapInstance);
  L.marker([lat, lng]).addTo(_reportMapInstance)
    .bindPopup(`<strong>Hisobot joylashuvi</strong><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
  setTimeout(() => _reportMapInstance && _reportMapInstance.invalidateSize(), 200);
}

// =====================================================
// MODAL YOPISH
// =====================================================
function closeModal(event) {
  if (event.target === event.currentTarget) {
    document.getElementById('reportModal').style.display = 'none';
    if (_reportMapInstance) { _reportMapInstance.remove(); _reportMapInstance = null; }
  }
}

function closeRaisModal(event) {
  if (event.target === event.currentTarget) {
    document.getElementById('raisDetailModal').style.display = 'none';
  }
}

// Initialization
document.getElementById('settingsApiUrl') && (() => {
  document.getElementById('settingsApiUrl').value = CONFIG.API_URL;
})();

// =====================================================
// XSS HIMOYA
// =====================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  AdminPanel.loadDashboard();
});
