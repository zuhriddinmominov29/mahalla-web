import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const nav = [
  { to: '/rais/chat',      icon: '💬', label: 'Hisobot yuborish' },
  { to: '/rais/emergency', icon: '🚨', label: 'Favqulodda vaziyat' },
];

export default function RaisLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
    toast.success('Tizimdan chiqildi');
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-xl">🏛️</div>
            <div>
              <div className="text-sm font-bold text-white">Mahalla Tizimi</div>
              <div className="text-xs text-gray-500">Boysun tumani</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-3">
            <div className="text-xs text-primary-400 font-medium mb-1">
              {user?.role === 'uyushma' ? '🤝 Uyushma Rahbari' : '👤 Mahalla Raisi'}
            </div>
            <div className="text-sm font-semibold text-white truncate">{user?.full_name}</div>
            {user?.mahalla_name && (
              <div className="text-xs text-gray-400 mt-0.5">{user.mahalla_name} MFY</div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
              }
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400
                       hover:text-red-400 hover:bg-red-950/30 transition-all duration-200"
          >
            <span className="text-lg">🚪</span> Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
