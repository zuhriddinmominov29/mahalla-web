/**
 * MAHALLA TIZIMI — RAIS PANELI LOGIKASI (Backend versiya)
 */

// Kirish tekshiruvi
const currentUser = Auth.require('rais');
if (!currentUser) throw new Error('Auth required');

// Cache
let _cachedTasks   = [];
let _cachedReports = [];

// =====================================================
// NAVIGATSIYA
// =====================================================
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById(`section-${name}`);
  const navItem = document.querySelector(`.nav-item[data-section="${name}"]`);

  if (section) section.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const titles = {
    dashboard: { h: 'Bosh Sahifa',          p: 'Xush kelibsiz' },
    submit:    { h: 'Hisobot Yuklash',       p: 'Yangi hisobot yuborish' },
    tasks:     { h: 'Topshiriqlar',          p: 'Sizga berilgan topshiriqlar' },
    history:   { h: 'Mening Hisobotlarim',   p: 'Yuborilgan hisobotlar' },
    profile:   { h: 'Profilim',             p: 'Shaxsiy ma\'lumotlar' },
  };
  const t = titles[name] || { h: name, p: '' };
  document.getElementById('pageTitle').textContent    = t.h;
  document.getElementById('pageSubtitle').textContent = t.p;

  if (name === 'dashboard') loadDashboard();
  if (name === 'tasks')     loadTasks();
  if (name === 'history')   loadHistory();
  if (name === 'profile')   loadProfile();

  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    showSection(this.dataset.section);
  });
});

