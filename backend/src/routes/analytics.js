const router = require('express').Router();
const db     = require('../config/supabase');
const { auth, role } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', auth, role('hokim', 'super_admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const districtId = req.user.district_id;

    // Jami raislar soni
    const { count: totalRaislar } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', districtId)
      .in('role', ['rais', 'uyushma'])
      .eq('is_active', true);

    // Bugun hisobot berganlar
    const { data: todaySubmissions } = await db
      .from('daily_submissions')
      .select('user_id')
      .eq('district_id', districtId)
      .eq('submit_date', today);

    const todayIds = new Set((todaySubmissions || []).map(s => s.user_id));

    // Aktiv vaziyatlar
    const { count: activeEmergencies } = await db
      .from('emergencies')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', districtId)
      .eq('status', 'active');

    // Jami xabarlar
    const { count: totalMessages } = await db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', districtId)
      .eq('is_report', true);

    res.json({
      success: true,
      data: {
        total_raislar:      totalRaislar || 0,
        today_submitted:    todayIds.size,
        today_not_submitted: (totalRaislar || 0) - todayIds.size,
        active_emergencies: activeEmergencies || 0,
        total_messages:     totalMessages || 0,
        submitted_today_ids: [...todayIds],
      },
    });
  } catch (err) {
    res.json({ success: false, data: {} });
  }
});

// GET /api/analytics/submissions?date=2026-06-04
router.get('/submissions', auth, role('hokim', 'super_admin'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const districtId = req.user.district_id;

    // Barcha raislar
    const { data: raislar } = await db
      .from('users')
      .select('id, full_name, role, mahalla_id, mahallas(name)')
      .eq('district_id', districtId)
      .in('role', ['rais', 'uyushma'])
      .eq('is_active', true)
      .order('role')
      .order('full_name');

    // Shu kun hisobot berganlar
    const { data: subs } = await db
      .from('daily_submissions')
      .select('user_id, created_at, message_id')
      .eq('district_id', districtId)
      .eq('submit_date', date);

    const subMap = {};
    (subs || []).forEach(s => { subMap[s.user_id] = s; });

    const result = (raislar || []).map(r => ({
      id:           r.id,
      full_name:    r.full_name,
      role:         r.role,
      mahalla_name: r.mahallas?.name || '—',
      submitted:    !!subMap[r.id],
      submitted_at: subMap[r.id]?.created_at || null,
    }));

    res.json({ success: true, data: result, date });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// GET /api/analytics/weekly — haftalik statistika
router.get('/weekly', auth, role('hokim', 'super_admin'), async (req, res) => {
  try {
    const districtId = req.user.district_id;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const { data: subs } = await db
      .from('daily_submissions')
      .select('submit_date, user_id')
      .eq('district_id', districtId)
      .gte('submit_date', days[0]);

    const byDay = {};
    days.forEach(d => { byDay[d] = new Set(); });
    (subs || []).forEach(s => {
      if (byDay[s.submit_date]) byDay[s.submit_date].add(s.user_id);
    });

    res.json({
      success: true,
      data: days.map(d => ({
        date:  d,
        count: byDay[d].size,
        label: new Date(d).toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' }),
      })),
    });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
