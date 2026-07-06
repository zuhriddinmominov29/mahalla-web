import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { replyPreviewText } from './chatUtils';

const MAX_FILE = 10 * 1024 * 1024;

/**
 * Telegram uslubidagi yozish paneli: auto-resize textarea, fayl preview,
 * reply-bar, Enter = yuborish. onSend({content, files}) → true/false qaytaradi.
 */
export default function ChatInput({ onSend, sending, replyingTo, onCancelReply, placeholder = 'Xabar yozing...' }) {
  const [content, setContent] = useState('');
  const [files, setFiles]     = useState([]);
  const textareaRef = useRef(null);
  const fileRef     = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 130) + 'px';
    }
  }, [content]);

  useEffect(() => { if (replyingTo) textareaRef.current?.focus(); }, [replyingTo]);

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size <= MAX_FILE);
    if (valid.length < selected.length) toast.error("Fayl 10MB dan kichik bo'lsin");
    setFiles(prev => [...prev, ...valid].slice(0, 5));
    e.target.value = '';
  }

  async function submit(e) {
    e?.preventDefault();
    if (sending || (!content.trim() && !files.length)) return;
    const c = content, f = files;
    setContent('');
    setFiles([]);
    const ok = await onSend({ content: c, files: f });
    if (!ok) { setContent(c); setFiles(f); }
  }

  const canSend = !sending && (content.trim() || files.length > 0);

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex-shrink-0">
      {/* Reply-bar */}
      {replyingTo && (
        <div className="flex items-center gap-3 px-4 pt-3 msg-in">
          <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 17l-5-5 5-5M4 12h11a4 4 0 014 4v2" />
          </svg>
          <div className="flex-1 min-w-0 border-l-[3px] border-primary-500 pl-2.5">
            <div className="text-xs font-semibold text-primary-600 dark:text-primary-300 truncate">
              {replyingTo.sender?.full_name} ga javob
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {replyPreviewText(replyingTo)}
            </div>
          </div>
          <button onClick={onCancelReply}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Fayl preview */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="relative group/file">
              {f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt={f.name}
                  className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-gray-700" />
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-36">
                  <span>📎</span><span className="truncate">{f.name}</span>
                </div>
              )}
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-[10px] flex items-center justify-center shadow hover:bg-red-500 transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input qatori */}
      <form onSubmit={submit} className="flex gap-2 items-end p-3 sm:p-4">
        <button type="button" onClick={() => fileRef.current?.click()} title="Fayl biriktirish"
          className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />

        <textarea ref={textareaRef} value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm bg-slate-100 dark:bg-gray-800 border border-transparent text-gray-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:bg-white dark:focus:bg-gray-800 transition-colors"
          style={{ minHeight: '42px', maxHeight: '130px' }} />

        <button type="submit" disabled={!canSend} title="Yuborish (Enter)"
          className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all
            ${canSend
              ? 'bg-primary-600 hover:bg-primary-500 text-white scale-100 shadow-md shadow-primary-600/30'
              : 'bg-slate-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
