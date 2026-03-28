const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, ROLES } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ═══ FOYDALANUVCHILAR ════════════════════════════════════════════════════════

router.get('/users', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.HOKIM), async (req, res) => {
  try {
    const { role, district } = req.query;
    const where = {};
    if (role) where.role = role;
    if (district) where.district = district;

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, phone: true, district: true, mahalla: true, deputyField: true, isActive: true, lastLogin: true, createdAt: true, _count: { select: { reports: true, assignedTasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

router.post('/users', authenticate, authorize(ROLES.SUPER_ADMIN),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['HOKIM', 'DEPUTY', 'RAIS', 'SUPER_ADMIN']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, role, phone, district, mahalla, deputyField } = req.body;
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(400).json({ message: 'Bu email allaqachon mavjud.' });

      const user = await prisma.user.create({
        data: {
          name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12),
          role, phone, district, mahalla, deputyField: role === 'DEPUTY' ? deputyField : null,
        },
        select: { id: true, name: true, email: true, role: true, district: true, mahalla: true, deputyField: true },
      });
      res.status(201).json({ message: 'Foydalanuvchi yaratildi.', user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server xatosi.' });
    }
  }
);

router.put('/users/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { name, phone, district, mahalla, deputyField, isActive, password } = req.body;
    const data = {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(district !== undefined && { district }),
      ...(mahalla !== undefined && { mahalla }),
      ...(deputyField !== undefined && { deputyField }),
      ...(isActive !== undefined && { isActive }),
    };
    if (password?.length >= 6) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, name: true, email: true, role: true, isActive: true } });
    res.json({ message: 'Yangilandi.', user });
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

router.delete('/users/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "O'zingizni o'chirib bo'lmaydi." });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "O'chirildi." });
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// ═══ KATEGORIYALAR ═══════════════════════════════════════════════════════════

router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

router.post('/categories', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.HOKIM), async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const category = await prisma.category.create({ data: { name, description, color: color || '#3B82F6', icon } });
    res.status(201).json({ message: 'Kategoriya yaratildi.', category });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Bu nom bilan kategoriya mavjud.' });
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

// ═══ KUNLIK KONFIGURATSIYA ═══════════════════════════════════════════════════

router.get('/daily-config', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    const dateStr = d.toISOString().split('T')[0];

    const configs = await prisma.dailyConfig.findMany({
      where: { date: { gte: new Date(`${dateStr}T00:00:00.000Z`), lte: new Date(`${dateStr}T23:59:59.999Z`) } },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { order: 'asc' },
    });
    res.json(configs);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

router.post('/daily-config', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.HOKIM), async (req, res) => {
  try {
    const { categoryIds, date } = req.body;
    if (!Array.isArray(categoryIds)) return res.status(400).json({ message: 'categoryIds array bo\'lishi kerak.' });
    if (categoryIds.length > 3) return res.status(400).json({ message: 'Kunlik maksimal 3 ta yo\'nalish.' });

    const dateStr = (date ? new Date(date) : new Date()).toISOString().split('T')[0];

    await prisma.dailyConfig.deleteMany({
      where: { date: { gte: new Date(`${dateStr}T00:00:00.000Z`), lte: new Date(`${dateStr}T23:59:59.999Z`) } },
    });

    const configs = await Promise.all(
      categoryIds.map((categoryId, i) =>
        prisma.dailyConfig.create({
          data: { date: new Date(`${dateStr}T00:00:00.000Z`), categoryId, order: i + 1 },
          include: { category: { select: { id: true, name: true, color: true } } },
        })
      )
    );

    res.json({ message: 'Saqlandi.', configs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

module.exports = router;
