import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const nav = [
  { to: '/admin/users',    icon: '👥', label: 'Foydalanuvchilar' },
  { to: '/admin/mahallas', icon: '🏘️', label: 'Mahallalar' },
];

export default function AdminLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl">⚙️</div>
            <div>
              <div className="text-sm font-bold text-white">Mahalla Tizimi</div>
              <div className="text-xs text-purple-400">Super Admin</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl p-3">
            <div className="text-xs text-purple-400 font-medium mb-1">🛡️ Super Admin</div>
            <div className="text-sm font-semibold text-white">{user?.full_name}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
              }
            >
              <span className="text-lg">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <button onClick={() => { logout(); navigate('/login'); toast.success('Chiqildi'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all">
            <span className="text-lg">🚪</span> Chiqish
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
