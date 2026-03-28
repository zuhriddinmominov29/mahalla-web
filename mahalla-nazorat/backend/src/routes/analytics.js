const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, ROLES } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/overview
router.get('/overview', authenticate, authorize(ROLES.HOKIM, ROLES.DEPUTY, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const where = req.user.role === ROLES.DEPUTY ? { deputyField: req.user.deputyField } : {};
    const reportWhere = where.deputyField ? { task: { deputyField: where.deputyField } } : {};

    const [total, completed, pending, inProgress, overdue, totalReports, approvedReports, totalRais] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...where, status: 'PENDING' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...where, status: 'OVERDUE' } }),
      prisma.report.count({ where: reportWhere }),
      prisma.report.count({ where: { ...reportWhere, status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'RAIS', isActive: true } }),
    ]);

    res.json({
      tasks: { total, completed, pending, inProgress, overdue, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 },
      reports: { total: totalReports, approved: approvedReports, pending: totalReports - approvedReports },
      users: { totalRais },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xatosi.' });
  }
});

// GET /api/analytics/tasks-by-category
router.get('/tasks-by-category', authenticate, authorize(ROLES.HOKIM, ROLES.DEPUTY, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const where = req.user.role === ROLES.DEPUTY ? { deputyField: req.user.deputyField } : {};
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { tasks: { where, select: { id: true, status: true } } },
    });

    const data = categories
      .filter(cat => cat.tasks.length > 0)
      .map(cat => ({
        id: cat.id, name: cat.name, color: cat.color,
        total: cat.tasks.length,
        completed: cat.tasks.filter(t => t.status === 'COMPLETED').length,
        pending:   cat.tasks.filter(t => t.status === 'PENDING').length,
        overdue:   cat.tasks.filter(t => t.status === 'OVERDUE').length,
      }));

    res.json(data);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// GET /api/analytics/tasks-by-month
router.get('/tasks-by-month', authenticate, authorize(ROLES.HOKIM, ROLES.DEPUTY, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const where = req.user.role === ROLES.DEPUTY ? { deputyField: req.user.deputyField } : {};

    const tasks = await prisma.task.findMany({
      where: { ...where, createdAt: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      select: { createdAt: true, status: true },
    });

    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    const data = months.map((month, i) => {
      const mt = tasks.filter(t => new Date(t.createdAt).getMonth() === i);
      return { month, total: mt.length, completed: mt.filter(t => t.status === 'COMPLETED').length, overdue: mt.filter(t => t.status === 'OVERDUE').length };
    });

    res.json(data);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// GET /api/analytics/rais-performance
router.get('/rais-performance', authenticate, authorize(ROLES.HOKIM, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const raisUsers = await prisma.user.findMany({
      where: { role: 'RAIS', isActive: true },
      select: { id: true, name: true, mahalla: true, district: true,
        reports: { select: { status: true } },
        assignedTasks: { select: { status: true } },
      },
    });

    const performance = raisUsers.map(rais => {
      const totalTasks = rais.assignedTasks.length;
      const completedTasks = rais.assignedTasks.filter(t => t.status === 'COMPLETED').length;
      return {
        id: rais.id, name: rais.name, mahalla: rais.mahalla, district: rais.district,
        totalTasks, completedTasks,
        totalReports: rais.reports.length,
        approvedReports: rais.reports.filter(r => r.status === 'APPROVED').length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    res.json(performance);
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// GET /api/analytics/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

// PUT /api/analytics/notifications/read-all
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ message: "Barchasi o'qildi." });
  } catch { res.status(500).json({ message: 'Server xatosi.' }); }
});

module.exports = router;
