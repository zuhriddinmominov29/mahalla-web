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

  function handleLogout() {
    logout();
    navigate('/login');
    toast.success('Tizimdan chiqildi');
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

      {/* Top header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-base">🏛️</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white leading-tight truncate">{user?.full_name}</div>
          <div className="text-xs text-gray-500 leading-tight truncate">
            {user?.role === 'uyushma' ? '🤝 Uyushma Rahbari' : '👤 Mahalla Raisi'}
            {user?.mahalla_name ? ` · ${user.mahalla_name} MFY` : ''}
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-all text-base"
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all text-base"
          title="Chiqish"
        >
          🚪
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bg-gray-900 border-t border-gray-800 flex flex-shrink-0 safe-area-bottom">
        {nav.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all duration-200
              ${isActive ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {n.icon}
                </span>
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
