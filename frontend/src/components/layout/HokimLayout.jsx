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
    <div className="flex h-screen overflow-hidden theme-bg">
      <aside className="w-64 flex flex-col flex-shrink-0"
             style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Mahalla Tizimi</div>
              <div className="text-xs text-gold-500">Hokim paneli</div>
            </div>
          </div>
        </div>

        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3">
            <div className="text-xs text-gold-400 font-medium mb-1">🏛️ Hokim</div>
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Boysun tumani</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-gold-500 text-gray-950 shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
              }
              style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
            >
              <span className="text-lg">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all mb-1"
            style={{ color: 'var(--text-muted)' }}>
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <button onClick={() => { logout(); navigate('/login'); toast.success('Chiqildi'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            style={{ color: 'var(--text-muted)' }}>
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
