import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function HokimDashboard() {
  const [overview, setOverview] = useState(null);
  const [subs,     setSubs]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/submissions'),
    ]).then(([ov, sub]) => {
      if (ov.success)  setOverview(ov.data);
      if (sub.success) setSubs(sub.data);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const submitted    = subs.filter(s => s.submitted);
  const notSubmitted = subs.filter(s => !s.submitted);
  const pct = overview ? Math.round((overview.today_submitted / overview.total_raislar) * 100) : 0;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jami raislar',    value: overview?.total_raislar   || 39, icon: '👥', color: 'text-blue-400'   },
          { label: 'Bugun topshirdi', value: overview?.today_submitted  || 0,  icon: '✅', color: 'text-green-400'  },
          { label: 'Topshirmadi',     value: overview?.today_not_submitted||0, icon: '❌', color: 'text-red-400'    },
          { label: 'Aktiv vaziyat',   value: overview?.active_emergencies||0,  icon: '🚨', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-3xl">{s.icon}</div>
            <div>
              <div className={`text-3xl font-bold ${s.color}`}>
                {loading ? '…' : s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Bugungi hisobotlar</h3>
          <span className="text-sm text-gray-400">
            {loading ? '…' : `${overview?.today_submitted || 0} / ${overview?.total_raislar || 39}`}
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1.5">{pct}% raislar bugun hisobot topshirdi</div>
      </div>

      {/* Raislar holati */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Topshirganlar */}
        <div className="card">
          <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
            ✅ <span>Topshirganlar ({submitted.length})</span>
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {submitted.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-2 px-3 rounded-xl bg-green-950/20 border border-green-900/30">
                <span className="text-green-400 text-xs">✓</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 truncate">{r.full_name}</div>
                  <div className="text-gray-500 text-xs">{r.mahalla_name}</div>
                </div>
                <span className="text-xs text-gray-500">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
            {submitted.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Hali yo'q</p>}
          </div>
        </div>

        {/* Topshirmaganlar */}
        <div className="card">
          <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            ❌ <span>Topshirmaganlar ({notSubmitted.length})</span>
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {notSubmitted.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-2 px-3 rounded-xl bg-red-950/20 border border-red-900/30">
                <span className="text-red-400 text-xs">✗</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 truncate">{r.full_name}</div>
                  <div className="text-gray-500 text-xs">{r.mahalla_name}</div>
                </div>
              </div>
            ))}
            {notSubmitted.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Hammasi topshirdi! 🎉</p>}
          </div>
        </div>
      </div>

      {/* Tezkor havolalar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/hokim/chats',     icon: '💬', label: 'Barcha xabarlar' },
          { to: '/hokim/emergency', icon: '🚨', label: 'Favqulodda' },
          { to: '/hokim/analytics', icon: '📈', label: 'Tahlil' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className="card flex flex-col items-center gap-2 py-5 hover:border-primary-600/50 hover:bg-primary-600/5 transition-all cursor-pointer text-center">
            <span className="text-3xl">{l.icon}</span>
            <span className="text-sm font-medium text-gray-300">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