// =====================================================
// DASHBOARD
// =====================================================
async function loadDashboard() {
  document.getElementById('welcomeName').textContent    = currentUser.fullName.split(' ')[0] || 'Rais';
  document.getElementById('headerUserName').textContent = currentUser.fullName;

  const stats = await API.getMyStats(currentUser.id);
  document.getElementById('statTotal').textContent       = stats.total || 0;
  document.getElementById('statThisMonth').textContent   = stats.thisMonth || 0;
  document.getElementById('statActiveTasks').textContent = stats.activeTasks || 0;

  const todayCard = document.getElementById('statTodayCard');
  const todayEl   = document.getElementById('statToday');
  if ((stats.today || 0) > 0) {
    todayEl.textContent    = '✓';
    todayCard.className    = 'stat-card stat-green';
    todayCard.title        = `Bugun ${stats.today} ta hisobot yuborilgan`;
  } else {
    todayEl.textContent    = '✗';
    todayCard.className    = 'stat-card stat-red';
    todayCard.title        = 'Bugun hali hisobot yuborilmagan';
  }

  const badge = document.getElementById('raisTasksBadge');
  if (badge && (stats.activeTasks || 0) > 0) {
    badge.textContent    = stats.activeTasks;
    badge.style.display  = 'inline-flex';
  }

  const res  = await API.getMyReports(currentUser.id);
  _cachedReports = res.data || [];
  const list = _cachedReports.slice(0, 5);
  const el   = document.getElementById('recentReportsList');

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Hali hisobot yuborilmagan</p></div>`;
    return;
  }
  el.innerHTML = list.map(r => `
    <div class="mini-report-item">
      <div class="mini-report-left">
        <span class="mini-report-title">${escHtml(r.reportTitle)}</span>
        <span class="mini-report-meta">${formatDate(r.reportDate)} &bull; ${escHtml(r.mahalla)}</span>
      </div>
      <div class="mini-report-right">
        <button class="btn-view" onclick="viewMyReport('${r.id}')"><i class="fas fa-eye"></i></button>
      </div>
    </div>
  `).join('');
}

// =====================================================
// HISOBOT YUBORISH
// =====================================================
const reportForm = document.getElementById('reportForm');
const cm = currentMonthYear();

document.getElementById('reportDate').value  = TODAY;
document.getElementById('reportMonth').value = cm.month;
document.getElementById('reportYear').value  = cm.year;

reportForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const btn       = document.getElementById('submitBtn');
  const successEl = document.getElementById('reportSuccess');
  const errorEl   = document.getElementById('reportError');
  successEl.style.display = 'none';
  errorEl.style.display   = 'none';

  const data = {
    reportType:    'daily',
    reportDate:    document.getElementById('reportDate').value,
    reportTitle:   document.getElementById('reportTitle').value.trim(),
    reportMonth:   parseInt(document.getElementById('reportMonth').value) || cm.month,
    reportYear:    parseInt(document.getElementById('reportYear').value)  || cm.year,
    ind1: document.getElementById('ind1').value,
    ind2: document.getElementById('ind2').value,
    ind3: document.getElementById('ind3').value,
    ind4: document.getElementById('ind4').value,
    ind5: document.getElementById('ind5').value,
    ind6: document.getElementById('ind6').value,
    reportContent: document.getElementById('reportContent').value.trim(),
    reportIssues:  document.getElementById('reportIssues').value.trim(),
  };

  if (!data.reportDate || !data.reportTitle || !data.reportContent) {
    document.getElementById('reportErrorMsg').textContent = 'Majburiy maydonlarni to\'ldiring!';
    errorEl.style.display = 'flex';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';

  try {
    // Avval rasmlarni Cloudinary ga yuklash
    const photoUrls = await uploadPhotosToCloud(selectedFiles);

    const res = await API.submitReport({ ...data, photos: photoUrls });
    if (res.success) {
      successEl.style.display = 'flex';
      selectedFiles = [];
      resetReportForm();
      const stats = await API.getMyStats();
      document.getElementById('statTotal').textContent     = stats.total || 0;
      document.getElementById('statThisMonth').textContent = stats.thisMonth || 0;
      const todayEl = document.getElementById('statToday');
      if (todayEl && (stats.today || 0) > 0) { todayEl.textContent = '✓'; }
    } else {
      document.getElementById('reportErrorMsg').textContent = res.message || 'Xatolik yuz berdi';
      errorEl.style.display = 'flex';
    }
  } catch (err) {
    document.getElementById('reportErrorMsg').textContent = "Tarmoq xatosi. Qayta urinib ko'ring.";
    errorEl.style.display = 'flex';
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
});

function resetReportForm() {
  reportForm.reset();
  document.getElementById('reportDate').value = TODAY;
  document.getElementById('reportSuccess').style.display = 'none';
  document.getElementById('reportError').style.display   = 'none';
}

// =====================================================
// TARIX
// =====================================================
async function loadHistory() {
  const monthFilter = document.getElementById('historyMonthFilter').value || 'all';
  const el = document.getElementById('historyList');
  el.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

  const res  = await API.getMyReports(currentUser.id);
  _cachedReports = res.data || [];
  let list = _cachedReports;

  const sel = document.getElementById('historyMonthFilter');
  if (sel.options.length === 1) {
    const months = [...new Set(list.map(r => `${r.year}-${String(r.month).padStart(2,'0')}`))].sort().reverse();
    const monthNames = ['','Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    months.forEach(m => {
      const [y, mo] = m.split('-');
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${monthNames[parseInt(mo)]} ${y}`;
      sel.appendChild(opt);
    });
  }

  if (monthFilter !== 'all') {
    const [y, mo] = monthFilter.split('-');
    list = list.filter(r => r.year === parseInt(y) && r.month === parseInt(mo));
  }

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Hisobotlar topilmadi</p></div>`;
    return;
  }

  el.innerHTML = `
    <table class="reports-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Sarlavha</th>
          <th>Sana</th>
          <th>Murojaat</th>
          <th>Hal etilgan</th>
          <th>Oilaviy ziyorat</th>
          <th>Yuborilgan</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${list.map((r, i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${escHtml(r.reportTitle)}</strong></td>
            <td>${formatDate(r.reportDate)}</td>
            <td>${r.ind1 || 0}</td>
            <td>${r.ind2 || 0}</td>
            <td>${r.ind3 || 0}</td>
            <td>${formatDateTime(r.submittedAt)}</td>
            <td><button class="btn-view" onclick="viewMyReport('${r.id}')"><i class="fas fa-eye"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function filterHistory() { loadHistory(); }

// =====================================================
// HISOBOT KO'RISH MODALI
// =====================================================
let _raisMapInstance = null;

async function viewMyReport(id) {
  // Cache dan tez izlash
  let r = _cachedReports.find(rep => rep.id === id || rep._id === id);

  if (!r) {
    // Backenddan yuklab olish
    const res = await API.getReportDetail(id);
    if (!res.success) return;
    r = res.data;
  }

  document.getElementById('reportModalTitle').textContent = r.reportTitle;
  document.getElementById('reportModalBody').innerHTML = `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Sana</span>
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
    ${r.content ? `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Hisobot Matni</span>
      <span class="modal-detail-value"><div class="modal-text-block">${escHtml(r.content)}</div></span>
    </div>` : ''}
    ${r.issues ? `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Muammolar</span>
      <span class="modal-detail-value"><div class="modal-text-block">${escHtml(r.issues)}</div></span>
    </div>` : ''}
    ${r.photos && r.photos.length > 0 ? `
    <div class="modal-detail-row">
      <span class="modal-detail-label"><i class="fas fa-camera" style="color:#C9A227"></i> Rasmlar</span>
      <span class="modal-detail-value">
        <div class="modal-photos-grid">
          ${r.photos.map(p => `<img src="${p}" class="modal-photo" onclick="openPhotoFull(this.src)" loading="lazy">`).join('')}
        </div>
      </span>
    </div>` : ''}
    <div class="modal-detail-row">
      <span class="modal-detail-label">Yuborilgan</span>
      <span class="modal-detail-value">${formatDateTime(r.submittedAt)}</span>
    </div>
    ${r.latitude && r.longitude ? `
    <div class="modal-detail-row">
      <span class="modal-detail-label"><i class="fas fa-map-marker-alt" style="color:#E63946"></i> Joylashuv</span>
      <span class="modal-detail-value">
        <div class="report-map-coords">${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}</div>
        <div id="reportMapRais" class="report-map-container"></div>
      </span>
    </div>` : ''}
  `;

  document.getElementById('reportDetailModal').style.display = 'flex';

  if (r.latitude && r.longitude) {
    setTimeout(() => {
      if (_raisMapInstance) { _raisMapInstance.remove(); _raisMapInstance = null; }
      const el = document.getElementById('reportMapRais');
      if (el && typeof L !== 'undefined') {
        el.style.height = '260px';
        _raisMapInstance = L.map(el, { zoomControl: true }).setView([r.latitude, r.longitude], 16);
        // Satellite tiles (Esri World Imagery)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri, DigitalGlobe',
          maxZoom: 19,
        }).addTo(_raisMapInstance);
        // Yo'l nomlari qatlami
        L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19, opacity: 0.7,
        }).addTo(_raisMapInstance);
        L.marker([r.latitude, r.longitude]).addTo(_raisMapInstance)
          .bindPopup(`<strong>Hisobot joylashuvi</strong><br>${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}`).openPopup();
        setTimeout(() => _raisMapInstance && _raisMapInstance.invalidateSize(), 200);
      }
    }, 150);
  }
}

