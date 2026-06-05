import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const nav = [
  { to: '/rais/hisobotlar', icon: '📋', label: 'Hisobotlar' },
  { to: '/rais/vaziyat',    icon: '⚠️',  label: "Vaziyat" },
];

export default function RaisLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-base">🏛️</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">{user?.full_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 leading-tight truncate">
            {user?.role === 'uyushma' ? '🤝 Uyushma Rahbari' : '👤 Mahalla Raisi'}
            {user?.mahalla_name ? ` · ${user.mahalla_name} MFY` : ''}
          </div>
        </div>
        <button onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-base"
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button onClick={() => { logout(); navigate('/login'); toast.success('Tizimdan chiqildi'); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-500 transition-all text-base"
          title="Chiqish">
          🚪
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex flex-shrink-0">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all duration-200
              ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{n.icon}</span>
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
