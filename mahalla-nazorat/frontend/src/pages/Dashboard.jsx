import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <div onClick={onClick} className={`card hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
      {sub !== undefined && <span className="text-xs text-gray-400 font-medium">{sub}%</span>}
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value ?? '—'}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

const Dashboard = () => {
  const { user, isRais, isHokim, isSuperAdmin, unreadCount, setUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [raisPerf, setRaisPerf] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const notifRes = await analyticsAPI.notifications();
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(notifRes.data.unreadCount || 0);

      if (!isRais()) {
        const [ovRes, catRes, mRes] = await Promise.all([analyticsAPI.overview(), analyticsAPI.byCategory(), analyticsAPI.byMonth(new Date().getFullYear())]);
        setOverview(ovRes.data);
        setCategoryData(catRes.data);
        setMonthlyData(mRes.data);
        if (isHokim() || isSuperAdmin()) {
          const perfRes = await analyticsAPI.raisPerformance();
          setRaisPerf(perfRes.data.slice(0, 5));
        }
      }
    } catch { toast.error("Ma'lumotlar yuklanmadi"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('tasks:refresh', handler);
    window.addEventListener('reports:refresh', handler);
    return () => { window.removeEventListener('tasks:refresh', handler); window.removeEventListener('reports:refresh', handler); };
  }, [loadData]);

  const handleReadAll = async () => {
    try { await analyticsAPI.readAllNotifications(); setUnreadCount(0); setNotifications(p => p.map(n => ({ ...n, isRead: true }))); }
    catch {}
  };

  const pieData = overview
    ? [
        { name: 'Bajarilgan', value: overview.tasks.completed, color: '#10b981' },
        { name: 'Jarayonda',  value: overview.tasks.inProgress, color: '#3b82f6' },
        { name: 'Kutilmoqda', value: overview.tasks.pending,   color: '#f59e0b' },
        { name: "Muddati o'tgan", value: overview.tasks.overdue, color: '#ef4444' },
      ].filter(d => d.value > 0)
    : [];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" /></div>;

  // ─── RAIS ────────────────────────────────────────────────────────────────
  if (isRais()) return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Xush kelibsiz, {user?.name}! 👋</h1>
        <p className="text-green-100 text-sm mt-1">📍 {user?.mahalla} • {user?.district}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('/tasks')} className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer text-center py-8">
          <div className="text-4xl mb-2">📋</div><div className="font-semibold">Topshiriqlar</div><div className="text-xs text-gray-400 mt-1">Ko'rish va bajarish</div>
        </button>
        <button onClick={() => navigate('/reports')} className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer text-center py-8">
          <div className="text-4xl mb-2">📝</div><div className="font-semibold">Hisobot yuborish</div><div className="text-xs text-gray-400 mt-1">Yangi hisobot</div>
        </button>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">🔔 Xabarnomalar</h2>
          {unreadCount > 0 && <button onClick={handleReadAll} className="text-xs text-blue-600 hover:underline">Barchasini o'qi</button>}
        </div>
        {notifications.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">Xabarnoma yo'q</p> : (
          <div className="space-y-2">
            {notifications.slice(0, 8).map(n => (
              <div key={n.id} className={`p-3 rounded-xl border text-sm ${!n.isRead ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="font-medium text-gray-900">{n.title}</div>
                <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bosh Panel 📊</h1>
          <p className="text-blue-200 text-sm mt-1">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right"><div className="text-4xl font-bold">{overview?.tasks?.completionRate ?? 0}%</div><div className="text-blue-200 text-xs">Bajarilish darajasi</div></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Jami topshiriqlar" value={overview?.tasks?.total} color="bg-blue-100" onClick={() => navigate('/tasks')} />
        <StatCard icon="✅" label="Bajarilgan" value={overview?.tasks?.completed} sub={overview?.tasks?.completionRate} color="bg-green-100" />
        <StatCard icon="⏳" label="Jarayonda" value={overview?.tasks?.inProgress} color="bg-yellow-100" />
        <StatCard icon="🚨" label="Muddati o'tgan" value={overview?.tasks?.overdue} color="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📊 Topshiriqlar holati</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} ta`, 'Soni']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Ma'lumot yo'q</div>}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📈 Oylik statistika ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData.slice(0, 12)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" name="Bajarilgan" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="overdue" name="Muddati o'tgan" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">🏷️ Kategoriyalar bo'yicha</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" name="Bajarilgan" fill="#10b981" stackId="a" />
              <Bar dataKey="pending"   name="Kutilmoqda" fill="#f59e0b" stackId="a" />
              <Bar dataKey="overdue"   name="Muddati o'tgan" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {raisPerf.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">🏆 Eng faol Raislar</h3>
            <div className="space-y-3">
              {raisPerf.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white ${i===0?'bg-yellow-500':i===1?'bg-gray-400':i===2?'bg-orange-500':'bg-blue-400'}`}>{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.mahalla}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{r.completionRate}%</p>
                    <p className="text-xs text-gray-400">{r.completedTasks}/{r.totalTasks}</p>
                  </div>
                  <div className="w-14"><div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${r.completionRate}%` }} /></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">🔔 Xabarnomalar</h3>
            {unreadCount > 0 && <button onClick={handleReadAll} className="text-xs text-blue-600 hover:underline">O'qi ({unreadCount})</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm"><div className="text-4xl mb-2">🔕</div>Xabarnoma yo'q</div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 6).map(n => (
                <div key={n.id} className={`p-3 rounded-xl text-sm border ${!n.isRead ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex gap-2">
                    <span>{n.type==='success'?'✅':n.type==='error'?'❌':'ℹ️'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
