import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_L = { SUPER_ADMIN:'Super Admin', HOKIM:'Hokim', DEPUTY:"O'rinbosar", RAIS:'Rais' };
const ROLE_C = { SUPER_ADMIN:'bg-purple-100 text-purple-700', HOKIM:'bg-blue-100 text-blue-700', DEPUTY:'bg-indigo-100 text-indigo-700', RAIS:'bg-green-100 text-green-700' };
const FIELDS = ["Ijtimoiy","Iqtisodiy","Kommunal","Ta'lim va sog'liqni saqlash"];

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${active?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{label}</button>
);

const UserForm = ({ user: eu, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name:eu?.name||'', email:eu?.email||'', password:'', role:eu?.role||'RAIS', phone:eu?.phone||'', district:eu?.district||'', mahalla:eu?.mahalla||'', deputyField:eu?.deputyField||'', isActive:eu?.isActive!==false });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (eu) await adminAPI.updateUser(eu.id, form); else await adminAPI.createUser(form);
      toast.success(eu ? 'Yangilandi ✅' : 'Yaratildi ✅');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Xato'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{eu ? '✏️ Tahrirlash' : '➕ Yangi foydalanuvchi'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div><label className="label">Ism *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          {!eu && <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required /></div>}
          <div><label className="label">{eu ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</label><input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} required={!eu} /></div>
          <div><label className="label">Rol *</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              {Object.entries(ROLE_L).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {form.role === 'DEPUTY' && (
            <div><label className="label">Soha *</label>
              <select className="input" value={form.deputyField} onChange={e => set('deputyField', e.target.value)}>
                <option value="">-- Tanlang --</option>
                {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tuman</label><input className="input" value={form.district} onChange={e => set('district', e.target.value)} /></div>
            {form.role === 'RAIS' && <div><label className="label">Mahalla</label><input className="input" value={form.mahalla} onChange={e => set('mahalla', e.target.value)} /></div>}
          </div>
          <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+998 90 123 45 67" /></div>
          {eu && <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm">Faol holat</span></label>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Bekor</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading?'⏳':'✅'} Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyConfig, setDailyConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selCats, setSelCats] = useState([]);
  const [newCat, setNewCat] = useState({ name:'', color:'#3B82F6' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ur, cr, dr] = await Promise.all([adminAPI.getUsers(), adminAPI.getCategories(), adminAPI.getDailyConfig()]);
      setUsers(ur.data); setCategories(cr.data); setDailyConfig(dr.data);
      setSelCats(dr.data.map(c => c.categoryId));
    } catch { toast.error('Yuklanmadi'); }
    finally { setLoading(false); }
  };

  const delUser = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await adminAPI.deleteUser(id); toast.success("O'chirildi"); setUsers(p => p.filter(u => u.id !== id)); }
    catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  const saveDailyConfig = async () => {
    const valid = selCats.filter(Boolean);
    if (!valid.length) return toast.error('Kamida 1 ta tanlang!');
    try { await adminAPI.saveDailyConfig({ categoryIds: valid }); toast.success('Saqlandi ✅'); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  const createCat = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    try { await adminAPI.createCategory(newCat); toast.success('Yaratildi ✅'); setNewCat({ name:'', color:'#3B82F6' }); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Xato'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">⚙️ Boshqaruv Paneli</h1>
      <div className="flex gap-2 flex-wrap">
        <Tab label="👥 Foydalanuvchilar" active={tab==='users'} onClick={() => setTab('users')} />
        <Tab label="🏷️ Kategoriyalar" active={tab==='cats'} onClick={() => setTab('cats')} />
        <Tab label="📅 Kunlik yo'nalish" active={tab==='daily'} onClick={() => setTab('daily')} />
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{users.length} ta foydalanuvchi</p>
            {isSuperAdmin() && <button onClick={() => { setEditUser(null); setShowForm(true); }} className="btn-primary">➕ Yangi</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold">{u.name?.[0]?.toUpperCase()}</div>
                    <div><p className="text-sm font-semibold">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${u.isActive?'bg-green-400':'bg-red-400'}`} />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_C[u.role]}`}>{ROLE_L[u.role]}</span>
                  {u.deputyField && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{u.deputyField}</span>}
                </div>
                {(u.district||u.mahalla) && <p className="text-xs text-gray-400 mb-2">📍 {[u.mahalla,u.district].filter(Boolean).join(', ')}</p>}
                {u._count && <p className="text-xs text-gray-400 mb-3">📋 {u._count.assignedTasks} • 📝 {u._count.reports}</p>}
                {isSuperAdmin() && (
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button onClick={() => { setEditUser(u); setShowForm(true); }} className="btn-secondary flex-1 justify-center text-xs py-1.5">✏️ Tahrir</button>
                    <button onClick={() => delUser(u.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs py-1.5 px-3 rounded-lg font-medium">🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cats' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">➕ Yangi kategoriya</h2>
            <form onSubmit={createCat} className="flex gap-3 flex-wrap">
              <input className="input flex-1 min-w-48" placeholder="Kategoriya nomi..." value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} required />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rang:</span>
                <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
              </div>
              <button type="submit" className="btn-primary">Yaratish</button>
            </form>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(c => (
              <div key={c.id} className="card flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="min-w-0"><p className="text-sm font-medium truncate">{c.name}</p><p className="text-xs text-gray-400">{c._count?.tasks||0} topshiriq</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'daily' && (
        <div className="card max-w-lg">
          <h2 className="font-bold text-gray-900 mb-1">📅 Kunlik yo'nalishlar</h2>
          <p className="text-sm text-gray-400 mb-5">Bugun Raislar uchun eng muhim 3 ta yo'nalishni belgilang.</p>
          <div className="space-y-3 mb-5">
            {[0,1,2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</span>
                <select className="input flex-1" value={selCats[i]||''} onChange={e => { const n=[...selCats]; n[i]=e.target.value; setSelCats(n); }}>
                  <option value="">-- Tanlang --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {selCats[i] && <button onClick={() => { const n=[...selCats]; n[i]=''; setSelCats(n); }} className="text-red-400 hover:text-red-600 text-lg">✕</button>}
              </div>
            ))}
          </div>
          <button onClick={saveDailyConfig} className="btn-primary w-full justify-center">💾 Saqlash</button>
          {dailyConfig.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-2">Bugungi yo'nalishlar:</p>
              <div className="flex flex-wrap gap-2">
                {dailyConfig.map(c => (
                  <span key={c.id} className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: c.category.color }}>{c.order}. {c.category.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && <UserForm user={editUser} onClose={() => { setShowForm(false); setEditUser(null); }} onSuccess={() => { setShowForm(false); setEditUser(null); loadAll(); }} />}
    </div>
  );
};

export default AdminPanel;
