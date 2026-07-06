import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { timeOf, replyPreviewText } from './chatUtils';

const MENU_W = 190;

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d} /></svg>
  );
}

const icons = {
  reply:  'M9 17l-5-5 5-5M4 12h11a4 4 0 014 4v2',
  copy:   'M8 8h10a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10a2 2 0 012-2zM6 16H4a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v2',
  edit:   'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:  'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6',
  check:  'M20 6L9 17l-5-5',
  clock:  'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
};

export default function MessageBubble({
  msg, mine, accent = false, senderLine,
  onReply, onDelete, onEdit, onQuoteClick,
}) {
  const [menu, setMenu]             = useState(null); // {x, y}
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState('');
  const pressTimer = useRef(null);
  const editRef    = useRef(null);

  const canModify = mine && !msg._sending;
  const hasText   = !!msg.content;

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function openMenu(x, y) {
    setMenu({
      x: Math.min(x, window.innerWidth - MENU_W - 8),
      y: Math.min(y, window.innerHeight - 220),
    });
  }
  function handleContextMenu(e) {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }
  function handleTouchStart(e) {
    const t = e.touches[0];
    pressTimer.current = setTimeout(() => openMenu(t.clientX, t.clientY), 420);
  }
  function clearPress() { clearTimeout(pressTimer.current); }

  function copyText() {
    navigator.clipboard?.writeText(msg.content || '');
    toast.success('Nusxalandi');
  }

  async function saveEdit() {
    const ok = await onEdit?.(msg.id, editText);
    if (ok !== false) setEditing(false);
  }

  const menuItems = [
    { key: 'reply', label: 'Javob berish', icon: icons.reply, show: !msg._sending && !!onReply,
      run: () => onReply(msg) },
    { key: 'copy', label: 'Nusxalash', icon: icons.copy, show: hasText,
      run: copyText },
    { key: 'edit', label: 'Tahrirlash', icon: icons.edit, show: canModify && hasText && !!onEdit,
      run: () => { setEditText(msg.content || ''); setEditing(true); } },
    { key: 'del', label: "O'chirish", icon: icons.trash, show: canModify && !!onDelete, danger: true,
      run: () => setConfirmDel(true) },
  ].filter(i => i.show);

  const bubbleClass = mine
    ? 'bg-primary-600 text-white rounded-br-md'
    : accent
    ? 'bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/25 text-gray-800 dark:text-gray-100 rounded-bl-md'
    : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md';

  const metaClass = mine ? 'text-white/60' : 'text-gray-400 dark:text-gray-500';
  const images = (msg.attachments || []).filter(a => a.mime_type?.startsWith('image/') && a.url);
  const others = (msg.attachments || []).filter(a => !a.mime_type?.startsWith('image/'));

  return (
    <div data-mid={msg.id}
      className={`flex ${mine ? 'justify-end' : 'justify-start'} group msg-in px-0.5`}>
      <div className={`max-w-[78%] sm:max-w-[70%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
        {senderLine && (
          <span className={`text-[11px] font-semibold px-1.5 mb-0.5 ${accent
            ? 'text-gold-600 dark:text-gold-400' : 'text-primary-500 dark:text-primary-300'}`}>
            {senderLine}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Hover'da chiqadigan tez amallar (desktop) */}
          {!msg._sending && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${mine ? 'right-full mr-1' : 'left-full ml-1'}
              hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
              {onReply && (
                <button onClick={() => onReply(msg)} title="Javob berish"
                  className="p-1.5 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-400 hover:text-primary-500 shadow-sm transition-colors">
                  <Icon d={icons.reply} className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={e => { const r = e.currentTarget.getBoundingClientRect(); openMenu(r.left, r.bottom + 4); }}
                title="Amallar"
                className="p-1.5 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shadow-sm transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
                </svg>
              </button>
            </div>
          )}

          <div
            onContextMenu={handleContextMenu}
            onDoubleClick={() => !msg._sending && onReply?.(msg)}
            onTouchStart={handleTouchStart}
            onTouchEnd={clearPress}
            onTouchMove={clearPress}
            className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm select-text
              ${msg._sending ? 'opacity-70' : ''} ${bubbleClass}`}>

            {/* Reply-quote */}
            {(msg.reply || msg.reply_to) && !editing && (
              <button type="button"
                onClick={() => msg.reply && onQuoteClick?.(msg.reply.id)}
                className={`w-full text-left mb-1.5 rounded-lg px-2.5 py-1.5 border-l-[3px] text-xs transition-colors
                  ${mine
                    ? 'bg-white/10 border-white/70 hover:bg-white/15'
                    : 'bg-primary-500/5 dark:bg-primary-400/10 border-primary-500 hover:bg-primary-500/10'}`}>
                <div className={`font-semibold mb-0.5 truncate ${mine ? 'text-white' : 'text-primary-600 dark:text-primary-300'}`}>
                  {msg.reply?.sender?.full_name || 'Xabar'}
                </div>
                <div className={`truncate ${mine ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'}`}>
                  {replyPreviewText(msg.reply)}
                </div>
              </button>
            )}

            {editing ? (
              <div className="flex flex-col gap-2 min-w-52">
                <textarea ref={editRef} value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  rows={2}
                  className="w-full rounded-lg px-2.5 py-2 text-sm resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                <div className="flex gap-2">
                  <button onClick={saveEdit}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs py-1.5 rounded-lg font-semibold transition-colors">Saqlash</button>
                  <button onClick={() => setEditing(false)}
                    className="flex-1 bg-slate-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1.5 rounded-lg transition-colors">Bekor</button>
                </div>
              </div>
            ) : (
              <>
                {/* Rasmlar */}
                {images.length > 0 && (
                  <div className={`${hasText || others.length ? 'mb-1.5' : ''} ${images.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
                    {images.map(a => (
                      <img key={a.id} src={a.url} alt={a.name || ''}
                        loading="lazy"
                        className={`rounded-xl cursor-pointer hover:opacity-90 transition-opacity object-cover
                          ${images.length > 1 ? 'w-full h-32' : 'max-w-full max-h-72'}`}
                        onClick={() => window.open(a.url, '_blank')} />
                    ))}
                  </div>
                )}

                {/* Fayllar */}
                {others.map(a => (
                  <a key={a.id} href={a.url || '#'} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 mb-1 transition-colors
                      ${mine ? 'bg-white/10 hover:bg-white/15' : 'bg-slate-100 dark:bg-gray-900/60 hover:bg-slate-200 dark:hover:bg-gray-900'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${mine ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-500/20'}`}>
                      <Icon d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7"
                        className={`w-4 h-4 ${mine ? 'text-white' : 'text-primary-500'}`} />
                    </span>
                    <span className="text-xs truncate font-medium">{a.name || 'Fayl'}</span>
                  </a>
                ))}

                {hasText && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                {/* Vaqt + holat (bubble ichida, Telegram kabi) */}
                <span className={`float-right ml-2 mt-1 flex items-center gap-1 text-[10px] ${metaClass}`}>
                  {msg.is_edited && <span>tahrirlangan ·</span>}
                  <span>{timeOf(msg.created_at)}</span>
                  {mine && (msg._sending
                    ? <Icon d={icons.clock} className="w-3 h-3" />
                    : <Icon d={icons.check} className="w-3 h-3" />)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kontekst-menyu */}
      {menu && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={e => { e.preventDefault(); setMenu(null); }} />
          <div style={{ left: menu.x, top: menu.y, width: MENU_W }}
            className="fixed z-50 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-xl msg-in">
            {menuItems.map(item => (
              <button key={item.key}
                onClick={() => { setMenu(null); item.run(); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm text-left transition-colors
                  ${item.danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700'}`}>
                <Icon d={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        </>, document.body)}

      {/* O'chirish tasdig'i */}
      {confirmDel && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setConfirmDel(false)}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-slate-200 dark:border-gray-800 msg-in">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">Xabarni o'chirish</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Bu xabar barcha uchun o'chiriladi. Davom etasizmi?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
                Bekor
              </button>
              <button onClick={() => { setConfirmDel(false); onDelete?.(msg.id); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">
                O'chirish
              </button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
