import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = { SUPER_ADMIN: 'bg-purple-600', HOKIM: 'bg-blue-700', DEPUTY: 'bg-indigo-600', RAIS: 'bg-green-600' };
const ROLE_LABELS = { SUPER_ADMIN: 'Super Admin', HOKIM: 'Hokim', DEPUTY: "O'rinbosar", RAIS: 'Mahalla Raisi' };

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    <span className="text-lg">{icon}</span><span>{label}</span>
  </NavLink>
);

const Layout = () => {
  const { user, logout, unreadCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/tasks',     icon: '📋', label: 'Topshiriqlar' },
    { to: '/reports',   icon: '📝', label: 'Hisobotlar' },
    ...(['SUPER_ADMIN', 'HOKIM'].includes(user?.role) ? [{ to: '/admin', icon: '⚙️', label: 'Boshqaruv' }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white text-xl shadow-md">🇺🇿</div>
          <div><p className="font-bold text-gray-900 text-sm">Mahalla Nazorat</p><p className="text-xs text-gray-400">O'zbekiston</p></div>
        </div>
      </div>

      <div className="mx-3 mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer" onClick={() => { navigate('/profile'); setSidebarOpen(false); }}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${ROLE_COLORS[user?.role]} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-blue-600">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        {user?.mahalla && <p className="text-xs text-gray-400 mt-1 truncate">📍 {user.mahalla}</p>}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map(item => <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />)}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
          <span>🚪</span><span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 bg-white h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="hidden lg:flex items-center gap-1 text-sm text-gray-400">
            <span>🇺🇿</span><span>O'zbekiston Respublikasi • Mahalla Nazorat Tizimi</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => navigate('/dashboard')} className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <div className={`lg:hidden w-8 h-8 ${ROLE_COLORS[user?.role]} rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer`} onClick={() => navigate('/profile')}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
