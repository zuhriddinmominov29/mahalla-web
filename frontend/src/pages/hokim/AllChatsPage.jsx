import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import useChat from '../../components/chat/useChat';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import { initials } from '../../components/chat/chatUtils';

export default function HokimAllChatsPage() {
  const { user } = useAuthStore();
  const [users, setUsers]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyMode, setReplyMode]   = useState('all'); // 'all' | 'selected'
  const [replyingTo, setReplyingTo] = useState(null);

  const { messages, loading, sending, send, remove, edit, markRead } =
    useChat({ user, limit: 100, autoRead: false });

  useEffect(() => {
    api.get('/users').then(r => {
      if (r.success) setUsers(r.data.filter(u => ['rais', 'uyushma'].includes(u.role)));
    });
  }, []);

  // Tanlangan rais bo'yicha filtr (клиентда — chat almashish bir zumda)
  const filtered = useMemo(() => {
    if (!selected) return messages;
    return messages.filter(m => m.sender?.id === selected ||
      (m.sender?.role === 'hokim' && (m.recipients === null || m.recipients?.includes(selected))));
  }, [messages, selected]);

  // Ochiq chatdagi xabarlarni o'qilgan deb belgilash
  useEffect(() => { markRead(filtered); }, [filtered, markRead]);

  const selectedUser = users.find(u => u.id === selected);
  const unread = uid => messages.filter(m => m.sender?.id === uid && !m.is_read).length;

  async function handleSend({ content, files }) {
    const reply = replyingTo;
    setReplyingTo(null);
    const recipients = (replyMode === 'selected' && selected) ? [selected] : null;
    return send({ content, files, replyTo: reply, recipients });
  }

  return (
    <div className="flex h-full">
      {/* Raislar ro'yxati */}
      <div className="w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Raislar ({users.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all
              ${!selected
                ? 'bg-primary-50 dark:bg-primary-600/15 border-r-2 border-primary-500'
                : 'hover:bg-slate-50 dark:hover:bg-gray-800'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
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
                    ? 'bg-primary-50 dark:bg-primary-600/15 border-r-2 border-primary-500'
                    : 'hover:bg-slate-50 dark:hover:bg-gray-800'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm
                  ${u.role === 'uyushma'
                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white'
                    : 'bg-gradient-to-br from-slate-400 to-slate-600 dark:from-gray-600 dark:to-gray-800 text-white'}`}>
                  {initials(u.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate text-xs">{u.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {u.mahallas?.name || (u.role === 'uyushma' ? 'Uyushma' : '')}
                  </div>
                </div>
                {cnt > 0 && (
                  <span className="text-[10px] font-bold bg-primary-500 text-white rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          {selected ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-gray-600 dark:to-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {initials(selectedUser?.full_name)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{selectedUser?.full_name}</div>
                <div className="text-xs text-gray-500">{selectedUser?.mahallas?.name} MFY</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">Barcha xabarlar</div>
                <div className="text-xs text-gray-500">{messages.length} ta xabar</div>
              </div>
            </>
          )}
          <div className="ml-auto flex gap-2">
            {['all', 'selected'].map(r => (
              <button key={r} onClick={() => setReplyMode(r)}
                disabled={r === 'selected' && !selected}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all disabled:opacity-40
                  ${replyMode === r
                    ? 'bg-gold-500 text-gray-950 border-gold-500 shadow-sm'
                    : 'border-slate-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-600'}`}>
                {r === 'all' ? '👥 Hammaga' : '👤 Faqat shu raisga'}
              </button>
            ))}
          </div>
        </div>

        <MessageList
          messages={filtered}
          loading={loading}
          empty={{ icon: '📭', title: "Xabar yo'q" }}
          bubbleProps={msg => {
            const mine = msg.sender?.id === user.id;
            return {
              mine,
              senderLine: !mine
                ? `${msg.sender?.full_name}${msg.sender?.mahallas?.name ? ' · ' + msg.sender.mahallas.name : ''}`
                : null,
              onReply: setReplyingTo,
              onDelete: mine ? remove : null,
              onEdit: mine ? edit : null,
            };
          }}
        />

        <ChatInput
          onSend={handleSend}
          sending={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          placeholder={replyMode === 'all'
            ? 'Barcha raislar uchun xabar...'
            : `${selectedUser?.full_name || 'Rais'} uchun xabar...`}
        />
      </div>
    </div>
  );
}
