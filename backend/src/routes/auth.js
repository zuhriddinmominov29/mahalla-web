const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/supabase');
const { auth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.json({ success: false, message: 'Login va parol kiriting' });

    const { data: user } = await db
      .from('users')
      .select('*, mahallas(name), districts(name)')
      .eq('username', username.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (!user)
      return res.json({ success: false, message: 'Login yoki parol noto\'g\'ri' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.json({ success: false, message: 'Login yoki parol noto\'g\'ri' });

    // last_seen yangilash
    await db.from('users').update({ last_seen: new Date() }).eq('id', user.id);

    const payload = {
      id:          user.id,
      username:    user.username,
      full_name:   user.full_name,
      role:        user.role,
      district_id: user.district_id,
      mahalla_id:  user.mahalla_id,
      mahalla_name: user.mahallas?.name || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.json({ success: true, token, user: payload });
  } catch (err) {
    console.error('Login xatosi:', err);
    res.json({ success: false, message: 'Server xatosi' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user } = await db
      .from('users')
      .select('id, username, full_name, role, district_id, mahalla_id, phone, last_seen, mahallas(name), districts(name)')
      .eq('id', req.user.id)
      .single();
    res.json({ success: true, user });
  } catch {
    res.json({ success: false });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!new_password || new_password.length < 6)
      return res.json({ success: false, message: 'Parol kamida 6 belgi' });

    const { data: user } = await db
      .from('users').select('password_hash').eq('id', req.user.id).single();

    const ok = await bcrypt.compare(old_password, user.password_hash);
    if (!ok) return res.json({ success: false, message: 'Eski parol noto\'g\'ri' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.from('users').update({ password_hash: hash }).eq('id', req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
