require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes     = require('./routes/auth');
const taskRoutes     = require('./routes/tasks');
const reportRoutes   = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes    = require('./routes/admin');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] },
});

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'So\'rovlar chegarasi oshdi. 15 daqiqadan so\'ng urinib ko\'ring.' },
}));

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.io ni route larga uzatish
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/health', (req, res) => res.json({ status: '✅ OK', time: new Date().toISOString() }));
app.get('/',       (req, res) => res.json({ message: '🇺🇿 Mahalla Nazorat API v1.0' }));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Topilmadi: ${req.method} ${req.url}` }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ message: 'Fayl hajmi juda katta (max 10MB).' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Maksimal 4 ta rasm.' });
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server xatosi.' });
});

// ─── Socket.io events ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => socket.join(`user:${userId}`));
  socket.on('disconnect', () => {});
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`📡 Env: ${process.env.NODE_ENV || 'development'}\n`);
});
