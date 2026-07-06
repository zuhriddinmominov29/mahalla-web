import { useRef, useState, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { groupByDay } from './chatUtils';

/**
 * Sana ajratgichlari, avto-scroll va "pastga tushish" tugmasi bilan
 * xabarlar ro'yxati. bubbleProps(msg) → MessageBubble props.
 */
export default function MessageList({ messages, loading, empty, bubbleProps }) {
  const listRef   = useRef(null);
  const nearBottomRef = useRef(true);
  const firstScrollRef = useRef(true);
  const [showDown, setShowDown] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = gap < 140;
    setShowDown(gap > 350);
  }

  useEffect(() => {
    if (!messages.length) return;
    if (firstScrollRef.current) {
      scrollToBottom(false);
      firstScrollRef.current = false;
    } else if (nearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Reply-quote bosilganda asl xabarga sakrash + yoritish
  const jumpTo = useCallback((id) => {
    const el = listRef.current?.querySelector(`[data-mid="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('flash-highlight');
    void el.offsetWidth; // animatsiyani qayta boshlash
    el.classList.add('flash-highlight');
    setTimeout(() => el.classList.remove('flash-highlight'), 1400);
  }, []);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={listRef} onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-1.5">
        {loading ? (
          <div className="flex flex-col gap-3 pt-4">
            {[65, 45, 75, 40, 55].map((w, i) => (
              <div key={i} className={`h-12 rounded-2xl bg-slate-200/70 dark:bg-gray-800/70 animate-pulse ${i % 2 ? 'self-end' : 'self-start'}`}
                style={{ width: `${w}%`, maxWidth: '320px' }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-3">{empty?.icon || '💬'}</span>
            <p className="text-gray-500 font-medium">{empty?.title || "Hali xabar yo'q"}</p>
            {empty?.subtitle && <p className="text-gray-400 text-sm mt-1">{empty.subtitle}</p>}
          </div>
        ) : groupByDay(messages).map(group => (
          <div key={group.key} className="space-y-1.5">
            <div className="flex justify-center py-2 sticky top-0 z-10">
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-200/80 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 backdrop-blur-sm shadow-sm">
                {group.label}
              </span>
            </div>
            {group.items.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onQuoteClick={jumpTo} {...bubbleProps(msg)} />
            ))}
          </div>
        ))}
      </div>

      {/* Pastga tushish tugmasi */}
      {showDown && (
        <button onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors msg-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
