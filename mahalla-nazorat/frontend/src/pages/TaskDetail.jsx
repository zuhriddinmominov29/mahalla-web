import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, reportsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ReportForm from '../components/ReportForm';
import MapView from '../components/MapView';
import toast from 'react-hot-toast';

const SB = { PENDING:'badge-pending', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', OVERDUE:'badge-overdue', CANCELLED:'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs' };
const SL = { PENDING:'Kutilmoqda', IN_PROGRESS:'Jarayonda', COMPLETED:'Bajarildi', OVERDUE:"Muddati o'tdi", CANCELLED:'Bekor qilindi' };
const RS = { SUBMITTED:'Yuborildi', REVIEWED:"Ko'rib chiqildi", APPROVED:'Tasdiqlandi', REJECTED:'Rad etildi' };

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRais, isHokim, isDeputy, isSuperAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { loadTask(); }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try { const { data } = await tasksAPI.getById(id); setTask(data); }
    catch { toast.error('Topshiriq topilmadi'); navigate('/tasks'); }
    finally { setLoading(false); }
  };

  const handleReview = async (reportId, status) => {
    setReviewing(true);
    try {
      await reportsAPI.review(reportId, { status, reviewNote });
      toast.success(status === 'APPROVED' ? 'Tasdiqlandi! ✅' : 'Rad etildi ❌');
      setReviewModal(null); setReviewNote(''); loadTask();
    } catch { toast.error('Xato'); }
    finally { setReviewing(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" /></div>;
  if (!task) return null;

  const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000) : null;
  const withLocation = task.reports?.filter(r => r.latitude && r.longitude) || [];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm">← Orqaga</button>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={SB[task.status]}>{SL[task.status]}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.type==='PERMANENT'?'bg-indigo-100 text-indigo-700':'bg-teal-100 text-teal-700'}`}>{task.type==='PERMANENT'?'Doimiy':'Bir martalik'}</span>
              {task.category && <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: task.category.color }}>{task.category.name}</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            {task.description && <p className="text-gray-600 text-sm mt-2">{task.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
          {task.assignedTo && <div><p className="text-xs text-gray-400">Tayinlangan</p><p className="text-sm font-semibold mt-0.5">👤 {task.assignedTo.name}</p></div>}
          {task.mahalla && <div><p className="text-xs text-gray-400">Mahalla</p><p className="text-sm font-semibold mt-0.5">📍 {task.mahalla}</p></div>}
          {task.deadline && (
            <div><p className="text-xs text-gray-400">Muddat</p>
              <p className={`text-sm font-semibold mt-0.5 ${daysLeft!==null&&daysLeft<0?'text-red-600':daysLeft!==null&&daysLeft<=3?'text-orange-500':'text-gray-900'}`}>
                📅 {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                {daysLeft!==null && <span className="text-xs ml-1">({daysLeft<0?`${Math.abs(daysLeft)} kun o'tdi`:`${daysLeft} kun`})</span>}
              </p>
            </div>
          )}
          <div><p className="text-xs text-gray-400">Hisobotlar</p><p className="text-sm font-semibold mt-0.5">📝 {task.reports?.length||0} ta</p></div>
        </div>

        {isRais() && !['COMPLETED','CANCELLED'].includes(task.status) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => setShowReportForm(true)} className="btn-primary">📤 Hisobot yuborish</button>
          </div>
        )}
      </div>

      {withLocation.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">🗺️ Joylashuv xaritasi</h2>
          <MapView reports={withLocation} center={[withLocation[0].latitude, withLocation[0].longitude]} />
        </div>
      )}

      {task.reports?.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">📝 Hisobotlar ({task.reports.length})</h2>
          <div className="space-y-4">
            {task.reports.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <span className="text-sm font-semibold">👤 {r.user?.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(r.createdAt).toLocaleString('uz-UZ')}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status==='APPROVED'?'bg-green-100 text-green-700':r.status==='REJECTED'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                    {RS[r.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{r.description}</p>
                {r.latitude && <p className="text-xs text-blue-600 mb-2">📍 {r.locationName || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}</p>}
                {r.images?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {r.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90" onClick={() => setLightbox(img)} />
                    ))}
                  </div>
                )}
                {r.reviewNote && <div className={`text-xs p-2 rounded-lg ${r.status==='APPROVED'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>💬 {r.reviewNote}</div>}
                {(isHokim()||isDeputy()||isSuperAdmin()) && r.status==='SUBMITTED' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setReviewModal({ reportId: r.id, action: 'APPROVED' })} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-1.5 px-3 rounded-lg text-sm">✅ Tasdiqlash</button>
                    <button onClick={() => setReviewModal({ reportId: r.id, action: 'REJECTED' })} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-1.5 px-3 rounded-lg text-sm">❌ Rad etish</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showReportForm && <ReportForm taskId={task.id} taskTitle={task.title} onClose={() => setShowReportForm(false)} onSuccess={() => { setShowReportForm(false); loadTask(); }} />}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">{reviewModal.action==='APPROVED'?'✅ Tasdiqlash':'❌ Rad etish'}</h3>
            <textarea className="input resize-none mb-4" rows={3} placeholder="Izoh (ixtiyoriy)..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1 justify-center">Bekor</button>
              <button onClick={() => handleReview(reviewModal.reportId, reviewModal.action)} disabled={reviewing}
                className={`flex-1 font-medium py-2 px-4 rounded-lg text-white ${reviewModal.action==='APPROVED'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}`}>
                {reviewing ? '⏳' : reviewModal.action==='APPROVED'?'Tasdiqlash':'Rad etish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex items-center justify-center" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
