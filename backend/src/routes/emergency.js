const router = require('express').Router();
const db     = require('../config/supabase');
const { auth, role } = require('../middleware/auth');

// GET /api/emergency — barcha aktiv vaziyatlar
router.get('/', auth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    let query = db
      .from('emergencies')
      .select(`
        id, types, description, severity, casualties, status, created_at, resolved_at,
        mahallas(id, name, order_num),
        reporter:users!reporter_id(id, full_name, role)
      `)
      .eq('district_id', req.user.district_id)
      .order('created_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// GET /api/emergency/by-mahalla — har bir mahalla uchun aktiv vaziyat
router.get('/by-mahalla', auth, async (req, res) => {
  try {
    const { data: mahallas } = await db
      .from('mahallas')
      .select('id, name, order_num')
      .eq('district_id', req.user.district_id)
      .eq('is_active', true)
      .order('order_num');

    const { data: active } = await db
      .from('emergencies')
      .select('id, mahalla_id, types, severity, casualties, description, created_at')
      .eq('district_id', req.user.district_id)
      .eq('status', 'active');

    const activeMap = {};
    (active || []).forEach(e => {
      if (!activeMap[e.mahalla_id]) activeMap[e.mahalla_id] = [];
      activeMap[e.mahalla_id].push(e);
    });

    const result = (mahallas || []).map(m => ({
      ...m,
      emergencies: activeMap[m.id] || [],
      has_emergency: !!(activeMap[m.id]?.length),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/emergency — yangi vaziyat xabari
router.post('/', auth, role('rais', 'uyushma'), async (req, res) => {
  try {
    const { types, description, severity, casualties } = req.body;

    if (!types || !types.length)
      return res.json({ success: false, message: 'Vaziyat turini tanlang' });

    const { data, error } = await db
      .from('emergencies')
      .insert({
        district_id: req.user.district_id,
        mahalla_id:  req.user.mahalla_id,
        reporter_id: req.user.id,
        types,
        description: description || '',
        severity:    severity || 'medium',
        casualties:  Number(casualties) || 0,
        status:      'active',
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// PATCH /api/emergency/:id/resolve — hal qilindi
router.patch('/:id/resolve', auth, role('hokim', 'super_admin'), async (req, res) => {
  try {
    await db.from('emergencies').update({
      status:      'resolved',
      resolved_at: new Date(),
    }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// DELETE /api/emergency/:id
router.delete('/:id', auth, role('super_admin'), async (req, res) => {
  try {
    await db.from('emergencies').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
