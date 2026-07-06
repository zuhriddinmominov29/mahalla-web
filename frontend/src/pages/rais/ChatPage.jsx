import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import useChat from '../../components/chat/useChat';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';

function getLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null), { timeout: 5000, maximumAge: 60000 }
    );
  });
}

export default function RaisChatPage() {
  const { user } = useAuthStore();
  const [replyingTo, setReplyingTo] = useState(null);
  const { messages, loading, sending, send, remove, edit } = useChat({ user, limit: 50 });

  const isMine      = m => m.sender?.id === user.id;
  const isFromHokim = m => m.sender?.role === 'hokim';

  async function handleSend({ content, files }) {
    const reply = replyingTo;
    setReplyingTo(null);
    // joylashuv so'rovi yuborishni bloklamaydi — promise sifatida uzatiladi
    return send({ content, files, replyTo: reply, location: getLocation() });
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-lg shadow-sm">📋</div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-white text-sm">Hisobotlar</div>
          <div className="text-xs text-gray-500">Hokimga kunlik hisobot yuboring</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-500">Jonli</span>
        </div>
      </div>

      <MessageList
        messages={messages}
        loading={loading}
        empty={{ icon: '💬', title: "Hali hisobot yo'q", subtitle: 'Bugungi hisobotingizni yuboring' }}
        bubbleProps={msg => ({
          mine: isMine(msg),
          accent: isFromHokim(msg),
          senderLine: !isMine(msg)
            ? (isFromHokim(msg) ? '🏛️ Hokim' : msg.sender?.full_name)
            : null,
          onReply: setReplyingTo,
          onDelete: isMine(msg) ? remove : null,
          onEdit: isMine(msg) ? edit : null,
        })}
      />

      <ChatInput
        onSend={handleSend}
        sending={sending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder="Hisobotingizni yozing..."
      />
    </div>
  );
}
