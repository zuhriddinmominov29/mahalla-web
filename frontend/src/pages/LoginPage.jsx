import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import Icon from '../components/ui/Icon';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim())
      return toast.error('Login va parol kiriting');

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      toast.success('Xush kelibsiz!');
      navigate('/');
    } else {
      toast.error(res.message || 'Login yoki parol noto\'g\'ri');
    }
  }

  const inputClass = `w-full rounded-xl pl-11 pr-4 py-3 text-sm
    bg-white/[0.06] border border-white/10 text-white placeholder-white/30
    focus:outline-none focus:border-gold-400/60 focus:bg-white/[0.09]
    focus:ring-4 focus:ring-gold-500/10 transition-all duration-200`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 flex items-center justify-center p-4">
      {/* Dekorativ fon */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-gray-950 to-primary-900" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-sm fade-up">
        {/* Gerb / Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-[1.4rem] bg-gradient-to-br from-gold-400 to-gold-600 p-[2px] shadow-2xl shadow-gold-500/20">
            <div className="w-full h-full rounded-[1.3rem] bg-primary-700 flex items-center justify-center">
              <Icon name="landmark" className="w-9 h-9 text-gold-400" strokeWidth={1.8} />
            </div>
          </div>
          <h1 className="text-[1.7rem] font-bold text-white tracking-tight">Mahalla Tizimi</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/60" />
            <p className="text-gold-400/90 text-xs font-medium tracking-[0.2em] uppercase">Boysun tumani</p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/60" />
          </div>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-6">Tizimga kirish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
                Login
              </label>
              <div className="relative">
                <Icon name="user" className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputClass}
                  placeholder="Loginni kiriting"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
                Parol
              </label>
              <div className="relative">
                <Icon name="lock" className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={`${inputClass} pr-12`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  <Icon name={showPass ? 'eyeOff' : 'eye'} className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-gray-950
                bg-gradient-to-r from-gold-400 to-gold-500
                hover:from-gold-400 hover:to-gold-400
                shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Kirilmoqda...
                </>
              ) : (
                <>
                  Kirish
                  <Icon name="arrowRight" className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          © 2026 Boysun tumani mahalla tizimi
        </p>
      </div>
    </div>
  );
}
