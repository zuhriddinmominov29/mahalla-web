const router  = require('express').Router();
const multer  = require('multer');
const db      = require('../config/supabase');
const { auth, role } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// GET /api/messages?limit=30&before=<timestamp>
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 30, before } = req.query;
    const districtId = req.user.district_id;

    let query = db
      .from('messages')
      .select(`
        id, content, message_type, recipients, is_report, created_at,
        sender:users!sender_id(id, full_name, role, mahalla_id, mahallas(name)),
        attachments(id, url, name, mime_type, size_bytes)
      `)
      .eq('district_id', districtId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) query = query.lt('created_at', before);

    // Rais faqat o'z xabarlarini + hokimning barcha/o'ziga yuborilgan xabarlarini ko'radi
    if (req.user.role === 'rais' || req.user.role === 'uyushma') {
      query = query.or(
        `sender_id.eq.${req.user.id},` +
        `and(recipients.is.null,sender_id.neq.${req.user.id}),` +
        `recipients.cs.{${req.user.id}}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    // O'qilgan/o'qilmaganlarni belgilash
    const ids = (data || []).map(m => m.id);
    let readSet = new Set();
    if (ids.length) {
      const { data: reads } = await db
        .from('message_reads')
        .select('message_id')
        .eq('user_id', req.user.id)
        .in('message_id', ids);
      readSet = new Set((reads || []).map(r => r.message_id));
    }

    const messages = (data || []).map(m => ({
      ...m,
      is_read: readSet.has(m.id),
    })).reverse();

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Messages xatosi:', err);
    res.json({ success: true, data: [] });
  }
});

// POST /api/messages — xabar yuborish
router.post('/', auth, upload.array('files', 5), async (req, res) => {
  try {
    const { content, recipients } = req.body;
    if (!content && (!req.files || req.files.length === 0))
      return res.json({ success: false, message: 'Xabar matni yoki fayl kerak' });

    // Faqat hokim recipients belgilashi mumkin
    let parsedRecipients = null;
    if (req.user.role === 'hokim' && recipients) {
      try { parsedRecipients = JSON.parse(recipients); } catch {}
    }

    // Message type aniqlash
    let msgType = 'text';
    if (req.files?.length > 0) {
      const types = req.files.map(f => f.mimetype.split('/')[0]);
      if (types.every(t => t === 'image')) msgType = 'image';
      else if (content) msgType = 'mixed';
      else msgType = 'file';
    }

    const { data: message, error } = await db
      .from('messages')
      .insert({
        district_id:  req.user.district_id,
        sender_id:    req.user.id,
        content:      content || null,
        message_type: msgType,
        recipients:   parsedRecipients,
        is_report:    ['rais', 'uyushma'].includes(req.user.role),
      })
      .select()
      .single();

    if (error) throw error;

    // Fayl/rasmlarni Supabase Storage ga yuklash
    const attachments = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const ext  = file.originalname.split('.').pop();
        const path = `${req.user.district_id}/${message.id}/${Date.now()}.${ext}`;

        const { error: upErr } = await db.storage
          .from('mahalla-files')
          .upload(path, file.buffer, { contentType: file.mimetype });

        if (!upErr) {
          const { data: { publicUrl } } = db.storage
            .from('mahalla-files').getPublicUrl(path);

          const { data: att } = await db.from('attachments').insert({
            message_id: message.id,
            url:        publicUrl,
            name:       file.originalname,
            mime_type:  file.mimetype,
            size_bytes: file.size,
          }).select().single();

          attachments.push(att);
        }
      }
    }

    // Daily submission yozish (rais/uyushma uchun)
    if (['rais', 'uyushma'].includes(req.user.role)) {
      await db.from('daily_submissions').upsert({
        district_id: req.user.district_id,
        user_id:     req.user.id,
        mahalla_id:  req.user.mahalla_id,
        message_id:  message.id,
        submit_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id,submit_date' });
    }

    res.json({ success: true, data: { ...message, attachments } });
  } catch (err) {
    console.error('Xabar yuborish xatosi:', err);
    res.json({ success: false, message: err.message });
  }
});

// POST /api/messages/:id/read — o'qildi deb belgilash
router.post('/:id/read', auth, async (req, res) => {
  try {
    await db.from('message_reads').upsert({
      message_id: req.params.id,
      user_id:    req.user.id,
    }, { onConflict: 'message_id,user_id' });
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// GET /api/messages/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { count } = await db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', req.user.district_id)
      .not('id', 'in',
        db.from('message_reads').select('message_id').eq('user_id', req.user.id)
      );
    res.json({ success: true, count: count || 0 });
  } catch {
    res.json({ success: true, count: 0 });
  }
});

module.exports = router;