function closeReportModal(event) {
  if (event.target === document.getElementById('reportDetailModal')) {
    document.getElementById('reportDetailModal').style.display = 'none';
  }
}

// Rasmni to'liq ochish
function openPhotoFull(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  overlay.innerHTML = `<img src="${src}" style="max-width:95vw;max-height:90vh;border-radius:8px;object-fit:contain">`;
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

// =====================================================
// PROFIL
// =====================================================
function loadProfile() {
  document.getElementById('profileName').textContent     = currentUser.fullName;
  document.getElementById('profileMahalla').textContent  = currentUser.mahalla;
  document.getElementById('profilePhone').textContent    = currentUser.phone || '—';
  document.getElementById('profileLogin').textContent    = currentUser.login;
  document.getElementById('profileDistrict').textContent = currentUser.district || '—';
}

document.getElementById('changePassForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const newPass  = document.getElementById('newPass').value;
  const confPass = document.getElementById('confirmPass').value;
  if (newPass !== confPass) {
    alert('Parollar mos kelmadi!');
    return;
  }
  if (newPass.length < 6) {
    alert('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
    return;
  }
  const res = await Auth.changePassword(currentUser.id, newPass);
  if (res && res.success) {
    alert('Parol muvaffaqiyatli o\'zgartirildi!');
    this.reset();
  } else {
    alert('Xatolik: ' + (res && res.message ? res.message : 'Qayta urinib ko\'ring'));
  }
});

// =====================================================
// TOPSHIRIQLAR (RAIS)
// =====================================================
async function loadTasks() {
  const listEl = document.getElementById('raisTasksList');
  if (!listEl) return;
  listEl.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>';

  const res  = await API.getMyTasks(currentUser.id);
  const list = res.data || [];
  _cachedTasks = list;

  const badge = document.getElementById('raisTasksBadge');
  if (badge) { badge.textContent = list.length; badge.style.display = list.length > 0 ? 'inline-flex' : 'none'; }

  if (list.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-check"></i>
        <p>Hozircha topshiriq yo'q</p>
      </div>`;
    return;
  }

  const priorityLabel = { low:'Past', normal:'Oddiy', high:'Muhim', urgent:'Shoshilinch' };
  const priorityClass = { low:'priority-low', normal:'priority-normal', high:'priority-high', urgent:'priority-urgent' };

  listEl.innerHTML = list.map((t, idx) => {
    const overdue = t.deadline && new Date(t.deadline) < new Date();
    return `
      <div class="task-card rais-task-card">
        <div class="task-card-top">
          <div class="task-card-left">
            <div class="task-title-row">
              <span class="task-title">${escHtml(t.title)}</span>
              ${t.isHokimiyat ? '<span class="task-geo-badge"><i class="fas fa-map-marker-alt"></i> Geo majburiy</span>' : ''}
              <span class="priority-badge ${priorityClass[t.priority]||'priority-normal'}">${priorityLabel[t.priority]||'Oddiy'}</span>
            </div>
            ${t.description ? `<p class="task-desc">${escHtml(t.description)}</p>` : ''}
            <div class="task-meta">
              <span><i class="fas fa-calendar-plus"></i> Berilgan: ${formatDateTime(t.createdAt)}</span>
              ${t.deadline ? `<span><i class="fas fa-calendar-times" style="color:${overdue?'#B71C1C':'inherit'}"></i> Muddat: <strong>${formatDate(t.deadline)}</strong>${overdue?'<span class="task-overdue-badge">O\'tgan</span>':''}</span>` : ''}
            </div>
          </div>
          <div class="task-status-side">
            <button class="btn-primary btn-task-submit" onclick="openTaskSubmit('${escHtml(t.id)}')">
              <i class="fas fa-paper-plane"></i> Hisobot Yuborish
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// =====================================================
// RASM YUKLASH (Cloudinary)
// =====================================================
let selectedFiles = [];   // kunlik hisobot uchun
let trPhotos      = [];   // topshiriq hisoboti uchun (File objects)

// Umumiy funksiya: input ni qabul qilib, to'g'ri massivga saqlaydi
function handlePhotoSelect(input) {
  const isTask = (input.id === 'trPhotoInput');
  const arr    = isTask ? trPhotos : selectedFiles;

  Array.from(input.files).slice(0, 3 - arr.length).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(`"${file.name}" juda katta (maks 5MB)`);
      return;
    }
    arr.push(file);
    renderPhotoPreviews(isTask ? 'photoPreviewsContainer' : 'photoPreviewGrid', arr, isTask);
  });
  input.value = '';
}

