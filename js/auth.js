/**
 * MAHALLA TIZIMI — AUTENTIFIKATSIYA (Backend JWT)
 */

const Auth = {
  SESSION_KEY: 'mahalla_session',
  TOKEN_KEY:   'mahalla_token',

  // Kirish — Backend ga so'rov
  async login(username, password) {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ login: username.trim(), password: password.trim() }),
      });

      if (!res.ok) throw new Error(`Server xatosi: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        // Token va sessiyani saqlash
        localStorage.setItem(Auth.TOKEN_KEY,   data.token);
        localStorage.setItem(Auth.SESSION_KEY, JSON.stringify({
          ...data.user,
          token:  data.token,
          expiry: Date.now() + CONFIG.SESSION_HOURS * 3600000,
        }));
      }
      return data;
    } catch (err) {
      console.error('Login xatosi:', err);
      return { success: false, message: 'Internet yoki server xatosi!' };
    }
  },

  // Sessiyani olish
  getUser() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session.expiry && Date.now() > session.expiry) {
        this.logout();
        return null;
      }
      return session;
    } catch { return null; }
  },

  // JWT tokenni olish
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  },

  // Chiqish
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    window.location.href = 'index.html';
  },

  // Sahifani himoya qilish
  require(role) {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    if (role && user.role !== role) {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'rais.html';
      return null;
    }
    return user;
  },

  // Parolni o'zgartirish
  async changePassword(userId, newPassword) {
    try {
      const res = await fetch(`${CONFIG.API_URL}/api/auth/change-password`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify({ userId, newPassword }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};
