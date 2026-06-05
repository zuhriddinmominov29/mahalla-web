import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';

export default function RaisChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages]     = useState([]);
  const [content, setContent]       = useState('');
  const [files, setFiles]           = useState([]);
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const textareaRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get('/messages?limit=50');
      if (res.success) setMessages(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel('messages-rais')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'messages',
        filter: `district_id=eq.${user.district_id}`,
      }, () => loadMessages())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadMessages, user.district_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [content]);

  function getLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        ()  => resolve(null),
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    const tempId = 'temp-' + Date.now();
    const optimistic = {
      id: tempId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      sender: { id: user.id, full_name: user.full_name, role: user.role },
      attachments: [],
      _sending: true,
    };

    // Optimistic update — darhol ko'rinsin
    setMessages(prev => [...prev, optimistic]);
    const savedContent = content.trim();
    const savedFiles = [...files];
    setContent('');
    setFiles([]);

    setSending(true);
    try {
      const loc = await getLocation();
      const form = new FormData();
      if (savedContent) form.append('content', savedContent);
      savedFiles.forEach(f => form.append('files', f));
      if (loc) {
        form.append('latitude',  loc.latitude);
        form.append('longitude', loc.longitude);
        form.append('accuracy',  loc.accuracy);
      }

      const res = await api.post('/messages', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        // Optimistik xabarni haqiqiy bilan almashtir
        setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, sender: { id: user.id, full_name: user.full_name, role: user.role }, attachments: res.data.attachments || [] } : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(res.message || 'Xabar yuborilmadi');
        setContent(savedContent);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Tarmoq xatosi');
      setContent(savedContent);
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(id) {
    if (!confirm('Xabarni o\'chirishni tasdiqlaysizmi?')) return;
    setMessages(prev => prev.filter(m => m.id !== id));
    const res = await api.delete(`/messages/${id}`);
    if (!res.success) {
      toast.error(res.message || 'O\'chirib bo\'lmadi');
      loadMessages();
    } else {
      toast.success('Xabar o\'chirildi');
    }
  }

  async function saveEdit(id) {
    if (!editText.trim()) return;
    const res = await api.patch(`/messages/${id}`, { content: editText.trim() });
    if (res.success) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editText.trim(), is_edited: true } : m));
      setEditingId(null);
      toast.success('Tahrirlandi');
    } else {
      toast.error(res.message || 'Xato');
    }
  }

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);
    const valid    = selected.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < selected.length) toast.error('Fayl 10MB dan kichik bo\'lsin');
    setFiles(prev => [...prev, ...valid].slice(0, 5));
    e.target.value = '';
  }

  const isMine     = m => m.sender?.id === user.id;
  const isFromHokim = m => m.sender?.role === 'hokim';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 flex-shrink-0"
           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center text-lg">📋</div>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Hisobotlar</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hokimga kunlik hisobot yuboring</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Jonli</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-3">💬</span>
            <p style={{ color: 'var(--text-secondary)' }}>Hali hisobot yo'q</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Bugungi hisobotingizni yuboring</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[75%] ${isMine(msg) ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMine(msg) && (
                  <span className="text-xs text-gold-400 font-medium px-1">
                    {isFromHokim(msg) ? '🏛️ Hokim' : msg.sender?.full_name}
                  </span>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative
                  ${msg._sending ? 'opacity-60' : ''}
                  ${isMine(msg)
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : isFromHokim(msg)
                    ? 'bg-gold-500/10 border border-gold-500/20 rounded-bl-sm'
                    : 'rounded-bl-sm'
                  }`}
                  style={(!isMine(msg) && !isFromHokim(msg)) ? { background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)', border: '1px solid var(--border)' } : {}}>

                  {/* Edit mode */}
                  {editingId === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-48">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="input text-sm py-2 min-h-16 resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(msg.id)}
                          className="flex-1 bg-primary-600 text-white text-xs py-1.5 rounded-lg font-semibold">
                          Saqlash
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 text-xs py-1.5 rounded-lg"
                          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.content && <p>{msg.content}</p>}
                      {msg.is_edited && (
                        <span className="text-xs opacity-60 ml-1">(tahrirlangan)</span>
                      )}
                      {msg.attachments?.map(a => (
                        <div key={a.id} className="mt-2">
                          {a.mime_type?.startsWith('image/') ? (
                            <img src={a.url} alt={a.name}
                              className="max-w-xs rounded-xl cursor-pointer hover:opacity-90"
                              onClick={() => window.open(a.url, '_blank')} />
                          ) : (
                            <a href={a.url} target="_blank" rel="noopener"
                              className="flex items-center gap-2 rounded-lg px-3 py-2"
                              style={{ background: 'rgba(0,0,0,0.2)' }}>
                              <span>📎</span>
                              <span className="text-xs truncate">{a.name}</span>
                            </a>
                          )}
                        </div>
                      ))}
                      {msg._sending && <span className="text-xs opacity-50 ml-1">⏳</span>}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: uz })}
                  </span>
                  {/* Edit/Delete buttons — faqat o'z xabarlari */}
                  {isMine(msg) && !msg._sending && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(msg.id); setEditText(msg.content || ''); }}
                        className="text-xs px-1.5 py-0.5 rounded-md transition-all"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
                        title="Tahrirlash">
                        ✏️
                      </button>
                      <button onClick={() => deleteMessage(msg.id)}
                        className="text-xs px-1.5 py-0.5 rounded-md transition-all hover:text-red-400"
                        style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
                        title="O'chirish">
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="px-4 py-2 border-t flex gap-2 flex-wrap"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                 style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
              <span>{f.type.startsWith('image/') ? '🖼️' : '📎'}</span>
              <span className="max-w-24 truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="ml-1 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4"
           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            📎
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
            placeholder="Hisobotingizni yozing... (Enter = yuborish)"
            rows={1}
            className="input flex-1 resize-none py-2.5"
            style={{ minHeight: '42px', maxHeight: '128px' }}
          />

          <button type="submit" disabled={sending || (!content.trim() && !files.length)}
            className="btn-primary w-10 h-10 flex-shrink-0 p-0 rounded-xl">
            {sending ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
}
