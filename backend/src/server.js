/**
 * BOYSUN TUMANI MAHALLA TIZIMI
 * Backend API v2.0 — Node.js + Express + Supabase
 */
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://mahallics.uz',
  'https://www.mahallics.uz',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: not allowed'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate limiting ──────────────────────────────────────────
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/', rateLimit({ windowMs: 1 * 60 * 1000, max: 200 }));

// ── Body parser ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/mahallas',  require('./routes/mahallas'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:  true,
    message:  'Mahalla Tizimi API ishlayapti',
    version:  '2.0.0',
    time:     new Date().toISOString(),
  });
});

// ── 404 ────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint topilmadi' });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Mahalla Tizimi API — http://localhost:${PORT}`);
  console.log(`📦 Supabase: ${process.env.SUPABASE_URL ? '✅' : '❌ sozlanmagan'}`);
  console.log(`🔐 JWT:      ${process.env.JWT_SECRET   ? '✅' : '❌ sozlanmagan'}\n`);
});
