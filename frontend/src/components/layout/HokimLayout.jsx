import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const nav = [
  { to: '/hokim/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/hokim/chats',     icon: '💬', label: 'Barcha xabarlar' },
  { to: '/hokim/emergency', icon: '🚨', label: 'Favqulodda' },
  { to: '/hokim/analytics', icon: '📈', label: 'Tahlil' },
];

export default function HokimLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            <div>
              <div className="text-sm font-bold text-white">Mahalla Tizimi</div>
              <div className="text-xs text-gold-500">Hokim paneli</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3">
            <div className="text-xs text-gold-400 font-medium mb-1">🏛️ Hokim</div>
            <div className="text-sm font-semibold text-white truncate">{user?.full_name}</div>
            <div className="text-xs text-gray-400 mt-0.5">Boysun tumani</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-gold-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
              }
            >
              <span className="text-lg">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={() => { logout(); navigate('/login'); toast.success('Chiqildi'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all">
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
