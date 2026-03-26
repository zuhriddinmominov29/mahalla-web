/**
 * MAHALLA TIZIMI — API v2.0 (Backend REST + Cloudinary + Push)
 */

async function apiFetch(path, options = {}) {
  const url     = `${CONFIG.API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Auth.getToken()}`,
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    Auth.logout();
    throw new Error('Sessiya tugagan, qayta kiring');
  }
  return res.json();
}

const API = {

  // ============================================================
  // RASM YUKLASH (Cloudinary)
  // ============================================================
  async uploadPhotos(files) {
    try {
      const form = new FormData();
      files.forEach(f => form.append('photos', f));

      const res = await fetch(`${CONFIG.API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
        body: form,
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // PUSH NOTIFICATIONS
  // ============================================================
  async getVapidPublicKey() {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/push/vapid-public-key`);
      const data = await res.json();
      return data.publicKey || null;
    } catch { return null; }
  },

  async subscribePush(subscription) {
    try {
      return await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
      });
    } catch { return { success: false }; }
  },

  async unsubscribePush() {
    try {
      return await apiFetch('/api/push/unsubscribe', { method: 'POST' });
    } catch { return { success: false }; }
  },

  // ============================================================
  // HISOBOTLAR
  // ============================================================
  async submitReport(data) {
    try {
      return await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getMyReports(raisId, filter = 'all') {
    try {
      const qs = filter !== 'all' ? `?filter=${filter}` : '';
      return await apiFetch(`/api/reports/my${qs}`);
    } catch { return { success: true, data: [] }; }
  },

  async getMyStats() {
    try {
      return await apiFetch('/api/reports/my/stats');
    } catch { return { total: 0, thisMonth: 0, today: 0, activeTasks: 0 }; }
  },

  async getAllReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.raisId   && filters.raisId   !== 'all') params.set('raisId',   filters.raisId);
      if (filters.type     && filters.type     !== 'all') params.set('type',     filters.type);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo)   params.set('dateTo',   filters.dateTo);
      const qs = params.toString() ? `?${params}` : '';
      return await apiFetch(`/api/reports${qs}`);
    } catch { return { success: true, data: [] }; }
  },

  async getAdminStats() {
    try {
      return await apiFetch('/api/reports/stats');
    } catch { return { totalRaislar: 39, totalReports: 0, todayReports: 0, monthReports: 0, missingCount: 39, submittedRaisIds: [] }; }
  },

  // Rais kartalar uchun oylik xulosa
  async getRaisSummary(month, year) {
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (year)  params.set('year',  year);
      return await apiFetch(`/api/reports/rais-summary?${params}`);
    } catch { return { success: false, data: [] }; }
  },

  async getMonthlyChartData(year) {
    try { return await apiFetch(`/api/reports/chart/monthly?year=${year}`); }
    catch { return [0,0,0,0,0,0,0,0,0,0,0,0]; }
  },

  async getDailyChartData() {
    try { return await apiFetch('/api/reports/chart/daily'); }
    catch { return { labels: [], data: [] }; }
  },

  async getTopRaislar(limit = 10) {
    try { return await apiFetch(`/api/reports/top?limit=${limit}`); }
    catch { return []; }
  },

  async getTaskReports(taskId) {
    try { return await apiFetch(`/api/reports/task/${taskId}`); }
    catch { return []; }
  },

  async getTaskSubmitters(taskId) {
    const reports = await this.getTaskReports(taskId);
    return new Set((Array.isArray(reports) ? reports : []).map(r => r.raisId));
  },

  async getReportDetail(id) {
    try { return await apiFetch(`/api/reports/${id}`); }
    catch { return { success: false }; }
  },

  // ============================================================
  // FOYDALANUVCHILAR
  // ============================================================
  async getRaislar() {
    try { return await apiFetch('/api/users'); }
    catch { return { success: false, data: [] }; }
  },

  async addRais(data) {
    try { return await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) }); }
    catch (err) { return { success: false, message: err.message }; }
  },

  async deleteRais(uid) {
    try { return await apiFetch(`/api/users/${uid}`, { method: 'DELETE' }); }
    catch (err) { return { success: false, message: err.message }; }
  },

  // ============================================================
  // TOPSHIRIQLAR
  // ============================================================
  async createTask(data) {
    try { return await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }); }
    catch (err) { return { success: false, message: err.message }; }
  },

  async getAllTasks() {
    try { return await apiFetch('/api/tasks'); }
    catch { return { success: true, data: [] }; }
  },

  async getMyTasks() {
    try { return await apiFetch('/api/tasks/active'); }
    catch { return { success: true, data: [] }; }
  },

  async closeTask(taskId) {
    try { return await apiFetch(`/api/tasks/${taskId}/close`, { method: 'PATCH' }); }
    catch (err) { return { success: false, message: err.message }; }
  },

  async deleteTask(taskId) {
    try { return await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' }); }
    catch (err) { return { success: false, message: err.message }; }
  },

  // ============================================================
  // YORDAMCHI
  // ============================================================
  async testConnection() {
    try {
      const res  = await fetch(`${CONFIG.API_URL}/api/health`);
      const data = await res.json();
      return { success: data.success, message: data.message, details: data };
    } catch (err) {
      return { success: false, message: "Backend ga ulanib bo'lmadi: " + err.message };
    }
  },

  getGeolocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Brauzer geolokatsiyani qo'llab-quvvatlamaydi"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        err => {
          const msgs = { 1: 'Geolokatsiyaga ruxsat berilmadi.', 2: 'Joylashuv aniqlanmadi.', 3: 'Vaqt tugadi.' };
          reject(new Error(msgs[err.code] || 'Geolokatsiya xatosi'));
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 30000 }
      );
    });
  },

  exportToCSV(reports) {
    const headers = ['#','Rais','Mahalla','Tuman','Sana','Sarlavha',
      'Murojaat','Hal etilgan','Oilaviy ziyorat','Yoshlar','Ijtimoiy','Uy-joy','Yuborilgan'];
    const rows = reports.map((r, i) => [
      i+1, `"${r.raisName}"`, `"${r.mahalla}"`, `"${r.district||''}"`,
      r.reportDate, `"${r.reportTitle}"`,
      r.ind1, r.ind2, r.ind3, r.ind4, r.ind5, r.ind6,
      `"${formatDateTime(r.submittedAt)}"`,
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `mahalla_hisobotlar_${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  },
};
