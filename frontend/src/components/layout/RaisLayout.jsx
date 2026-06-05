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
    <div className="flex flex-col h-screen overflow-hidden theme-bg">

      {/* Top header */}
      <header className="border-b theme-surface theme-border px-4 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-base">🏛️</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {user?.full_name}
          </div>
          <div className="text-xs leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
            {user?.role === 'uyushma' ? '🤝 Uyushma Rahbari' : '👤 Mahalla Raisi'}
            {user?.mahalla_name ? ` · ${user.mahalla_name} MFY` : ''}
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-base"
          style={{ color: 'var(--text-muted)' }}
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all"
          style={{ color: 'var(--text-muted)' }}
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
      <nav className="border-t flex flex-shrink-0 safe-area-bottom"
           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {nav.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all duration-200
              ${isActive ? 'text-primary-500' : ''}`
            }
            style={({ isActive }) => isActive ? {} : { color: 'var(--text-muted)' }}
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
