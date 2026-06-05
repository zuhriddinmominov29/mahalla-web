import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';

const TYPES = {
  yomgir:  { icon: '🌧️', label: "Yomg'ir",        color: 'bg-blue-900/40 border-blue-700/50'   },
  shamol:  { icon: '💨', label: 'Shamol/Bo\'ron', color: 'bg-gray-800/60 border-gray-600/50'    },
  elektr:  { icon: '⚡', label: 'Elektr o\'ch',  color: 'bg-yellow-900/40 border-yellow-700/50' },
  sel:     { icon: '🌊', label: 'Sel',            color: 'bg-cyan-900/40 border-cyan-700/50'    },
  talofat: { icon: '🏚️', label: 'Talofat',        color: 'bg-orange-900/40 border-orange-700/50'},
  yongir:  { icon: '🔥', label: "Yong'in",        color: 'bg-red-900/40 border-red-700/50'     },
};

const SEV_COLOR = { low:'bg-green-600', medium:'bg-yellow-600', high:'bg-orange-600', critical:'bg-red-600' };
const SEV_LBL   = { low:'Past', medium:"O'rta", high:'Yuqori', critical:'Kritik' };

export default function HokimEmergencyPage() {
  const { user }    = useAuthStore();
  const navigate    = useNavigate();
  const [mahallas,  setMahallas]  = useState([]);
  const [list,      setList]      = useState([]);
  const [filter,    setFilter]    = useState('active');
  const [loading,   setLoading]   = useState(true);
  // mahalla_id → rais user_id map (chatga o'tish uchun)
  const [mahallaSenders, setMahallaSenders] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [byM, allE, usersRes] = await Promise.all([
        api.get('/emergency/by-mahalla'),
        api.get(`/emergency?status=${filter}`),
        api.get('/users?role=rais'),
      ]);
      if (byM.success)  setMahallas(byM.data);
      if (allE.success) setList(allE.data);
      // mahalla_id → user_id xarita
      if (usersRes.success) {
        const map = {};
        (usersRes.data || []).forEach(u => {
          if (u.mahalla_id) map[u.mahalla_id] = u.id;
        });
        setMahallaSenders(map);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const ch = supabase.channel('em-hokim')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies',
        filter: `district_id=eq.${user.district_id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user.district_id]);

  async function resolve(id) {
    await api.patch(`/emergency/${id}/resolve`);
    toast.success('Hal qilindi deb belgilandi');
    load();
  }

  function goToChat(mahalla) {
    const userId = mahallaSenders[mahalla.id];
    if (userId) {
      navigate(`/hokim/chat/${userId}`);
    } else {
      toast.error(`${mahalla.name} mahallasida rais topilmadi`);
    }
  }

  const activeCount = mahallas.filter(m => m.has_emergency).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">🚨 Favqulodda Vaziyatlar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {mahallas.length} ta mahalla real-vaqt monitoringi · mahalla ustiga bossangiz chat ochiladi
          </p>
        </div>
        {activeCount > 0 && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-xl px-4 py-2 text-red-400 text-sm font-semibold animate-pulse">
            ⚠️ {activeCount} ta mahallada aktiv vaziyat
          </div>
        )}
      </div>

      {/* Mahallalar grid — bosilganda chatga o'tadi */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Mahallalar holati <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
            (bosish → chatga o'tish)
          </span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {mahallas.map(m => (
            <button
              key={m.id}
              onClick={() => goToChat(m)}
              title={`${m.name} — chatga o'tish`}
              className={`rounded-xl border p-2.5 text-xs text-left transition-all hover:scale-105 hover:shadow-lg cursor-pointer
                ${m.has_emergency
                  ? 'bg-red-900/30 border-red-700/50 animate-pulse hover:bg-red-900/50'
                  : 'border-gray-700/50 hover:border-primary-500/50'}`}
              style={!m.has_emergency ? { background: 'var(--bg-input)' } : {}}>
              <div className="font-medium truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                {m.name}
              </div>
              {m.has_emergency ? (
                <div className="flex flex-wrap gap-1">
                  {m.emergencies.flatMap(e => e.types || []).map((t, i) => (
                    <span key={i} title={TYPES[t]?.label}>{TYPES[t]?.icon || '⚠️'}</span>
                  ))}
                </div>
              ) : (
                <span className="text-green-500 text-xs">✓ Xavfsiz</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter + List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Xabarlar ro'yxati</h3>
          <div className="flex gap-2">
            {['active','resolved','all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                  ${filter === f ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-700 hover:border-gray-600'}`}
                style={filter !== f ? { color: 'var(--text-muted)' } : {}}>
                {f === 'active' ? '🔴 Faol' : f === 'resolved' ? '🟢 Hal qilingan' : '📋 Hammasi'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">✅</span>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Faol vaziyat yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(e => (
              <div key={e.id} className={`rounded-xl border p-4
                ${e.status === 'active' ? 'border-red-800/50 bg-red-950/10' : 'border-gray-700/50'}`}
                style={e.status !== 'active' ? { background: 'var(--bg-input)' } : {}}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Mahalla nomi — chatga o'tish */}
                      <button
                        onClick={() => goToChat({ id: e.mahalla_id, name: e.mahallas?.name })}
                        className="font-semibold text-sm hover:text-primary-400 transition-colors flex items-center gap-1"
                        style={{ color: 'var(--text-primary)' }}>
                        📍 {e.mahallas?.name} MFY
                        <span className="text-xs text-primary-400 opacity-0 group-hover:opacity-100">→ chat</span>
                      </button>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${SEV_COLOR[e.severity]}`}>
                        {SEV_LBL[e.severity]}
                      </span>
                      {e.casualties > 0 && (
                        <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
                          👤 {e.casualties} jabrlanuvchi
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {(e.types || []).map(t => (
                        <span key={t} className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${TYPES[t]?.color || 'bg-gray-800 border-gray-700'}`}>
                          {TYPES[t]?.icon} {TYPES[t]?.label}
                        </span>
                      ))}
                    </div>
                    {e.description && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>
                    )}
                    <div className="text-xs mt-2 flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                      <span>👤 {e.reporter?.full_name}</span>
                      <span>🕐 {new Date(e.created_at).toLocaleString('uz-UZ')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => goToChat({ id: e.mahalla_id, name: e.mahallas?.name })}
                      className="btn-secondary text-xs px-3 py-2">
                      💬 Chat
                    </button>
                    {e.status === 'active' && (
                      <button onClick={() => resolve(e.id)}
                        className="btn-secondary text-xs px-3 py-2">
                        ✅ Hal qilindi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
