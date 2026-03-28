const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, ROLES } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, category, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (req.user.role === ROLES.RAIS) {
      where.OR = [{ assignedToId: req.user.id }, { mahalla: req.user.mahalla }];
    } else if (req.user.role === ROLES.DEPUTY) {
      where.deputyField = req.user.deputyField;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.categoryId = category;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true, mahalla: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          reports: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.task.count({ where }),
    ]);

    // Muddati o'tgan topshiriqlarni yangilash
    const now = new Date();
    const overdueIds = tasks
      .filter(t => t.deadline && new Date(t.deadline) < now && t.status === 'PENDING')
      .map(t => t.id);
    if (overdueIds.length > 0)
      await prisma.task.updateMany({ where: { id: { in: overdueIds } }, data: { status: 'OVERDUE' } });

    res.json({ tasks, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        assignedTo: { select: { id: true, name: true, email: true, phone: true, mahalla: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        reports: {
          include: { user: { select: { id: true, name: true, mahalla: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!task) return res.status(404).json({ message: 'Topshiriq topilmadi.' });
    res.json(task);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// POST /api/tasks  (faqat HOKIM va SUPER_ADMIN)
router.post('/', authenticate, authorize(ROLES.HOKIM, ROLES.SUPER_ADMIN),
  [
    body('title').trim().notEmpty().withMessage('Sarlavha kiritilishi shart'),
    body('type').isIn(['PERMANENT', 'ONE_TIME']).withMessage("Noto'g'ri tur"),
    body('categoryId').notEmpty().withMessage('Kategoriya tanlanishi shart'),
    body('deadline').if(body('type').equals('PERMANENT')).notEmpty().withMessage('Doimiy topshiriqda muddat majburiy'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description, type, deadline, priority, categoryId, assignedToId, district, mahalla, deputyField } = req.body;

      const task = await prisma.task.create({
        data: {
          title, description, type,
          deadline: deadline ? new Date(deadline) : null,
          priority: priority || 'MEDIUM',
          categoryId,
          assignedToId: assignedToId || null,
          createdById: req.user.id,
          district, mahalla, deputyField,
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true, mahalla: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      // Real-time xabarnoma
      const io = req.app.get('io');
      if (io) {
        io.emit('task:created', { task });
        if (assignedToId) {
          await prisma.notification.create({
            data: { userId: assignedToId, title: 'Yangi topshiriq', message: `"${title}" topshirig'i tayinlandi.`, type: 'info', taskId: task.id },
          });
          io.to(`user:${assignedToId}`).emit('notification:new', { message: `Yangi topshiriq: ${title}` });
        }
      }

      res.status(201).json({ message: 'Topshiriq yaratildi.', task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server xatosi.' });
    }
  }
);

// PUT /api/tasks/:id
router.put('/:id', authenticate, authorize(ROLES.HOKIM, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { title, description, type, deadline, priority, status, categoryId, assignedToId, deputyField } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(deputyField !== undefined && { deputyField }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: { category: true, assignedTo: { select: { id: true, name: true } } },
    });

    const io = req.app.get('io');
    if (io) io.emit('task:updated', { task });

    res.json({ message: 'Topshiriq yangilandi.', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, authorize(ROLES.HOKIM, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: "Topshiriq o'chirildi." });
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

module.exports = router;
