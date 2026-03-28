const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { upload, processAndUploadImages } = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { taskId, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (req.user.role === ROLES.RAIS) where.userId = req.user.id;
    else if (req.user.role === ROLES.DEPUTY) where.task = { deputyField: req.user.deputyField };

    if (taskId) where.taskId = taskId;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, mahalla: true } },
          task: { select: { id: true, title: true, type: true, category: { select: { name: true, color: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit),
      }),
      prisma.report.count({ where }),
    ]);

    res.json({ reports, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

// GET /api/reports/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, mahalla: true, phone: true } },
        task: { include: { category: true, createdBy: { select: { id: true, name: true } } } },
      },
    });
    if (!report) return res.status(404).json({ message: 'Hisobot topilmadi.' });
    res.json(report);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// POST /api/reports  (faqat RAIS)
router.post('/', authenticate, authorize(ROLES.RAIS),
  upload.array('images', 4),
  [
    body('taskId').notEmpty().withMessage('Topshiriq ID kiritilishi shart'),
    body('description').trim().notEmpty().withMessage('Hisobot matni kiritilishi shart'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { taskId, description, latitude, longitude, locationName } = req.body;

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return res.status(404).json({ message: 'Topshiriq topilmadi.' });
      if (task.status === 'CANCELLED') return res.status(400).json({ message: "Bekor qilingan topshiriqqa hisobot yuborib bo'lmaydi." });

      // ─── Rasmlarni yuklash ────────────────────────────────────────────────
      let imageUrls = [];
      if (req.files?.length > 0) {
        const uploaded = await processAndUploadImages(req.files);
        imageUrls = uploaded.map(img => img.url);
      }

      const report = await prisma.report.create({
        data: {
          taskId, userId: req.user.id, description,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          locationName,
          images: imageUrls,
        },
        include: {
          user: { select: { id: true, name: true, mahalla: true } },
          task: { select: { id: true, title: true } },
        },
      });

      // Topshiriqni IN_PROGRESS ga o'tkazish
      if (task.status === 'PENDING')
        await prisma.task.update({ where: { id: taskId }, data: { status: 'IN_PROGRESS' } });

      // Hokimga xabarnoma
      const io = req.app.get('io');
      if (io) {
        io.emit('report:submitted', { report });
        const admins = await prisma.user.findMany({ where: { role: { in: ['HOKIM', 'DEPUTY'] } }, select: { id: true } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: { userId: admin.id, title: 'Yangi hisobot', message: `${req.user.name} "${task.title}" bo'yicha hisobot yubordi.`, type: 'info', taskId },
          });
          io.to(`user:${admin.id}`).emit('notification:new', { message: `Yangi hisobot: ${task.title}` });
        }
      }

      res.status(201).json({ message: 'Hisobot yuborildi.', report });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server xatosi.' });
    }
  }
);

// PUT /api/reports/:id/review  (HOKIM, DEPUTY)
router.put('/:id/review', authenticate, authorize(ROLES.HOKIM, ROLES.DEPUTY, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED', 'REVIEWED'].includes(status))
      return res.status(400).json({ message: "Noto'g'ri status." });

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, reviewNote, reviewedById: req.user.id, reviewedAt: new Date() },
      include: { user: { select: { id: true, name: true } }, task: { select: { id: true, title: true } } },
    });

    if (status === 'APPROVED')
      await prisma.task.update({ where: { id: report.taskId }, data: { status: 'COMPLETED', completedAt: new Date() } });

    // Raisga xabarnoma
    const io = req.app.get('io');
    if (io) {
      const statusText = status === 'APPROVED' ? 'Tasdiqlandi ✅' : status === 'REJECTED' ? 'Rad etildi ❌' : "Ko'rib chiqildi";
      await prisma.notification.create({
        data: { userId: report.userId, title: `Hisobot ${statusText}`, message: `"${report.task.title}" hisobotingiz ${statusText}.`, type: status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'info', taskId: report.taskId },
      });
      io.to(`user:${report.userId}`).emit('notification:new', { message: `Hisobot ${statusText}` });
    }

    res.json({ message: 'Hisobot yangilandi.', report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

module.exports = router;
