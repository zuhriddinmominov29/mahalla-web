import React, { useState, useEffect, useRef } from 'react';
import { reportsAPI } from '../utils/api';
import { compressImages, createPreviewUrl, revokePreviewUrls } from '../utils/imageCompressor';
import toast from 'react-hot-toast';

const ReportForm = ({ taskId, taskTitle, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => revokePreviewUrls(images.map(i => i.preview)), []);

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error("Brauzer geolokatsiyani qo'llab-quvvatlamaydi.");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=uz`);
          const data = await res.json();
          const name = data.display_name?.split(',').slice(0, 3).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation({ latitude, longitude, name });
          toast.success('Joylashuv aniqlandi! 📍');
        } catch {
          setLocation({ latitude, longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          toast.success('Joylashuv aniqlandi! 📍');
        }
        setLocationLoading(false);
      },
      () => { toast.error("Joylashuvga ruxsat bering."); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - images.length;
    if (remaining <= 0) return toast.error('Maksimal 4 ta rasm.');
    setCompressing(true);
    try {
      const compressed = await compressImages(files.slice(0, remaining));
      setImages(prev => [...prev, ...compressed.map(f => ({ file: f, preview: createPreviewUrl(f) }))]);
      toast.success(`${compressed.length} ta rasm qo'shildi ✅`);
    } catch (err) { toast.error(err.message); }
    finally { setCompressing(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const removeImage = (i) => setImages(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Hisobot matni kiritilishi shart!');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('taskId', taskId);
      fd.append('description', description);
      if (location) { fd.append('latitude', location.latitude); fd.append('longitude', location.longitude); fd.append('locationName', location.name); }
      images.forEach(({ file }) => fd.append('images', file));
      await reportsAPI.submit(fd);
      toast.success('Hisobot yuborildi! 📤');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">📤 Hisobot yuborish</h2>
            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">📝 Hisobot matni *</label>
            <textarea className="input resize-none" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Bajarilgan ish haqida yozing..." required />
          </div>

          <div>
            <label className="label">📍 GPS Joylashuv</label>
            {location ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <span>📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-800 font-medium truncate">{location.name}</p>
                  <p className="text-xs text-green-600">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                </div>
                <button type="button" onClick={() => setLocation(null)} className="text-xs text-green-600 hover:text-green-800">✕</button>
              </div>
            ) : (
              <button type="button" onClick={getLocation} disabled={locationLoading}
                className="w-full border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-600 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {locationLoading
                  ? <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Aniqlanmoqda...</>
                  : <><span className="text-xl">📍</span>Joylashuvni aniqlash</>}
              </button>
            )}
          </div>

          <div>
            <label className="label">📸 Rasmlar <span className="text-gray-400 font-normal">(max 4 ta)</span></label>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={img.preview} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex">✕</button>
                  </div>
                ))}
                {images.length < 4 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-400 text-2xl transition-colors">+</button>
                )}
              </div>
            )}
            {images.length === 0 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={compressing}
                className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-400 py-8 rounded-xl text-sm transition-colors flex flex-col items-center gap-2">
                {compressing
                  ? <><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Kompressiya...</>
                  : <><span className="text-4xl">📸</span>Rasm qo'shish<span className="text-xs">JPG/PNG/WEBP • Avtomatik siqiladi</span></>}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Bekor</button>
            <button type="submit" disabled={loading || compressing} className="btn-primary flex-1 justify-center">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Yuklanmoqda...</> : '📤 Yuborish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
