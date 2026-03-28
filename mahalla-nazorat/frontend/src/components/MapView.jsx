import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const dot = (color) => L.divIcon({
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7], className: '',
});

const STATUS_COLORS = { APPROVED: '#10b981', REJECTED: '#ef4444', SUBMITTED: '#3b82f6', REVIEWED: '#f59e0b' };

const MapView = ({ reports = [], center = [41.2995, 69.2401], zoom = 13, height = '350px' }) => (
  <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-200">
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map(r => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={dot(STATUS_COLORS[r.status] || '#3b82f6')}>
          <Popup>
            <div className="text-sm min-w-[180px]">
              <p className="font-semibold">📍 {r.locationName || 'Joylashuv'}</p>
              {r.user && <p className="text-gray-600 text-xs mt-1">👤 {r.user.name}{r.user.mahalla ? ` • ${r.user.mahalla}` : ''}</p>}
              <p className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleString('uz-UZ')}</p>
              {r.images?.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {r.images.slice(0, 2).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </div>
);

export default MapView;
