// Chat uchun umumiy yordamchi funksiyalar

export function timeOf(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const strip = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((strip(now) - strip(d)) / 86400000);
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  const year = d.getFullYear() === now.getFullYear() ? '' : `, ${d.getFullYear()}`;
  return `${d.getDate()}-${MONTHS[d.getMonth()]}${year}`;
}

// Xabarlarni kun bo'yicha guruhlash → [{ key, label, items }]
export function groupByDay(messages) {
  const groups = [];
  for (const msg of messages) {
    const key = new Date(msg.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(msg);
    else groups.push({ key, label: dayLabel(msg.created_at), items: [msg] });
  }
  return groups;
}

// Reply-quote uchun qisqa matn
export function replyPreviewText(msg) {
  if (!msg) return "O'chirilgan xabar";
  if (msg.message_type === 'hidden') return '💬 Xabar';
  if (msg.content) return msg.content;
  if (msg.message_type === 'image') return '📷 Rasm';
  if (msg.message_type === 'file') return '📎 Fayl';
  return '📎 Biriktirma';
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '•';
}
