import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const RC = { SUPER_ADMIN:'from-purple-600 to-purple-800', HOKIM:'from-blue-600 to-blue-800', DEPUTY:'from-indigo-600 to-indigo-800', RAIS:'from-green-600 to-green-800' };
const RL = { SUPER_ADMIN:'Super Admin', HOKIM:'Hokim', DEPUTY:"O'rinbosar", RAIS:'Mahalla Raisi' };

const Profile = () => {
  const { user, logout } = useAuth();
  const [pw, setPw] = useState({ current:'', new:'', confirm:'' });
  const [loading, setLoading] = useState(false);

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) return toast.error('Yangi parollar mos kelmaydi!');
    setLoading(true);
    try { await authAPI.changePassword({ currentPassword: pw.current, newPassword: pw.new }); toast.success("Parol o'zgartirildi ✅"); setPw({ current:'', new:'', confirm:'' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">👤 Profil</h1>

      <div className={`bg-gradient-to-r ${RC[user?.role]||'from-blue-600 to-blue-800'} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">{user?.name?.[0]?.toUpperCase()}</div>
          <div><h2 className="text-xl font-bold">{user?.name}</h2><p className="text-white/70 text-sm">{RL[user?.role]}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Email</p><p className="font-medium text-sm truncate">{user?.email}</p></div>
          {user?.mahalla && <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Mahalla</p><p className="font-medium text-sm">📍 {user.mahalla}</p></div>}
          {user?.district && <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Tuman</p><p className="font-medium text-sm">{user.district}</p></div>}
          {user?.deputyField && <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-xs">Soha</p><p className="font-medium text-sm truncate">{user.deputyField}</p></div>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">🔒 Parolni o'zgartirish</h2>
        <form onSubmit={handleChangePw} className="space-y-3">
          <div><label className="label">Joriy parol</label><input type="password" className="input" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} required /></div>
          <div><label className="label">Yangi parol</label><input type="password" className="input" value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} minLength={6} required /></div>
          <div>
            <label className="label">Tasdiqlang</label>
            <input type="password" className={`input ${pw.confirm && pw.new !== pw.confirm ? 'border-red-300 focus:ring-red-400' : ''}`} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
            {pw.confirm && pw.new !== pw.confirm && <p className="text-xs text-red-500 mt-1">Mos kelmaydi</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? '⏳ Saqlanmoqda...' : "🔒 Parolni o'zgartirish"}
          </button>
        </form>
      </div>

      <button onClick={logout} className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2">
        🚪 Tizimdan chiqish
      </button>
    </div>
  );
};

export default Profile;
