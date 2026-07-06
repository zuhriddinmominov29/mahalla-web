import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';
import Icon from '../ui/Icon';
import { initials } from '../chat/chatUtils';

const nav = [
  { to: '/hokim/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/hokim/chats',     icon: 'report',    label: 'Hisobotlar' },
  { to: '/hokim/emergency', icon: 'alert',     label: "Vaziyat bo'limi" },
  { to: '/hokim/analytics', icon: 'chart',     label: 'Tahlil' },
  { to: '/hokim/map',       icon: 'map',       label: 'Xarita' },
];

export default function HokimLayout() {
  const { user, logout }       = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar — har ikkala temada to'q ko'k (davlat uslubi) */}
      <aside className="w-64 bg-gradient-to-b from-primary-700 via-primary-800 to-[#071633] flex flex-col flex-shrink-0 border-r border-white/5">

        {/* Logo */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-[1.5px] shadow-lg shadow-gold-500/15">
              <div className="w-full h-full rounded-[0.65rem] bg-primary-800 flex items-center justify-center">
                <Icon name="landmark" className="w-5 h-5 text-gold-400" strokeWidth={1.8} />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Mahalla Tizimi</div>
              <div className="text-[11px] text-gold-400/90 font-medium tracking-wide">HOKIM PANELI</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-white/[0.07]">
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-gray-950 text-xs font-bold flex-shrink-0">
              {initials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.full_name}</div>
              <div className="text-[11px] text-white/50">Boysun tumani hokimi</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-white/30 tracking-[0.15em] uppercase px-4 pt-1 pb-2">
            Asosiy menyu
          </div>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-gray-950 shadow-lg shadow-gold-500/20 font-semibold'
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

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
