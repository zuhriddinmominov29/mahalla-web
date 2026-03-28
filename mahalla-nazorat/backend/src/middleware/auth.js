const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Token mavjud emas. Tizimga kiring.' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, district: true, mahalla: true, deputyField: true, isActive: true },
    });

    if (!user)       return res.status(401).json({ message: 'Foydalanuvchi topilmadi.' });
    if (!user.isActive) return res.status(403).json({ message: 'Hisob bloklangan.' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Token muddati tugagan. Qayta kiring.' });
    return res.status(401).json({ message: "Noto'g'ri token." });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Bu amal uchun ruxsat yo\'q.' });
  next();
};

const ROLES = { SUPER_ADMIN: 'SUPER_ADMIN', HOKIM: 'HOKIM', DEPUTY: 'DEPUTY', RAIS: 'RAIS' };

module.exports = { authenticate, authorize, ROLES };
