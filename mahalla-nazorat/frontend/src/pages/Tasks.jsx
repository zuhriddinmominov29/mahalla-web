import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS = { PENDING: { l:'Kutilmoqda', b:'badge-pending', i:'⏳' }, IN_PROGRESS: { l:'Jarayonda', b:'badge-progress', i:'🔄' }, COMPLETED: { l:'Bajarildi', b:'badge-completed', i:'✅' }, OVERDUE: { l:"Muddati o'tdi", b:'badge-overdue', i:'🚨' }, CANCELLED: { l:'Bekor qilindi', b:'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium', i:'❌' } };
const PRIORITY = { LOW: { l:'Past', c:'text-gray-400' }, MEDIUM: { l:"O'rta", c:'text-blue-500' }, HIGH: { l:'Yuqori', c:'text-orange-500' }, URGENT: { l:'Shoshilinch', c:'text-red-600 font-bold' } };
const TYPE_BADGE = { PERMANENT: 'bg-indigo-100 text-indigo-700', ONE_TIME: 'bg-teal-100 text-teal-700' };

const TaskCard = ({ task, onClick }) => {
  const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000) : null;
  const si = STATUS[task.status] || STATUS.PENDING;
  return (
    <div onClick={() => onClick(task)} className="card hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">{task.title}</h3>
        <span className={si.b}>{si.i} {si.l}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[task.type]}`}>{task.type==='PERMANENT'?'Doimiy':'Bir martalik'}</span>
        {task.category && <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: task.category.color }}>{task.category.name}</span>}
        <span className={`text-xs ${PRIORITY[task.priority]?.c}`}>⚡ {PRIORITY[task.priority]?.l}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex gap-2">
          {task.assignedTo && <span>👤 {task.assignedTo.name?.split(' ')[0]}</span>}
          {task.mahalla && <span>📍 {task.mahalla}</span>}
        </div>
        <div className="flex gap-2">
          {task.reports?.length > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">📝 {task.reports.length}</span>}
          {daysLeft !== null && <span className={daysLeft < 0 ? 'text-red-500 font-medium' : daysLeft <= 3 ? 'text-orange-500' : ''}>{daysLeft < 0 ? `${Math.abs(daysLeft)} kun o'tdi` : `${daysLeft} kun`}</span>}
        </div>
      </div>
    </div>
  );
};

const TaskFormModal = ({ onClose, onSuccess, categories, users }) => {
  const [form, setForm] = useState({ title:'', description:'', type:'ONE_TIME', priority:'MEDIUM', categoryId:'', deadline:'', assignedToId:'', district:'', mahalla:'', deputyField:'' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) return toast.error('Sarlavha va kategoriya kiritilishi shart!');
    if (form.type === 'PERMANENT' && !form.deadline) return toast.error('Doimiy topshiriqda muddat majburiy!');
    setLoading(true);
    try { await tasksAPI.create(form); toast.success('Topshiriq yaratildi! ✅'); onSuccess(); }
    catch (err) { toast.error(err.response?.data?.errors?.[0]?.msg || 'Xato'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">➕ Yangi topshiriq</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">📌 Sarlavha *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div><label className="label">📝 Tavsif</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">🏷️ Tur *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="ONE_TIME">Bir martalik</option>
                <option value="PERMANENT">Doimiy</option>
              </select>
            </div>
            <div>
              <label className="label">⚡ Muhimlik</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="LOW">Past</option><option value="MEDIUM">O'rta</option><option value="HIGH">Yuqori</option><option value="URGENT">Shoshilinch</option>
              </select>
            </div>
          </div>
          {form.type === 'PERMANENT' && (
            <div><label className="label">📅 Muddat * <span className="text-red-500 font-normal">(Doimiy uchun)</span></label>
              <input type="date" className="input" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">📂 Kategoriya *</label>
            <select className="input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
              <option value="">-- Tanlang --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">👔 O'rinbosar soha</label>
            <select className="input" value={form.deputyField} onChange={e => set('deputyField', e.target.value)}>
              <option value="">-- Tanlang --</option>
              {["Ijtimoiy","Iqtisodiy","Kommunal","Ta'lim va sog'liqni saqlash"].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">📍 Tuman</label><input className="input" value={form.district} onChange={e => set('district', e.target.value)} placeholder="Toshkent" /></div>
            <div><label className="label">🏘️ Mahalla</label><input className="input" value={form.mahalla} onChange={e => set('mahalla', e.target.value)} placeholder="Yunusobod-1" /></div>
          </div>
          {users.length > 0 && (
            <div><label className="label">👤 Tayinlansin</label>
              <select className="input" value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)}>
                <option value="">-- Ixtiyoriy --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} – {u.mahalla || u.role}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Bekor</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? '⏳' : '✅'} Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tasks = () => {
  const { isHokim, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '', category: '' });
  const [search, setSearch] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks || []);
    } catch { toast.error('Topshiriqlar yuklanmadi'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    loadTasks();
    adminAPI.getCategories().then(r => setCategories(r.data)).catch(() => {});
    if (isHokim() || isSuperAdmin()) adminAPI.getUsers({ role: 'RAIS' }).then(r => setUsers(r.data)).catch(() => {});
  }, [loadTasks]);

  useEffect(() => {
    const h = () => loadTasks();
    window.addEventListener('tasks:refresh', h);
    return () => window.removeEventListener('tasks:refresh', h);
  }, [loadTasks]);

  const filtered = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.mahalla?.toLowerCase().includes(search.toLowerCase()));
  const sf = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">📋 Topshiriqlar</h1><p className="text-sm text-gray-400">{filtered.length} ta</p></div>
        {(isHokim() || isSuperAdmin()) && <button onClick={() => setShowForm(true)} className="btn-primary">➕ Yangi topshiriq</button>}
      </div>

      <div className="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <input className="input col-span-2 lg:col-span-1" placeholder="🔍 Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" value={filters.status} onChange={e => sf('status', e.target.value)}>
          <option value="">Barcha holatlar</option>
          <option value="PENDING">Kutilmoqda</option><option value="IN_PROGRESS">Jarayonda</option>
          <option value="COMPLETED">Bajarildi</option><option value="OVERDUE">Muddati o'tdi</option>
        </select>
        <select className="input" value={filters.type} onChange={e => sf('type', e.target.value)}>
          <option value="">Barcha turlar</option><option value="PERMANENT">Doimiy</option><option value="ONE_TIME">Bir martalik</option>
        </select>
        <select className="input" value={filters.category} onChange={e => sf('category', e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📭</div><p className="font-medium">Topshiriq topilmadi</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(task => <TaskCard key={task.id} task={task} onClick={t => navigate(`/tasks/${t.id}`)} />)}
        </div>
      )}

      {showForm && <TaskFormModal categories={categories} users={users} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); loadTasks(); }} />}
    </div>
  );
};

export default Tasks;
