import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const connectSocket = useCallback((userId) => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    s.on('connect', () => { s.emit('join-user-room', userId); });
    s.on('notification:new', (d) => { toast.success(d.message, { duration: 5000 }); setUnreadCount(p => p + 1); });
    s.on('task:created',    () => window.dispatchEvent(new CustomEvent('tasks:refresh')));
    s.on('report:submitted',() => window.dispatchEvent(new CustomEvent('reports:refresh')));
    setSocket(s);
    return s;
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      setUser(data);
      connectSocket(data.id);
    } catch { localStorage.removeItem('token'); }
    finally { setLoading(false); }
  }, [connectSocket]);

  useEffect(() => {
    loadUser();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    connectSocket(data.user.id);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (socket) { socket.disconnect(); setSocket(null); }
    toast.success('Tizimdan chiqildi.');
    window.location.href = '/login';
  };

  const value = {
    user, loading, socket, unreadCount, setUnreadCount, login, logout, loadUser,
    isHokim:      () => user?.role === 'HOKIM',
    isDeputy:     () => user?.role === 'DEPUTY',
    isRais:       () => user?.role === 'RAIS',
    isSuperAdmin: () => user?.role === 'SUPER_ADMIN',
    isAdmin:      () => ['HOKIM', 'SUPER_ADMIN'].includes(user?.role),
    hasRole:      (...roles) => roles.includes(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
