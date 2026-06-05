import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const TYPES = [
  { key: 'yomgir',  icon: '🌧️', label: "Yomg'ir" },
  { key: 'shamol',  icon: '💨', label: 'Shamol/Bo\'ron' },
  { key: 'elektr',  icon: '⚡', label: 'Elektr o\'chgan' },
  { key: 'sel',     icon: '🌊', label: 'Sel/Suv toshqini' },
  { key: 'talofat', icon: '🏚️', label: 'Zarar/Talofat' },
  { key: 'yongir',  icon: '🔥', label: 'Yong\'in' },
];

const SEV = [
  { key: 'low',      label: 'Past',   color: 'bg-green-600' },
  { key: 'medium',   label: "O'rta",  color: 'bg-yellow-600' },
  { key: 'high',     label: 'Yuqori', color: 'bg-orange-600' },
  { key: 'critical', label: 'Kritik', color: 'bg-red-600' },
];

export default function RaisEmergencyPage() {
  const [selected,    setSelected]    = useState([]);
  const [severity,    setSeverity]    = useState('medium');
  const [description, setDescription] = useState('');
  const [casualties,  setCasualties]  = useState(0);
  const [sending,     setSending]     = useState(false);
  const [myList,      setMyList]      = useState([]);

  useEffect(() => {
    api.get('/emergency?status=all').then(r => { if (r.success) setMyList(r.data); });
  }, []);

  function toggleType(key) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected.length) return toast.error('Kamida bitta vaziyat turini tanlang');
    if (!description.trim()) return toast.error('Tavsif yozing');
    setSending(true);
    try {
      const res = await api.post('/emergency', { types: selected, severity, description, casualties });
      if (res.success) {
        toast.success('Favqulodda xabar yuborildi!');
        setSelected([]); setDescription(''); setCasualties(0); setSeverity('medium');
        const r = await api.get('/emergency?status=all');
        if (r.success) setMyList(r.data);
      } else toast.error(res.message);
    } catch { toast.error('Xato yuz berdi'); }
    finally { setSending(false); }
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          ⚠️ <span>Vaziyat Bo'limi</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Mahallangizda yuzaga kelgan vaziyat haqida xabar bering</p>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* Vaziyat turlari */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Vaziyat turi tanlang</h3>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => toggleType(t.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all
                  ${selected.includes(t.key)
                    ? 'bg-red-600/20 border-red-500 text-red-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}`}>
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Og'irlik */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Og'irlik darajasi</h3>
          <div className="flex gap-2">
            {SEV.map(s => (
              <button key={s.key} onClick={() => setSeverity(s.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border
                  ${severity === s.key
                    ? `${s.color} text-white border-transparent`
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tavsif */}
        <div className="card">
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Tavsif</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={3} placeholder="Vaziyatni batafsil tasvirlab bering..."
            className="input resize-none" />
          <div className="mt-3">
            <label className="text-sm text-gray-400 mb-1 block">Jabrlanganlar soni</label>
            <input type="number" min={0} value={casualties} onChange={e => setCasualties(e.target.value)}
              className="input w-32" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={sending}
          className="btn-danger w-full py-4 text-base font-bold">
          {sending ? '⏳ Yuborilmoqda...' : '⚠️ Vaziyat xabarini yuborish'}
        </button>

        {/* Mening xabarlarim */}
        {myList.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Yuborilgan xabarlar</h3>
            <div className="space-y-2">
              {myList.map(e => (
                <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm
                  ${e.status === 'active' ? 'border-red-800/50 bg-red-950/20' : 'border-green-800/50 bg-green-950/20'}`}>
                  <span>{e.types?.map(t => TYPES.find(x => x.key === t)?.icon).join('')}</span>
                  <span className="flex-1 text-gray-300 truncate">{e.description}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${e.status === 'active' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                    {e.status === 'active' ? 'Faol' : 'Hal qilindi'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
