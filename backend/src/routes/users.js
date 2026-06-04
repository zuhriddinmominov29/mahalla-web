const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../config/supabase');
const { auth, role } = require('../middleware/auth');

// GET /api/users
router.get('/', auth, role('super_admin', 'hokim'), async (req, res) => {
  try {
    const { data } = await db
      .from('users')
      .select('id, full_name, username, role, phone, is_active, last_seen, mahalla_id, district_id, mahallas(name), districts(name)')
      .eq('district_id', req.user.district_id)
      .neq('role', 'super_admin')
      .order('role').order('full_name');
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/users — yangi foydalanuvchi
router.post('/', auth, role('super_admin'), async (req, res) => {
  try {
    const { full_name, username, password, role: userRole, mahalla_id, phone } = req.body;

    if (!full_name || !username || !password)
      return res.json({ success: false, message: 'Majburiy maydonlar to\'ldirilmagan' });

    const { data: existing } = await db
      .from('users').select('id').eq('username', username.toLowerCase()).single();
    if (existing)
      return res.json({ success: false, message: 'Bu username allaqachon mavjud' });

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await db.from('users').insert({
      district_id:   req.user.district_id,
      mahalla_id:    mahalla_id || null,
      role:          userRole || 'rais',
      full_name:     full_name.trim(),
      username:      username.trim().toLowerCase(),
      password_hash: hash,
      phone:         phone || null,
    }).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id — ma'lumotlarni yangilash
router.put('/:id', auth, role('super_admin'), async (req, res) => {
  try {
    const { full_name, username, mahalla_id, phone, is_active } = req.body;
    const updates = {};
    if (full_name  !== undefined) updates.full_name  = full_name.trim();
    if (username   !== undefined) updates.username   = username.trim().toLowerCase();
    if (mahalla_id !== undefined) updates.mahalla_id = mahalla_id;
    if (phone      !== undefined) updates.phone      = phone;
    if (is_active  !== undefined) updates.is_active  = is_active;

    const { data, error } = await db
      .from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id/password — parol o'zgartirish (super_admin)
router.put('/:id/password', auth, role('super_admin'), async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 4)
      return res.json({ success: false, message: 'Parol kamida 4 belgi' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.from('users').update({ password_hash: hash }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, role('super_admin'), async (req, res) => {
  try {
    await db.from('users').update({ is_active: false }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
