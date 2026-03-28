const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage("Email noto'g'ri"),
    body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 belgi'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ message: "Email yoki parol noto'g'ri." });

      if (!user.isActive)
        return res.status(403).json({ message: 'Hisob bloklangan. Admin bilan bog\'laning.' });

      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

      res.json({
        token: generateToken(user.id),
        user: { id: user.id, name: user.name, email: user.email, role: user.role, district: user.district, mahalla: user.mahalla, deputyField: user.deputyField, avatar: user.avatar },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server xatosi.' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, district: true, mahalla: true, deputyField: true, avatar: true, lastLogin: true, createdAt: true },
    });
    res.json(user);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });

      if (!(await bcrypt.compare(currentPassword, user.password)))
        return res.status(400).json({ message: "Joriy parol noto'g'ri." });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: await bcrypt.hash(newPassword, 12) },
      });
      res.json({ message: 'Parol o\'zgartirildi.' });
    } catch { res.status(500).json({ message: 'Server xatosi.' }); }
  }
);

module.exports = router;
