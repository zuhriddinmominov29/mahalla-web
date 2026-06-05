import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../lib/api';

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(submitted) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px; height:36px; border-radius:50%;
      background:${submitted ? '#22c55e' : '#ef4444'};
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex; align-items:center; justify-content:center;
      font-size:16px; line-height:1;
    ">${submitted ? '✓' : '✗'}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
    popupAnchor:[0, -20],
  });
}

// Boysun tumani markazi
const CENTER = [37.675, 67.19];

export default function HokimMapPage() {
  const [subs,    setSubs]    = useState([]);
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/submissions?date=${date}`)
      .then(r => { if (r.success) setSubs(r.data); })
      .finally(() => setLoading(false));
  }, [date]);

  const withLocation = subs.filter(s => s.submitted && s.latitude && s.longitude);
  const submitted    = subs.filter(s => s.submitted).length;
  const notSubmitted = subs.filter(s => !s.submitted).length;
  const withGps      = withLocation.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-wrap flex-shrink-0">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          🗺️ Hisobot xaritasi
        </h1>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <span className="text-xs text-green-400 bg-green-950/30 px-2 py-1 rounded-lg">✅ {submitted} hisobot berdi</span>
          <span className="text-xs text-red-400 bg-red-950/30 px-2 py-1 rounded-lg">❌ {notSubmitted} bermadi</span>
          <span className="text-xs text-blue-400 bg-blue-950/30 px-2 py-1 rounded-lg">📍 {withGps} lokatsiya</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input py-1.5 text-sm w-36" />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/70">
            <div className="text-gray-400">Yuklanmoqda...</div>
          </div>
        )}

        <MapContainer
          center={CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {withLocation.map(r => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={makeIcon(true)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>✅ {r.full_name}</div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 2 }}>{r.mahalla_name} MFY</div>
                  {r.submitted_at && (
                    <div style={{ color: '#4ade80', fontSize: 12 }}>
                      🕐 {new Date(r.submitted_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {r.accuracy && (
                    <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                      📡 Aniqlik: ~{Math.round(r.accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
              {r.accuracy && r.accuracy < 500 && (
                <Circle
                  center={[r.latitude, r.longitude]}
                  radius={r.accuracy}
                  pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08, weight: 1 }}
                />
              )}
            </Marker>
          ))}
        </MapContainer>

        {/* Bermagan raislar ro'yxati */}
        {notSubmitted > 0 && (
          <div className="absolute bottom-4 right-4 z-10 bg-gray-900/95 border border-gray-700 rounded-2xl p-3 max-h-48 overflow-y-auto w-56 shadow-xl">
            <div className="text-xs font-semibold text-red-400 mb-2">❌ Hisobot bermadi ({notSubmitted})</div>
            {subs.filter(s => !s.submitted).map(r => (
              <div key={r.id} className="text-xs text-gray-400 py-1 border-b border-gray-800 last:border-0 truncate">
                {r.full_name} · {r.mahalla_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
