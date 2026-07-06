import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';

/**
 * Telegram uslubidagi tezkor chat logikasi:
 *  - optimistik yuborish / o'chirish / tahrirlash
 *  - real-time'da to'liq qayta yuklamasdan bitta xabarni qo'shish/yangilash/olib tashlash
 *  - reply (javob) qo'llab-quvvatlash
 */
export default function useChat({ user, limit = 50, autoRead = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const msgsRef = useRef([]);
  const readRef = useRef(new Set()); // read yuborilgan xabar IDlari

  useEffect(() => { msgsRef.current = messages; }, [messages]);

  const markRead = useCallback((msgs) => {
    const targets = (msgs || []).filter(m =>
      m.sender?.id !== user.id && !m.is_read &&
      !readRef.current.has(m.id) && !String(m.id).startsWith('temp-'));
    if (!targets.length) return;
    const ids = new Set(targets.map(m => m.id));
    targets.forEach(m => readRef.current.add(m.id));
    setMessages(prev => prev.map(m => ids.has(m.id) ? { ...m, is_read: true } : m));
    targets.forEach(m => api.post(`/messages/${m.id}/read`).catch(() => {}));
  }, [user.id]);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/messages?limit=${limit}`);
      if (res.success) {
        setMessages(res.data);
        if (autoRead) markRead(res.data);
      }
    } catch { /* tarmoq xatosi — eski ro'yxat qoladi */ }
    finally { setLoading(false); }
  }, [limit, autoRead, markRead]);

  // Real-time: yangi xabarni alohida olib kelib qo'shish (to'liq reload YO'Q)
  const fetchAndAppend = useCallback(async (id) => {
    if (msgsRef.current.some(m => m.id === id)) return;
    // biriktirmalar yuklanib bo'lishi uchun qisqa kutish
    await new Promise(r => setTimeout(r, 600));
    if (msgsRef.current.some(m => m.id === id)) return;
    try {
      const res = await api.get(`/messages/${id}`);
      if (!res.success || !res.data) return;
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        const next = [...prev, res.data];
        next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return next;
      });
      if (autoRead) markRead([res.data]);
    } catch { /* ko'rinmas xabar yoki tarmoq — e'tiborsiz */ }
  }, [autoRead, markRead]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`chat-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `district_id=eq.${user.district_id}` }, payload => {
        // o'zim yuborganim optimistik ro'yxatda bor — dublikatdan saqlanamiz
        if (payload.new?.sender_id === user.id &&
            msgsRef.current.some(m => String(m.id).startsWith('temp-'))) return;
        fetchAndAppend(payload.new?.id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `district_id=eq.${user.district_id}` }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new?.id
          ? { ...m, content: payload.new.content, is_edited: payload.new.is_edited }
          : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        payload => {
          const oldId = payload.old?.id;
          if (oldId) setMessages(prev => prev.filter(m => m.id !== oldId));
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, fetchAndAppend, user.id, user.district_id]);

  /** Optimistik yuborish. location — promise yoki obyekt bo'lishi mumkin. */
  const send = useCallback(async ({ content, files = [], recipients = null, replyTo = null, location = null }) => {
    const text = (content || '').trim();
    if (!text && !files.length) return false;

    const tempId = 'temp-' + Date.now();
    const optimistic = {
      id: tempId,
      content: text || null,
      created_at: new Date().toISOString(),
      sender: { id: user.id, full_name: user.full_name, role: user.role },
      attachments: files.map((f, i) => ({
        id: `temp-att-${i}`, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        name: f.name, mime_type: f.type,
      })),
      reply_to: replyTo?.id || null,
      reply: replyTo ? { id: replyTo.id, content: replyTo.content, message_type: replyTo.message_type, sender: replyTo.sender } : null,
      _sending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setSending(true);

    try {
      const loc = location ? await location : null;
      const form = new FormData();
      if (text) form.append('content', text);
      files.forEach(f => form.append('files', f));
      if (recipients) form.append('recipients', JSON.stringify(recipients));
      if (replyTo?.id) form.append('reply_to', replyTo.id);
      if (loc) {
        form.append('latitude', loc.latitude);
        form.append('longitude', loc.longitude);
        form.append('accuracy', loc.accuracy);
      }
      const res = await api.post('/messages', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!res.success) throw new Error(res.message || 'Xabar yuborilmadi');

      const real = {
        ...res.data,
        sender: optimistic.sender,
        attachments: res.data.attachments?.length ? res.data.attachments : [],
        reply: res.data.reply || optimistic.reply,
      };
      setMessages(prev => prev.filter(m => m.id !== real.id).map(m => m.id === tempId ? real : m));
      return true;
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(e.message || 'Tarmoq xatosi');
      return false;
    } finally { setSending(false); }
  }, [user]);

  /** Optimistik o'chirish — xato bo'lsa qaytariladi. */
  const remove = useCallback(async (id) => {
    const snapshot = msgsRef.current;
    setMessages(prev => prev.filter(m => m.id !== id));
    try {
      const res = await api.delete(`/messages/${id}`);
      if (!res.success) throw new Error(res.message);
      toast.success("Xabar o'chirildi");
    } catch (e) {
      toast.error(e.message || "O'chirib bo'lmadi");
      setMessages(snapshot);
    }
  }, []);

  /** Optimistik tahrirlash — xato bo'lsa eski matn qaytadi. */
  const edit = useCallback(async (id, text) => {
    const t = (text || '').trim();
    if (!t) return false;
    const prevMsg = msgsRef.current.find(m => m.id === id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: t, is_edited: true } : m));
    try {
      const res = await api.patch(`/messages/${id}`, { content: t });
      if (!res.success) throw new Error(res.message);
      return true;
    } catch (e) {
      toast.error(e.message || "Tahrirlab bo'lmadi");
      if (prevMsg) setMessages(prev => prev.map(m => m.id === id ? prevMsg : m));
      return false;
    }
  }, []);

  return { messages, loading, sending, send, remove, edit, markRead, reload: load };
}
