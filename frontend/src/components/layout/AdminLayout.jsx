import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';
import Icon from '../ui/Icon';
import { initials } from '../chat/chatUtils';

const nav = [
  { to: '/admin/users',    icon: 'users', label: 'Foydalanuvchilar' },
  { to: '/admin/mahallas', icon: 'home',  label: 'Mahallalar' },
];

export default function AdminLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar — to'q binafsha (super admin) */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 via-[#2a1445] to-[#170a28] flex flex-col flex-shrink-0 border-r border-white/5">

        {/* Logo */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 p-[1.5px] shadow-lg shadow-purple-500/15">
              <div className="w-full h-full rounded-[0.65rem] bg-[#2a1445] flex items-center justify-center">
                <Icon name="shield" className="w-5 h-5 text-purple-300" strokeWidth={1.8} />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Mahalla Tizimi</div>
              <div className="text-[11px] text-purple-300/90 font-medium tracking-wide">SUPER ADMIN</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-white/[0.07]">
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.full_name}</div>
              <div className="text-[11px] text-white/50">Tizim boshqaruvchisi</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-white/30 tracking-[0.15em] uppercase px-4 pt-1 pb-2">
            Boshqaruv
          </div>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.07]'}`
              }
            >
              <Icon name={n.icon} className="w-[18px] h-[18px] flex-shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/[0.07] space-y-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.07] transition-all">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-[18px] h-[18px]" />
            {theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <button onClick={() => { logout(); navigate('/login'); toast.success('Chiqildi'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <Icon name="logout" className="w-[18px] h-[18px]" />
            Chiqish
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
