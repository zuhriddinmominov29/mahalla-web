import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO = [
  { label: 'Super Admin', email: 'admin@mahalla.uz',  password: 'Admin@123456', c: 'purple' },
  { label: 'Hokim',       email: 'hokim@boysun.uz',   password: 'Hokim@2026',   c: 'blue' },
  { label: 'Rais',        email: 'rais1@mahalla.uz',  password: 'Rais@1',       c: 'green' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Xush kelibsiz, ${data.user.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kirish muvaffaqiyatsiz!');
    } finally { setLoading(false); }
  };

  const colorMap = { purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100', blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100', indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100', green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <span className="text-5xl">🇺🇿</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Mahalla Nazorat</h1>
          <p className="text-blue-200 text-sm mt-1">O'zbekiston Respublikasi</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Tizimga kirish</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">📧 Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mahalla.uz" required />
            </div>
            <div>
              <label className="label">🔒 Parol</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-12" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-200/50 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Tekshirilmoqda...</> : '🚀 Kirish'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium">Demo hisoblar:</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map(acc => (
                <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className={`text-xs py-2 px-3 rounded-lg border font-medium transition-all hover:scale-105 ${colorMap[acc.c]}`}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-blue-300/40 text-xs mt-6">© 2026 Mahalla Nazorat • O'zbekiston 🇺🇿</p>
      </div>
    </div>
  );
};

export default Login;