function removePhoto(index, isTask) {
  const arr = isTask ? trPhotos : selectedFiles;
  if (arr[index]) URL.revokeObjectURL(arr[index]._previewUrl);
  arr.splice(index, 1);
  renderPhotoPreviews(isTask ? 'photoPreviewsContainer' : 'photoPreviewGrid', arr, isTask);
}

function renderPhotoPreviews(containerId, arr, isTask) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = arr.map((f, i) => {
    if (!f._previewUrl) f._previewUrl = URL.createObjectURL(f);
    return `
      <div class="photo-preview-item">
        <img src="${f._previewUrl}" alt="${escHtml(f.name)}">
        <button type="button" class="photo-remove-btn" onclick="removePhoto(${i}, ${isTask})">
          <i class="fas fa-times"></i>
        </button>
        <span class="photo-preview-name">${escHtml(f.name)}</span>
      </div>
    `;
  }).join('');

  const area = document.getElementById('photoUploadArea');
  if (area) area.classList.toggle('upload-area-full', arr.length >= 3);
}

// Cloudinary ga yuklash
async function uploadPhotosToCloud(files) {
  if (!files.length) return [];
  const statusEl = document.getElementById('photoUploadStatus');
  if (statusEl) {
    statusEl.style.display = 'flex';
    statusEl.className     = 'alert-info';
    statusEl.innerHTML     = '<i class="fas fa-spinner fa-spin"></i> Rasmlar yuklanmoqda...';
  }

  const res = await API.uploadPhotos(files);

  if (statusEl) statusEl.style.display = 'none';

  if (res.success) return res.urls || [];

  // Cloudinary sozlanmagan bo'lsa — xato ko'rsatamiz lekin davom etamiz
  console.warn('Rasm yuklanmadi:', res.message);
  return [];
}

