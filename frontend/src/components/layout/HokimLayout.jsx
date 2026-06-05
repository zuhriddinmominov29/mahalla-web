import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const nav = [
  { to: '/hokim/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/hokim/chats',     icon: '📋', label: 'Hisobotlar' },
  { to: '/hokim/emergency', icon: '⚠️',  label: "Vaziyat bo'limi" },
  { to: '/hokim/analytics', icon: '📈', label: 'Tahlil' },
  { to: '/hokim/map',       icon: '🗺️',  label: 'Xarita' },
];

export default function HokimLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Mahalla Tizimi</div>
              <div className="text-xs text-gold-500">Hokim paneli</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-3">
            <div className="text-xs text-gold-600 dark:text-gold-400 font-medium mb-1">🏛️ Hokim</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Boysun tumani</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gold-500 text-gray-950 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'}`
              }
            >
              <span className="text-lg">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-200 dark:border-gray-800 space-y-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <button onClick={() => { logout(); navigate('/login'); toast.success('Chiqildi'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
            <span className="text-lg">🚪</span> Chiqish
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
