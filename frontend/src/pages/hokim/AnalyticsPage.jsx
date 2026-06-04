import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../lib/api';

export default function HokimAnalyticsPage() {
  const [weekly,   setWeekly]   = useState([]);
  const [subs,     setSubs]     = useState([]);
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/weekly'),
      api.get(`/analytics/submissions?date=${date}`),
    ]).then(([w, s]) => {
      if (w.success) setWeekly(w.data);
      if (s.success) setSubs(s.data);
    }).finally(() => setLoading(false));
  }, [date]);

  const submitted    = subs.filter(s => s.submitted).length;
  const notSubmitted = subs.filter(s => !s.submitted).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">📈 Tahlil va Statistika</h1>

      {/* Haftalik grafik */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Haftalik hisobotlar</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekly}>
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px' }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {weekly.map((_, i) => (
                <Cell key={i} fill={i === weekly.length - 1 ? '#1E3A6E' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Kun bo'yicha filter */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-white">Kun bo'yicha hisobot</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-400">✅ {submitted}</span>
            <span className="text-sm text-red-400">❌ {notSubmitted}</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="input py-2 text-sm w-40" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subs.map(r => (
              <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm
                ${r.submitted ? 'border-green-800/40 bg-green-950/10' : 'border-red-800/40 bg-red-950/10'}`}>
                <span className={r.submitted ? 'text-green-400' : 'text-red-400'}>
                  {r.submitted ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 text-xs truncate">{r.full_name}</div>
                  <div className="text-gray-500 text-xs">{r.mahalla_name}</div>
                </div>
                {r.submitted_at && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(r.submitted_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
