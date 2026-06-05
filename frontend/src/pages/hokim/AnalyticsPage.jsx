import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../lib/api';

export default function HokimAnalyticsPage() {
  const [weekly,   setWeekly]   = useState([]);
  const [subs,     setSubs]     = useState([]);
  const [monthly,  setMonthly]  = useState([]);
  const [meta,     setMeta]     = useState(null);
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('bugun'); // bugun | oylik

  useEffect(() => {
    Promise.all([
      api.get('/analytics/weekly'),
      api.get(`/analytics/submissions?date=${date}`),
      api.get('/analytics/monthly'),
    ]).then(([w, s, m]) => {
      if (w.success) setWeekly(w.data);
      if (s.success) setSubs(s.data);
      if (m.success) { setMonthly(m.data); setMeta(m.meta); }
    }).finally(() => setLoading(false));
  }, [date]);

  const submitted    = subs.filter(s => s.submitted).length;
  const notSubmitted = subs.filter(s => !s.submitted).length;

  const totalVaziyat = monthly.reduce((sum, r) => sum + r.monthly_vaziyat, 0);
  const todayCount   = meta?.today_count ?? 0;
  const totalRaislar = meta?.total_raislar ?? 0;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-5">
      <h1 className="text-xl font-bold text-white">📈 Tahlil va Statistika</h1>

      {/* Yuqori kartalar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-green-400">{todayCount}</div>
          <div className="text-xs text-gray-400 mt-1">Bugun hisobot berdi</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-red-400">{totalRaislar - todayCount}</div>
          <div className="text-xs text-gray-400 mt-1">Bugun bermadi</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-orange-400">{totalVaziyat}</div>
          <div className="text-xs text-gray-400 mt-1">Oylik vaziyat xabari</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-primary-400">{totalRaislar}</div>
          <div className="text-xs text-gray-400 mt-1">Jami raislar</div>
        </div>
      </div>

      {/* Haftalik grafik */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Haftalik hisobotlar</h3>
        <ResponsiveContainer width="100%" height={180}>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        <button
          onClick={() => setTab('bugun')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2
            ${tab === 'bugun'
              ? 'text-white border-primary-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          Bugungi holat
        </button>
        <button
          onClick={() => setTab('oylik')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2
            ${tab === 'oylik'
              ? 'text-white border-primary-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          {meta?.month || 'Oylik'} statistika
        </button>
      </div>

      {/* Bugungi tab */}
      {tab === 'bugun' && (
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
      )}

      {/* Oylik tab */}
      {tab === 'oylik' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Raislar bo'yicha oylik</h3>
            {meta && (
              <span className="text-xs text-gray-500">
                {meta.days_passed} kun o'tdi / {meta.days_in_month} kun
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 pr-3 font-medium">Rais / Mahalla</th>
                    <th className="text-center py-2 px-2 font-medium">Bugun</th>
                    <th className="text-center py-2 px-2 font-medium">
                      Oylik<br/>hisobot
                    </th>
                    <th className="text-center py-2 pl-2 font-medium">
                      Vaziyat<br/>xabari
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {monthly.map(r => (
                    <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="text-gray-200 text-xs leading-tight">{r.full_name}</div>
                        <div className="text-gray-600 text-xs">{r.mahalla_name}</div>
                      </td>
                      <td className="text-center py-2.5 px-2">
                        <span className={`text-base ${r.today_submitted ? 'text-green-400' : 'text-red-500'}`}>
                          {r.today_submitted ? '✅' : '❌'}
                        </span>
                      </td>
                      <td className="text-center py-2.5 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-lg text-xs font-bold
                          ${r.monthly_reports >= meta?.days_passed
                            ? 'bg-green-900/40 text-green-400'
                            : r.monthly_reports > 0
                            ? 'bg-yellow-900/40 text-yellow-400'
                            : 'bg-red-900/40 text-red-400'}`}>
                          {r.monthly_reports}
                        </span>
                      </td>
                      <td className="text-center py-2.5 pl-2">
                        {r.monthly_vaziyat > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-6 rounded-lg text-xs font-bold bg-orange-900/40 text-orange-400">
                            {r.monthly_vaziyat}
                          </span>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