// =====================================================
// TOPSHIRIQ HISOBOTI — OCHISH / YUBORISH
// =====================================================
function openTaskSubmit(taskId) {
  const task = _cachedTasks.find(t => String(t.id) === String(taskId) || String(t._id) === String(taskId));
  if (!task) {
    alert('Topshiriq ma\'lumoti topilmadi. Sahifani yangilang.');
    return;
  }
  const listEl   = document.getElementById('taskListView');
  const detailEl = document.getElementById('taskDetailView');
  listEl.style.display   = 'none';
  detailEl.style.display = 'block';
  trPhotos = [];

  detailEl.innerHTML = `
    <button class="btn-back" onclick="closeTaskSubmit()">
      <i class="fas fa-arrow-left"></i> Topshiriqlar ro'yxatiga qaytish
    </button>

    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3><i class="fas fa-paper-plane"></i> Topshiriq Hisobotini Yuborish</h3>
      </div>
      <div class="card-body">

        <div class="task-info-block">
          <div class="task-info-title">${escHtml(task.title)}</div>
          ${task.description ? `<div class="task-info-desc">${escHtml(task.description)}</div>` : ''}
          ${task.deadline ? `<div class="task-info-meta"><i class="fas fa-calendar-times"></i> Muddat: <strong>${formatDate(task.deadline)}</strong></div>` : ''}
          ${task.isHokimiyat ? `
            <div class="task-geo-notice">
              <i class="fas fa-map-marker-alt"></i>
              <strong>Diqqat!</strong> Bu hokimiyat topshirig'i — hisobot yuborishda <strong>geolokatsiya majburiy</strong>
            </div>` : ''}
        </div>

        <form id="taskReportForm">
          <input type="hidden" id="trTaskId" value="${escHtml(String(task.id))}">
          <input type="hidden" id="trIsHokimiyat" value="${task.isHokimiyat ? 'true' : 'false'}">
          <input type="hidden" id="trLat" value="">
          <input type="hidden" id="trLng" value="">

          <div class="form-group">
            <label><i class="fas fa-heading"></i> Hisobot Sarlavhasi</label>
            <input type="text" id="trTitle" value="${escHtml(task.title)} bo'yicha hisobot" required>
          </div>

          <div class="report-categories">
            <h4><i class="fas fa-list-check"></i> Ko'rsatkichlar</h4>
            <div class="indicators-grid">
              <div class="indicator-item"><label>Aholidan murojaat</label><input type="number" id="trInd1" placeholder="0" min="0"></div>
              <div class="indicator-item"><label>Hal etilgan</label><input type="number" id="trInd2" placeholder="0" min="0"></div>
              <div class="indicator-item"><label>Oilaviy ziyorat</label><input type="number" id="trInd3" placeholder="0" min="0"></div>
              <div class="indicator-item"><label>Yoshlar tadbirlari</label><input type="number" id="trInd4" placeholder="0" min="0"></div>
              <div class="indicator-item"><label>Ijtimoiy yordam</label><input type="number" id="trInd5" placeholder="0" min="0"></div>
              <div class="indicator-item"><label>Uy-joy muammosi</label><input type="number" id="trInd6" placeholder="0" min="0"></div>
            </div>
          </div>

          <div class="form-group">
            <label><i class="fas fa-align-left"></i> Hisobot Matni</label>
            <textarea id="trContent" rows="5" placeholder="Topshiriq ijrosi haqida batafsil..." required></textarea>
          </div>

          <div class="form-group">
            <label><i class="fas fa-exclamation-triangle"></i> Muammolar / Takliflar</label>
            <textarea id="trIssues" rows="2" placeholder="Mavjud muammolar..."></textarea>
          </div>

          ${task.isHokimiyat ? `
          <div class="geo-section">
            <div class="geo-status" id="geoStatus">
              <i class="fas fa-map-marker-alt"></i>
              <span id="geoStatusText">Geolokatsiya aniqlanmagan</span>
            </div>
            <button type="button" class="btn-geo" id="geoBtn" onclick="requestGeolocation()">
              <i class="fas fa-crosshairs"></i> Joylashuvni Aniqlash
            </button>
          </div>

          <div class="photo-section">
            <label class="photo-section-label">
              <i class="fas fa-camera"></i> Rasm Yuklash
              <span class="optional-tag">(ixtiyoriy, maks 3 ta)</span>
            </label>
            <div class="photo-upload-area" id="photoUploadArea"
                 onclick="document.getElementById('trPhotoInput').click()">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Rasm yuklash uchun bosing yoki tashlang</p>
              <span class="photo-hint">JPG, PNG — har biri maks. 5MB, jami 3 ta</span>
            </div>
            <input type="file" id="trPhotoInput" accept="image/*" multiple
                   style="display:none" onchange="handlePhotoSelect(this)">
            <div class="photo-previews" id="photoPreviewsContainer"></div>
          </div>` : ''}

          <div id="trSuccess" class="alert-success" style="display:none">
            <i class="fas fa-check-circle"></i> Hisobot muvaffaqiyatli yuborildi!
          </div>
          <div id="trError" class="alert-error" style="display:none">
            <i class="fas fa-times-circle"></i> <span id="trErrorMsg"></span>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeTaskSubmit()">
              <i class="fas fa-times"></i> Bekor qilish
            </button>
            <button type="submit" class="btn-primary" id="trSubmitBtn">
              <i class="fas fa-paper-plane"></i> Yuborish
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('taskReportForm').addEventListener('submit', submitTaskReport);
}

function closeTaskSubmit() {
  document.getElementById('taskDetailView').style.display = 'none';
  document.getElementById('taskListView').style.display   = 'block';
  trPhotos = [];
  loadTasks();
}

// Geolokatsiya olish
async function requestGeolocation() {
  const btn    = document.getElementById('geoBtn');
  const status = document.getElementById('geoStatusText');
  if (!btn || !status) return;
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aniqlanmoqda...';
  status.textContent = 'Joylashuv aniqlanmoqda...';

  try {
    const geo = await API.getGeolocation();
    document.getElementById('trLat').value = geo.lat;
    document.getElementById('trLng').value = geo.lng;
    const geoStatus = document.getElementById('geoStatus');
    geoStatus.className = 'geo-status geo-ok';
    status.textContent  = `Joylashuv aniqlandi: ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)} (±${Math.round(geo.accuracy)}m)`;
    btn.innerHTML = '<i class="fas fa-check"></i> Aniqlandi';
    btn.className = 'btn-geo btn-geo-ok';
  } catch(err) {
    const geoStatus = document.getElementById('geoStatus');
    geoStatus.className = 'geo-status geo-error';
    status.textContent  = err.message;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-redo"></i> Qayta Urinish';
  }
}

// Topshiriq hisobotini yuborish
async function submitTaskReport(e) {
  e.preventDefault();
  const isHokimiyat = document.getElementById('trIsHokimiyat').value === 'true';
  const lat         = document.getElementById('trLat').value;
  const lng         = document.getElementById('trLng').value;
  const successEl   = document.getElementById('trSuccess');
  const errorEl     = document.getElementById('trError');
  const btn         = document.getElementById('trSubmitBtn');
  successEl.style.display = 'none';
  errorEl.style.display   = 'none';

  if (isHokimiyat && (!lat || !lng)) {
    document.getElementById('trErrorMsg').textContent = 'Geolokatsiya majburiy! Avval "Joylashuvni Aniqlash" tugmasini bosing.';
    errorEl.style.display = 'flex';
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';

  const now = new Date();
  const data = {
    taskId:        document.getElementById('trTaskId').value,
    reportType:    'task',
    reportDate:    now.toISOString().split('T')[0],
    reportTitle:   document.getElementById('trTitle').value.trim(),
    reportContent: document.getElementById('trContent').value.trim(),
    reportIssues:  document.getElementById('trIssues').value.trim(),
    reportMonth:   now.getMonth() + 1,
    reportYear:    now.getFullYear(),
    ind1: document.getElementById('trInd1')?.value || 0,
    ind2: document.getElementById('trInd2')?.value || 0,
    ind3: document.getElementById('trInd3')?.value || 0,
    ind4: document.getElementById('trInd4')?.value || 0,
    ind5: document.getElementById('trInd5')?.value || 0,
    ind6: document.getElementById('trInd6')?.value || 0,
    latitude:  lat ? parseFloat(lat)  : null,
    longitude: lng ? parseFloat(lng)  : null,
  };

  if (!data.reportTitle || !data.reportContent) {
    document.getElementById('trErrorMsg').textContent = 'Majburiy maydonlarni to\'ldiring!';
    errorEl.style.display = 'flex';
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
    return;
  }

  try {
    // Cloudinary ga yuklash
    const photoUrls = await uploadPhotosToCloud(trPhotos);
    const res = await API.submitReport({ ...data, photos: photoUrls });
    if (res.success) {
      successEl.style.display = 'flex';
      trPhotos = [];
      setTimeout(() => closeTaskSubmit(), 2000);
    } else {
      document.getElementById('trErrorMsg').textContent = res.message || 'Xatolik';
      errorEl.style.display = 'flex';
    }
  } catch {
    document.getElementById('trErrorMsg').textContent = "Tarmoq xatosi. Qayta urinib ko'ring.";
    errorEl.style.display = 'flex';
  }

  btn.disabled  = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
}

// =====================================================
// PUSH NOTIFICATION
// =====================================================
async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const publicKey = await API.getVapidPublicKey();
    if (!publicKey) return;

    const reg = await navigator.serviceWorker.ready;

    // Allaqachon obuna bo'lgan bo'lsa
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await API.subscribePush(existing.toJSON());
      return;
    }

    // Ruxsat so'rash (faqat bir marta, bildirishnomalar blocked bo'lmasa)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Yangi subscription yaratish
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await API.subscribePush(sub.toJSON());
    console.log('Push bildirishnomalar ulandi');
  } catch (err) {
    console.warn('Push notification ulana olmadi:', err.message);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

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
  loadDashboard();
  // Push notification ni 3 soniyadan so'ng so'rash (sahifa yuklangandan keyin)
  setTimeout(initPushNotifications, 3000);
});
