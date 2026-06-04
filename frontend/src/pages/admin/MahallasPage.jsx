import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function AdminMahallasPage() {
  const [mahallas, setMahallas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newName,  setNewName]  = useState('');
  const [editM,    setEditM]    = useState(null);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/mahallas');
    if (r.success) setMahallas(r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function addMahalla(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const r = await api.post('/mahallas', { name: newName.trim() });
    if (r.success) { toast.success("Mahalla qo'shildi!"); setNewName(''); load(); }
    else toast.error(r.message);
  }

  async function saveEdit(e) {
    e.preventDefault();
    const r = await api.put(`/mahallas/${editM.id}`, { name: editM.name });
    if (r.success) { toast.success('Saqlandi!'); setEditM(null); load(); }
    else toast.error(r.message);
  }

  async function deactivate(id) {
    if (!confirm('Mahallani o\'chirmoqchimisiz?')) return;
    await api.delete(`/mahallas/${id}`);
    toast.success("O'chirildi");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">🏘️ Mahallalar ({mahallas.length} ta)</h1>

      {/* Add */}
      <form onSubmit={addMahalla} className="flex gap-3 max-w-md">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="Yangi mahalla nomi" className="input flex-1" />
        <button type="submit" className="btn-primary px-5">➕ Qo'shish</button>
      </form>

      {/* List */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Mahalla nomi</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Yuklanmoqda...</td></tr>
              ) : mahallas.map((m, i) => (
                <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{m.order_num || i + 1}</td>
                  <td className="px-4 py-3 text-gray-200 font-medium">{m.name} MFY</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${m.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {m.is_active ? '✓ Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditM({...m})}
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg text-gray-300 transition-all">
                        ✏️ Tahrir
                      </button>
                      <button onClick={() => deactivate(m.id)}
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

      {/* Edit Modal */}
      {editM && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditM(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4">✏️ Mahalla nomini tahrirlash</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <input value={editM.name} onChange={e => setEditM({...editM, name: e.target.value})}
                className="input" placeholder="Mahalla nomi" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditM(null)} className="btn-secondary flex-1">Bekor</button>
                <button type="submit" className="btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
