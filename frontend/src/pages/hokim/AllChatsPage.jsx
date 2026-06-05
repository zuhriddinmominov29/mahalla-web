import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';

export default function HokimAllChatsPage() {
  const { user }        = useAuthStore();
  const [users,      setUsers]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [content,    setContent]    = useState('');
  const [replyTo,    setReplyTo]    = useState('all');
  const [sending,    setSending]    = useState(false);
  const [files,      setFiles]      = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    api.get('/users').then(r => {
      if (r.success) setUsers(r.data.filter(u => ['rais','uyushma'].includes(u.role)));
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoadingMsg(true);
    try {
      const res = await api.get('/messages?limit=100');
      if (res.success) {
        const msgs = selected
          ? res.data.filter(m => m.sender?.id === selected ||
              (m.sender?.role === 'hokim' && (m.recipients === null || m.recipients?.includes(selected))))
          : res.data;
        setMessages(msgs);
      }
    } finally { setLoadingMsg(false); }
  }, [selected]);

  useEffect(() => {
    loadMessages();
    const ch = supabase.channel('hokim-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `district_id=eq.${user.district_id}` }, () => loadMessages())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadMessages, user.district_id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendReply(e) {
    e.preventDefault();
    if (!content.trim() && !files.length) return;
    setSending(true);
    try {
      const form = new FormData();
      if (content.trim()) form.append('content', content.trim());
      files.forEach(f => form.append('files', f));
      if (replyTo !== 'all' && selected) {
        form.append('recipients', JSON.stringify([selected]));
      }
      const res = await api.post('/messages', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.success) { setContent(''); setFiles([]); loadMessages(); }
      else toast.error(res.message);
    } catch { toast.error('Xato'); }
    finally { setSending(false); }
  }

  const selectedUser = users.find(u => u.id === selected);
  const unread = (uid) => messages.filter(m => m.sender?.id === uid && !m.is_read).length;

  return (
    <div className="flex h-full">
      {/* Raislar ro'yxati */}
      <div className="w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Raislar ({users.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Hammasi */}
          <button onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all
              ${!selected
                ? 'bg-slate-100 dark:bg-gray-800 border-r-2 border-primary-500'
                : 'hover:bg-slate-50 dark:hover:bg-gray-800'}`}>
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-600/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💬</div>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Barcha xabarlar</div>
              <div className="text-xs text-gray-500">{messages.length} ta xabar</div>
            </div>
          </button>

          {users.map(u => {
            const cnt = unread(u.id);
            return (
              <button key={u.id} onClick={() => setSelected(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all
                  ${selected === u.id
                    ? 'bg-slate-100 dark:bg-gray-800 border-r-2 border-primary-500'
                    : 'hover:bg-slate-50 dark:hover:bg-gray-800'}`}>
                <div className="w-9 h-9 bg-slate-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                  {u.role === 'uyushma' ? '🤝' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate text-xs">{u.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {u.mahallas?.name || (u.role === 'uyushma' ? 'Uyushma' : '')}
                  </div>
                </div>
                {cnt > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-5 py-4 flex items-center gap-3">
          {selected ? (
            <>
              <div className="w-9 h-9 bg-slate-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                {selectedUser?.role === 'uyushma' ? '🤝' : '👤'}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{selectedUser?.full_name}</div>
                <div className="text-xs text-gray-500">{selectedUser?.mahallas?.name} MFY</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-600/20 rounded-xl flex items-center justify-center">💬</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">Barcha xabarlar</div>
                <div className="text-xs text-gray-500">{messages.length} ta xabar</div>
              </div>
            </>
          )}
          <div className="ml-auto flex gap-2">
            {['all','selected'].map(r => (
              <button key={r} onClick={() => setReplyTo(r)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                  ${replyTo === r
                    ? 'bg-gold-500 text-gray-950 border-gold-500'
                    : 'border-slate-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-600'}`}>
                {r === 'all' ? '👥 Hammaga' : '👤 Faqat shu raisga'}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-gray-950">
          {loadingMsg ? (
            <div className="flex justify-center py-8 text-gray-400">Yuklanmoqda...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-5xl mb-3">📭</span>
              <p className="text-gray-400">Xabar yo'q</p>
            </div>
          ) : messages.map(msg => {
            const isHokim = msg.sender?.role === 'hokim';
            return (
              <div key={msg.id} className={`flex ${isHokim ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] flex flex-col gap-1 ${isHokim ? 'items-end' : 'items-start'}`}>
                  {!isHokim && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      {msg.sender?.full_name} · {msg.sender?.mahallas?.name}
                    </span>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm
                    ${isHokim
                      ? 'bg-gold-500/10 border border-gold-500/30 text-gray-800 dark:text-gray-100 rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-bl-sm'}`}>
                    {msg.content && <p>{msg.content}</p>}
                    {msg.attachments?.map(a => (
                      <div key={a.id} className="mt-2">
                        {a.mime_type?.startsWith('image/') ? (
                          <img src={a.url} alt={a.name}
                            className="max-w-xs rounded-xl cursor-pointer hover:opacity-90"
                            onClick={() => window.open(a.url, '_blank')} />
                        ) : (
                          <a href={a.url} target="_blank" rel="noopener"
                            className="flex items-center gap-2 bg-slate-100 dark:bg-gray-900/50 rounded-lg px-3 py-2 hover:bg-slate-200 dark:hover:bg-gray-900">
                            <span>📎</span><span className="text-xs truncate">{a.name}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 px-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: uz })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 p-4">
          {files.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <span>{f.type.startsWith('image/') ? '🖼️' : '📎'}</span>
                  <span className="max-w-24 truncate">{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={sendReply} className="flex gap-3 items-end">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-10 h-10 flex-shrink-0 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all">
              📎
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => {
              setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0,5));
              e.target.value = '';
            }} />
            <textarea value={content} onChange={e => setContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); }}}
              placeholder={replyTo === 'all' ? 'Barcha raislar uchun javob...' : `${selectedUser?.full_name || 'rais'} ga javob...`}
              rows={1} className="input flex-1 resize-none" />
            <button type="submit" disabled={sending || (!content.trim() && !files.length)}
              className="btn-primary w-10 h-10 flex-shrink-0 p-0 rounded-xl">
              {sending ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
