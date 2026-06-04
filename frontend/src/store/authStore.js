import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('mb_user') || 'null'),
  token:   localStorage.getItem('mb_token') || null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success) {
        localStorage.setItem('mb_token', res.token);
        localStorage.setItem('mb_user', JSON.stringify(res.user));
        set({ user: res.user, token: res.token });
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch {
      return { success: false, message: 'Tarmoq xatosi' };
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    set({ user: null, token: null });
  },

  isRole: (...roles) => roles.includes(get().user?.role),
}));

export default useAuthStore;
