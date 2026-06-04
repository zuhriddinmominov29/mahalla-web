const router = require('express').Router();
const db     = require('../config/supabase');
const { auth, role } = require('../middleware/auth');

// GET /api/mahallas
router.get('/', auth, async (req, res) => {
  try {
    const { data } = await db
      .from('mahallas')
      .select('id, name, order_num, is_active')
      .eq('district_id', req.user.district_id)
      .order('order_num');
    res.json({ success: true, data: data || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
});

// POST /api/mahallas
router.post('/', auth, role('super_admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.json({ success: false, message: 'Mahalla nomi kerak' });

    // Eng katta order_num + 1
    const { data: last } = await db
      .from('mahallas')
      .select('order_num')
      .eq('district_id', req.user.district_id)
      .order('order_num', { ascending: false })
      .limit(1);

    const nextNum = (last?.[0]?.order_num || 0) + 1;

    const { data, error } = await db.from('mahallas').insert({
      district_id: req.user.district_id,
      name:        name.trim(),
      order_num:   nextNum,
    }).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// PUT /api/mahallas/:id
router.put('/:id', auth, role('super_admin'), async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};
    if (name      !== undefined) updates.name      = name.trim();
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await db
      .from('mahallas').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// DELETE /api/mahallas/:id
router.delete('/:id', auth, role('super_admin'), async (req, res) => {
  try {
    await db.from('mahallas').update({ is_active: false }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
