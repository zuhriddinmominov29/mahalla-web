import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';
import Icon from '../ui/Icon';
import { initials } from '../chat/chatUtils';

const nav = [
  { to: '/rais/hisobotlar', icon: 'report', label: 'Hisobotlar' },
  { to: '/rais/vaziyat',    icon: 'alert',  label: 'Vaziyat' },
];

export default function RaisLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
          {initials(user?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight truncate">{user?.full_name}</div>
          <div className="text-[11px] text-gray-500 leading-tight truncate">
            {user?.role === 'uyushma' ? 'Uyushma rahbari' : 'Mahalla raisi'}
            {user?.mahalla_name ? ` · ${user.mahalla_name} MFY` : ''}
          </div>
        </div>
        <button onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-[18px] h-[18px]" />
        </button>
        <button onClick={() => { logout(); navigate('/login'); toast.success('Tizimdan chiqildi'); }}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          title="Chiqish">
          <Icon name="logout" className="w-[18px] h-[18px]" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex flex-shrink-0 px-2 pb-[env(safe-area-inset-bottom)]">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium"
          >
            {({ isActive }) => (
              <>
                <span className={`px-5 py-1.5 rounded-full transition-all duration-200
                  ${isActive
                    ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300'
                    : 'text-gray-400'}`}>
                  <Icon name={n.icon} className="w-5 h-5" strokeWidth={isActive ? 2.2 : 2} />
                </span>
                <span className={isActive
                  ? 'text-primary-600 dark:text-primary-300 font-semibold'
                  : 'text-gray-500'}>
                  {n.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
