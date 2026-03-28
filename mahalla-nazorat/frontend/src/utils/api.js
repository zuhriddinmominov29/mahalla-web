import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: d => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  changePassword: d => api.put('/auth/change-password', d),
};

export const tasksAPI = {
  getAll: p => api.get('/tasks', { params: p }),
  getById: id => api.get(`/tasks/${id}`),
  create: d => api.post('/tasks', d),
  update: (id, d) => api.put(`/tasks/${id}`, d),
  delete: id => api.delete(`/tasks/${id}`),
};

export const reportsAPI = {
  getAll: p => api.get('/reports', { params: p }),
  getById: id => api.get(`/reports/${id}`),
  submit: fd => api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  review: (id, d) => api.put(`/reports/${id}/review`, d),
};

export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  byCategory: () => api.get('/analytics/tasks-by-category'),
  byMonth: y => api.get('/analytics/tasks-by-month', { params: { year: y } }),
  raisPerformance: () => api.get('/analytics/rais-performance'),
  notifications: () => api.get('/analytics/notifications'),
  readAllNotifications: () => api.put('/analytics/notifications/read-all'),
};

export const adminAPI = {
  getUsers: p => api.get('/admin/users', { params: p }),
  createUser: d => api.post('/admin/users', d),
  updateUser: (id, d) => api.put(`/admin/users/${id}`, d),
  deleteUser: id => api.delete(`/admin/users/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: d => api.post('/admin/categories', d),
  getDailyConfig: date => api.get('/admin/daily-config', { params: { date } }),
  saveDailyConfig: d => api.post('/admin/daily-config', d),
};

export default api;
