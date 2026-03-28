import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import toast from 'react-hot-toast';

const RS = { SUBMITTED: { l:'Yuborildi', b:'badge-pending', i:'📤' }, REVIEWED: { l:"Ko'rildi", b:'badge-progress', i:'👀' }, APPROVED: { l:'Tasdiqlandi', b:'badge-approved', i:'✅' }, REJECTED: { l:'Rad etildi', b:'badge-rejected', i:'❌' } };

const Reports = () => {
  const { isRais } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await reportsAPI.getAll(filter ? { status: filter } : {}); setReports(data.reports || []); }
    catch { toast.error('Yuklanmadi'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('reports:refresh', h);
    return () => window.removeEventListener('reports:refresh', h);
  }, [load]);

  const withLoc = reports.filter(r => r.latitude && r.longitude);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">📝 Hisobotlar</h1><p className="text-sm text-gray-400">{reports.length} ta</p></div>
        {isRais() && <button onClick={() => navigate('/tasks')} className="btn-primary">➕ Yangi hisobot</button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter===s?'bg-blue-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s ? RS[s]?.l : 'Barchasi'}
          </button>
        ))}
      </div>

      {withLoc.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">🗺️ Hisobotlar xaritasi</h2>
          <MapView reports={withLoc} center={[withLoc[0].latitude, withLoc[0].longitude]} height="280px" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📭</div><p>Hisobot topilmadi</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const si = RS[r.status] || RS.SUBMITTED;
            return (
              <div key={r.id} className="card hover:shadow-md transition-all cursor-pointer" onClick={() => setSelected(r)}>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold">👤 {r.user?.name}</span>
                    {r.user?.mahalla && <span className="text-xs text-gray-400 ml-2">📍 {r.user.mahalla}</span>}
                    {r.task && <p className="text-xs text-blue-600 mt-0.5 hover:underline" onClick={e => { e.stopPropagation(); navigate(`/tasks/${r.task.id}`); }}>📋 {r.task.title}</p>}
                  </div>
                  <span className={si.b}>{si.i} {si.l}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{r.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
                  <div className="flex gap-3">
                    {r.latitude && <span className="text-blue-500">📍 {r.locationName || `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}`}</span>}
                    {r.images?.length > 0 && <span>📸 {r.images.length} ta</span>}
                  </div>
                  <span>{new Date(r.createdAt).toLocaleString('uz-UZ')}</span>
                </div>
                {r.images?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.images.slice(0, 4).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-14 h-14 object-cover rounded-lg hover:opacity-90" onClick={e => { e.stopPropagation(); setLightbox(img); }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">📝 Hisobot tafsiloti</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div><p className="text-xs text-gray-400">Topshiruvchi</p><p className="text-sm font-semibold">{selected.user?.name} • {selected.user?.mahalla}</p></div>
              {selected.task && <div><p className="text-xs text-gray-400">Topshiriq</p><p className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/tasks/${selected.task.id}`)}>{selected.task.title}</p></div>}
              <div><p className="text-xs text-gray-400">Hisobot</p><p className="text-sm text-gray-700">{selected.description}</p></div>
              {selected.latitude && (
                <div><p className="text-xs text-gray-400 mb-2">GPS Joylashuv</p>
                  <MapView reports={[selected]} center={[selected.latitude, selected.longitude]} zoom={15} height="200px" />
                </div>
              )}
              {selected.images?.length > 0 && (
                <div><p className="text-xs text-gray-400 mb-2">Rasmlar</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-full aspect-video object-cover rounded-xl cursor-pointer hover:opacity-90" onClick={() => setLightbox(img)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full text-white text-xl flex items-center justify-center" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default Reports;
