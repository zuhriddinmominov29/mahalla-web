import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const ROLES = { hokim: '🏛️ Hokim', uyushma: '🤝 Uyushma', rais: '👤 Rais' };

export default function AdminUsersPage() {
  const [users,     setUsers]     = useState([]);
  const [mahallas,  setMahallas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [pwdUser,   setPwdUser]   = useState(null);
  const [newPwd,    setNewPwd]    = useState('');
  const [search,    setSearch]    = useState('');
  const [form, setForm] = useState({ full_name:'', username:'', password:'12345', role:'rais', mahalla_id:'', phone:'' });

  const load = async () => {
    setLoading(true);
    const [u, m] = await Promise.all([api.get('/users'), api.get('/mahallas')]);
    if (u.success) setUsers(u.data);
    if (m.success) setMahallas(m.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  async function addUser(e) {
    e.preventDefault();
    if (!form.full_name || !form.username) return toast.error('Majburiy maydonlarni to\'ldiring');
    const res = await api.post('/users', form);
    if (res.success) { toast.success('Foydalanuvchi qo\'shildi!'); setShowAdd(false); setForm({ full_name:'', username:'', password:'12345', role:'rais', mahalla_id:'', phone:'' }); load(); }
    else toast.error(res.message);
  }

  async function saveEdit(e) {
    e.preventDefault();
    const res = await api.put(`/users/${editUser.id}`, { full_name: editUser.full_name, username: editUser.username, mahalla_id: editUser.mahalla_id, phone: editUser.phone });
    if (res.success) { toast.success('Saqlandi!'); setEditUser(null); load(); }
    else toast.error(res.message);
  }

  async function changePwd(e) {
    e.preventDefault();
    if (!newPwd || newPwd.length < 4) return toast.error('Parol kamida 4 belgi');
    const res = await api.put(`/users/${pwdUser.id}/password`, { new_password: newPwd });
    if (res.success) { toast.success('Parol o\'zgartirildi!'); setPwdUser(null); setNewPwd(''); }
    else toast.error(res.message);
  }

  async function deactivate(id) {
    if (!confirm('O\'chirmoqchimisiz?')) return;
    await api.delete(`/users/${id}`);
    toast.success("O'chirildi");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">👥 Foydalanuvchilar</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          ➕ Yangi qo'shish
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Ism yoki login bo'yicha qidirish..."
        className="input max-w-sm" />

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Ism Familiya</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Mahalla</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Yuklanmoqda...</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-200 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded-lg">{ROLES[u.role] || u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.mahallas?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditUser({...u})}
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg text-gray-300 transition-all">
                        ✏️ Tahrir
                      </button>
                      <button onClick={() => setPwdUser(u)}
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg text-gray-300 transition-all">
                        🔑 Parol
                      </button>
                      <button onClick={() => deactivate(u.id)}
                        className="text-xs bg-red-950/30 hover:bg-red-950/60 px-2.5 py-1.5 rounded-lg text-red-400 transition-all">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4">➕ Yangi foydalanuvchi</h3>
            <form onSubmit={addUser} className="space-y-3">
              <input placeholder="Ism Familiya *" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input" required />
              <input placeholder="Login (username) *" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="input" required />
              <input placeholder="Parol (default: 12345)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" />
              <input placeholder="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
                <option value="rais">Rais</option>
                <option value="uyushma">Uyushma Rahbari</option>
                <option value="hokim">Hokim</option>
              </select>
              {form.role === 'rais' && (
                <select value={form.mahalla_id} onChange={e => setForm({...form, mahalla_id: e.target.value})} className="input">
                  <option value="">Mahallani tanlang</option>
                  {mahallas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Bekor</button>
                <button type="submit" className="btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4">✏️ Tahrirlash</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <input placeholder="Ism Familiya" value={editUser.full_name} onChange={e => setEditUser({...editUser, full_name: e.target.value})} className="input" />
              <input placeholder="Login" value={editUser.username} onChange={e => setEditUser({...editUser, username: e.target.value})} className="input" />
              <input placeholder="Telefon" value={editUser.phone || ''} onChange={e => setEditUser({...editUser, phone: e.target.value})} className="input" />
              {editUser.role === 'rais' && (
                <select value={editUser.mahalla_id || ''} onChange={e => setEditUser({...editUser, mahalla_id: e.target.value})} className="input">
                  <option value="">Mahallani tanlang</option>
                  {mahallas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Bekor</button>
                <button type="submit" className="btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {pwdUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPwdUser(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-1">🔑 Parol o'zgartirish</h3>
            <p className="text-sm text-gray-400 mb-4">{pwdUser.full_name}</p>
            <form onSubmit={changePwd} className="space-y-3">
              <input type="password" placeholder="Yangi parol (kamida 4 belgi)" value={newPwd}
                onChange={e => setNewPwd(e.target.value)} className="input" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setPwdUser(null)} className="btn-secondary flex-1">Bekor</button>
                <button type="submit" className="btn-primary flex-1">O'zgartirish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
