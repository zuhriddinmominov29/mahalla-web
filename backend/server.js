/**
 * MAHALLA TIZIMI — BACKEND SERVER v2.0
 * Node.js + Express + MongoDB + Cloudinary + Web Push
 */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const path       = require('path');
const webpush    = require('web-push');
const ImageKit   = require('imagekit');

const app = express();

// ============================================================
// IMAGEKIT SOZLASH
// ============================================================
const imagekit = new ImageKit({
  publicKey:  process.env.IMAGEKIT_PUBLIC_KEY  || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// ============================================================
// WEB PUSH (VAPID) SOZLASH
// ============================================================
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@mahalla.uz'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..')));

const JWT_SECRET = process.env.JWT_SECRET || 'mahalla-secret-2026';
const PORT       = process.env.PORT       || 3001;
const MONGO_URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/mahalla';

// ============================================================
// MONGODB ULANISH
// ============================================================
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ MongoDB ga ulandi:', MONGO_URI.split('@').pop()))
  .catch(err => {
    console.error('❌ MongoDB xatosi:', err.message);
    process.exit(1);
  });

// ============================================================
// MONGOOSE MODELLARI
// ============================================================
const userSchema = new mongoose.Schema({
  uid:      { type: Number, unique: true },
  login:    { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  mahalla:  { type: String, default: '' },
  district: { type: String, default: '' },
  phone:    { type: String, default: '' },
  role:     { type: String, enum: ['admin','rais'], default: 'rais' },
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  raisId:      { type: Number, required: true },
  raisName:    { type: String, default: '' },
  mahalla:     { type: String, default: '' },
  district:    { type: String, default: '' },
  reportType:  { type: String, default: 'daily' },
  reportDate:  { type: String, required: true },
  reportTitle: { type: String, required: true },
  ind1: { type: Number, default: 0 },
  ind2: { type: Number, default: 0 },
  ind3: { type: Number, default: 0 },
  ind4: { type: Number, default: 0 },
  ind5: { type: Number, default: 0 },
  ind6: { type: Number, default: 0 },
  content:     { type: String, default: '' },
  issues:      { type: String, default: '' },
  submittedAt: { type: String, default: () => new Date().toISOString() },
  month:       { type: Number },
  year:        { type: Number },
  taskId:      { type: String, default: null },
  latitude:    { type: Number, default: null },
  longitude:   { type: Number, default: null },
  photos:      [{ type: String }],  // Cloudinary URL lar
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  deadline:    { type: String, default: '' },
  assignedTo:  { type: mongoose.Schema.Types.Mixed, default: 'all' },
  isHokimiyat: { type: Boolean, default: false },
  priority:    { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  status:      { type: String, enum: ['active','closed'], default: 'active' },
  createdAt:   { type: String, default: () => new Date().toISOString() },
  createdBy:   { type: String, default: 'admin' },
});

// Push notification subscriptions
const pushSubSchema = new mongoose.Schema({
  raisId:       { type: Number, required: true, unique: true },
  subscription: { type: Object, required: true },
  updatedAt:    { type: Date, default: Date.now },
});

const User     = mongoose.model('User',        userSchema);
const Report   = mongoose.model('Report',      reportSchema);
const Task     = mongoose.model('Task',        taskSchema);
const PushSub  = mongoose.model('PushSub',     pushSubSchema);

// ============================================================
// MULTER — xotiraga yuklash (Cloudinary ga jo'natish uchun)
// ============================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Faqat rasm fayllari qabul qilinadi'));
  },
});

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Token kerak' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token yaroqsiz yoki muddati o'tgan" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Faqat admin uchun' });
  }
  next();
}

// ============================================================
// YORDAMCHI: Push notification yuborish
// ============================================================
async function sendPushToRaislar(assignedTo, taskData) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    let subs;
    if (assignedTo === 'all') {
      subs = await PushSub.find({});
    } else if (Array.isArray(assignedTo)) {
      subs = await PushSub.find({ raisId: { $in: assignedTo } });
    } else {
      return;
    }

    const payload = JSON.stringify({
      title: '📋 Yangi topshiriq!',
      body:  taskData.title,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag:   'new-task',
      data:  { url: '/rais.html#tasks' },
    });

    const results = await Promise.allSettled(
      subs.map(s => webpush.sendNotification(s.subscription, payload))
    );

    // O'chirilgan subscriptionlarni tozalash
    results.forEach(async (r, i) => {
      if (r.status === 'rejected' && subs[i]) {
        const code = r.reason?.statusCode;
        if (code === 404 || code === 410) {
          await PushSub.deleteOne({ raisId: subs[i].raisId });
        }
      }
    });
  } catch (err) {
    console.error('Push xatosi:', err.message);
  }
}

// ============================================================
// ===== AUTH ROUTES =====
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.json({ success: false, message: 'Login va parol kiriting!' });
    }
    const user = await User.findOne({ login: login.trim() });
    if (!user || user.password !== password.trim()) {
      return res.json({ success: false, message: "Login yoki parol noto'g'ri!" });
    }

    const payload = {
      id:       user.uid,
      login:    user.login,
      fullName: user.fullName,
      mahalla:  user.mahalla,
      district: user.district,
      phone:    user.phone,
      role:     user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      success: true,
      token,
      role: user.role,
      user: { ...payload, expiry: Date.now() + 8 * 3600000 },
    });
  } catch (err) {
    res.json({ success: false, message: 'Server xatosi!' });
  }
});

app.post('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.json({ success: false, message: "Ruxsat yo'q" });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.json({ success: false, message: 'Parol kamida 4 ta belgidan iborat bo\'lsin' });
    }
    await User.updateOne({ uid: userId }, { password: newPassword });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============================================================
// ===== RASM YUKLASH (IMAGEKIT) =====
// ============================================================
app.post('/api/upload', auth, upload.array('photos', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: "Rasm tanlanmagan" });
    }

    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      return res.json({ success: false, message: 'ImageKit sozlanmagan' });
    }

    const urls = await Promise.all(req.files.map((file, i) => {
      const fileName = `report_${Date.now()}_${i}${path.extname(file.originalname) || '.jpg'}`;
      return imagekit.upload({
        file:   file.buffer,
        fileName,
        folder: '/mahalla-reports',
        useUniqueFileName: true,
      }).then(result => result.url);
    }));

    res.json({ success: true, urls });
  } catch (err) {
    console.error('Upload xatosi:', err.message);
    res.json({ success: false, message: 'Rasm yuklanmadi: ' + err.message });
  }
});

// ============================================================
// ===== PUSH NOTIFICATION =====
// ============================================================

// VAPID public key olish
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Subscription saqlash
app.post('/api/push/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.json({ success: false });

    await PushSub.findOneAndUpdate(
      { raisId: req.user.id },
      { raisId: req.user.id, subscription, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Subscription o'chirish
app.post('/api/push/unsubscribe', auth, async (req, res) => {
  try {
    await PushSub.deleteOne({ raisId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// ============================================================
// ===== HISOBOTLAR =====
// ============================================================
app.post('/api/reports', auth, async (req, res) => {
  try {
    const user = req.user;
    const now  = new Date();
    const data = req.body;

    const photos = (data.photos || []).slice(0, 3);

    const report = new Report({
      raisId:      user.id,
      raisName:    user.fullName,
      mahalla:     user.mahalla,
      district:    user.district || '',
      reportType:  data.reportType  || 'daily',
      reportDate:  data.reportDate  || now.toISOString().split('T')[0],
      reportTitle: data.reportTitle || '',
      ind1: parseInt(data.ind1) || 0,
      ind2: parseInt(data.ind2) || 0,
      ind3: parseInt(data.ind3) || 0,
      ind4: parseInt(data.ind4) || 0,
      ind5: parseInt(data.ind5) || 0,
      ind6: parseInt(data.ind6) || 0,
      content:     data.reportContent || '',
      issues:      data.reportIssues  || '',
      submittedAt: now.toISOString(),
      month:       parseInt(data.reportMonth) || (now.getMonth() + 1),
      year:        parseInt(data.reportYear)  || now.getFullYear(),
      taskId:      data.taskId   || null,
      latitude:    data.latitude  ? parseFloat(data.latitude)  : null,
      longitude:   data.longitude ? parseFloat(data.longitude) : null,
      photos,
    });

    await report.save();
    res.json({ success: true, id: report._id });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/reports/my', auth, async (req, res) => {
  try {
    const { filter } = req.query;
    let list = await Report.find({ raisId: req.user.id })
      .select('-photos')
      .sort({ submittedAt: -1 });
    let data = list.map(d => ({ ...d.toObject(), id: d._id.toString() }));
    if (filter && filter !== 'all') data = data.filter(r => r.reportType === filter);
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: [] });
  }
});

app.get('/api/reports/my/stats', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const all         = await Report.find({ raisId: req.user.id }).select('reportDate month year');
    const thisMonth   = all.filter(r => r.month === month && r.year === year);
    const todayReps   = all.filter(r => r.reportDate === today);
    const tasks       = await Task.find({ status: 'active' });
    const activeTasks = tasks.filter(t => {
      if (t.assignedTo === 'all') return true;
      return Array.isArray(t.assignedTo) && t.assignedTo.includes(req.user.id);
    }).length;

    res.json({ total: all.length, thisMonth: thisMonth.length, today: todayReps.length, activeTasks });
  } catch {
    res.json({ total: 0, thisMonth: 0, today: 0, activeTasks: 0 });
  }
});

app.get('/api/reports', auth, adminOnly, async (req, res) => {
  try {
    const { raisId, type, dateFrom, dateTo } = req.query;
    const filter = {};
    if (raisId && raisId !== 'all') filter.raisId = parseInt(raisId);
    if (type   && type   !== 'all') filter.reportType = type;
    if (dateFrom || dateTo) {
      filter.reportDate = {};
      if (dateFrom) filter.reportDate.$gte = dateFrom;
      if (dateTo)   filter.reportDate.$lte = dateTo;
    }
    const list = await Report.find(filter).select('-photos').sort({ submittedAt: -1 });
    res.json({ success: true, data: list.map(d => ({ ...d.toObject(), id: d._id.toString() })) });
  } catch {
    res.json({ success: true, data: [] });
  }
});

app.get('/api/reports/stats', auth, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const all       = await Report.find({}).select('reportDate month year raisId');
    const todayReps = all.filter(r => r.reportDate === today);
    const monthReps = all.filter(r => r.month === month && r.year === year);
    const submittedRaisIds = [...new Set(monthReps.map(r => r.raisId))];
    const totalRaislar = await User.countDocuments({ role: 'rais' });

    res.json({
      totalRaislar,
      totalReports:     all.length,
      todayReports:     todayReps.length,
      monthReports:     monthReps.length,
      missingCount:     Math.max(0, totalRaislar - submittedRaisIds.length),
      submittedRaisIds,
    });
  } catch {
    res.json({ totalRaislar: 39, totalReports: 0, todayReports: 0, monthReports: 0, missingCount: 39, submittedRaisIds: [] });
  }
});

// ===== RAIS KARTALAR UCHUN OYLIK XULOSA =====
app.get('/api/reports/rais-summary', auth, adminOnly, async (req, res) => {
  try {
    const now   = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const today = now.toISOString().split('T')[0];

    const raislar = await User.find({ role: 'rais' }).select('-password').sort({ uid: 1 });
    const reports = await Report.find({ month, year }).select('raisId reportDate submittedAt');

    const summary = raislar.map(r => {
      const rReps = reports.filter(rep => rep.raisId === r.uid);
      const sorted = rReps.slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return {
        raisId:        r.uid,
        login:         r.login,
        fullName:      r.fullName,
        mahalla:       r.mahalla,
        district:      r.district,
        phone:         r.phone,
        monthCount:    rReps.length,
        submittedToday: rReps.some(rep => rep.reportDate === today),
        lastSubmit:    sorted[0]?.reportDate || null,
      };
    });

    res.json({ success: true, data: summary, month, year });
  } catch (err) {
    res.json({ success: false, data: [] });
  }
});

// Oylik grafik
app.get('/api/reports/chart/monthly', auth, adminOnly, async (req, res) => {
  const months = [0,0,0,0,0,0,0,0,0,0,0,0];
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const list = await Report.find({ year }).select('month');
    list.forEach(r => { if (r.month >= 1 && r.month <= 12) months[r.month - 1]++; });
  } catch {}
  res.json(months);
});

// Kunlik grafik
app.get('/api/reports/chart/daily', auth, adminOnly, async (req, res) => {
  const labels = [];
  const days   = {};
  const now    = new Date();
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(now);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split('T')[0];
    labels.push(`${d.getDate()}.${d.getMonth()+1}`);
    days[str] = 0;
  }
  try {
    const dateFrom = Object.keys(days)[0];
    const list = await Report.find({ reportDate: { $gte: dateFrom } }).select('reportDate');
    list.forEach(r => { if (days[r.reportDate] !== undefined) days[r.reportDate]++; });
  } catch {}
  res.json({ labels, data: Object.values(days) });
});

// Top raislar
app.get('/api/reports/top', auth, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const list  = await Report.find({}).select('raisId raisName');
    const counts = {};
    list.forEach(r => {
      if (!counts[r.raisId]) counts[r.raisId] = { name: r.raisName, count: 0 };
      counts[r.raisId].count++;
    });
    res.json(Object.values(counts).sort((a,b) => b.count - a.count).slice(0, limit));
  } catch { res.json([]); }
});

// Topshiriq hisobotlari
app.get('/api/reports/task/:taskId', auth, async (req, res) => {
  try {
    const list = await Report.find({ taskId: req.params.taskId }).select('-photos');
    res.json(list.map(d => ({ ...d.toObject(), id: d._id.toString() })));
  } catch { res.json([]); }
});

// Hisobot detayi
app.get('/api/reports/:id', auth, async (req, res) => {
  try {
    const doc = await Report.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false });
    if (req.user.role !== 'admin' && doc.raisId !== req.user.id) {
      return res.status(403).json({ success: false });
    }
    res.json({ success: true, data: { ...doc.toObject(), id: doc._id.toString() } });
  } catch { res.json({ success: false }); }
});

// ============================================================
// ===== TOPSHIRIQLAR =====
// ============================================================
app.get('/api/tasks', auth, adminOnly, async (req, res) => {
  try {
    const list = await Task.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: list.map(d => ({ ...d.toObject(), id: d._id.toString() })) });
  } catch { res.json({ success: true, data: [] }); }
});

app.get('/api/tasks/active', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'active' }).sort({ createdAt: -1 });
    const data  = tasks.filter(t => {
      if (t.assignedTo === 'all') return true;
      return Array.isArray(t.assignedTo) && t.assignedTo.includes(req.user.id);
    });
    res.json({ success: true, data: data.map(d => ({ ...d.toObject(), id: d._id.toString() })) });
  } catch { res.json({ success: true, data: [] }); }
});

app.post('/api/tasks', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, deadline, assignedTo, isHokimiyat, priority } = req.body;
    const task = new Task({
      title,
      description: description || '',
      deadline:    deadline    || '',
      assignedTo:  assignedTo  || 'all',
      isHokimiyat: isHokimiyat === true || isHokimiyat === 'true',
      priority:    priority    || 'normal',
      status:      'active',
      createdAt:   new Date().toISOString(),
      createdBy:   'admin',
    });
    await task.save();

    // Push notification yuborish
    sendPushToRaislar(task.assignedTo, { title: task.title }).catch(() => {});

    res.json({ success: true, id: task._id.toString() });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.patch('/api/tasks/:id/close', auth, adminOnly, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { status: 'closed' });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/tasks/:id', auth, adminOnly, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============================================================
// ===== FOYDALANUVCHILAR =====
// ============================================================
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'rais' }).select('-password').sort({ uid: 1 });
    res.json({ success: true, data: users.map(u => ({ ...u.toObject(), id: u.uid })) });
  } catch {
    res.json({ success: false, data: [] });
  }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { login, password, fullName, mahalla, district, phone } = req.body;
    const existing = await User.findOne({ login: login.trim() });
    if (existing) return res.json({ success: false, message: 'Bu login allaqachon mavjud!' });

    const maxUser = await User.findOne({ role: 'rais' }).sort({ uid: -1 });
    const newId   = maxUser ? maxUser.uid + 1 : 40;

    await User.create({
      uid:      newId,
      login:    login.trim(),
      password: password || '12345',
      fullName: fullName || '',
      mahalla:  mahalla  || '',
      district: district || '',
      phone:    phone    || '',
      role:     'rais',
    });
    res.json({ success: true, id: newId });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:uid', auth, adminOnly, async (req, res) => {
  try {
    await User.deleteOne({ uid: parseInt(req.params.uid) });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============================================================
// ===== SETUP (birinchi marta) =====
// ============================================================
app.post('/api/setup', async (req, res) => {
  try {
    const secret = req.headers['x-setup-key'];
    if (secret !== (process.env.SETUP_KEY || 'setup-mahalla-2026')) {
      return res.status(403).json({ success: false, message: "Kalit noto'g'ri" });
    }
    const existing = await User.findOne({ login: 'admin' });
    if (existing) return res.json({ success: true, message: "Ma'lumotlar allaqachon yuklangan" });

    const users = [
      { uid:0,  login:'admin',          password:'Admin@2026', fullName:'Tizim Administratori',                     mahalla:'',                    district:'', phone:'', role:'admin' },
      { uid:1,  login:'Avlod',           password:'12345', fullName:"To'rayev O'ral Samatovich",             mahalla:'Avlod MFY',          district:'Boysun', phone:'', role:'rais' },
      { uid:2,  login:'Arik usti',       password:'12345', fullName:"Murtazoyev To'lqin G'afforovich",       mahalla:'Arik usti MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:3,  login:'Bibishirin',      password:'12345', fullName:'Bozorov Nayim Nurutdinovich',           mahalla:'Bibishirin MFY',     district:'Boysun', phone:'', role:'rais' },
      { uid:4,  login:'Bogibolo',        password:'12345', fullName:'Ismatova Iroda Nematovna',              mahalla:'Bogibolo MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:5,  login:'Boshrabot',       password:'12345', fullName:'Ermamatov Muxammadi Xusanovich',        mahalla:'Boshrabot MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:6,  login:'Gaza',            password:'12345', fullName:"Mislimov O'ral Xayrullayevich",         mahalla:'Gaza MFY',           district:'Boysun', phone:'', role:'rais' },
      { uid:7,  login:'Darband',         password:'12345', fullName:'Boymahmatov Safarali Boylarovich',      mahalla:'Darband MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:8,  login:'Daxnaijom',       password:'12345', fullName:'Fozilov Zafar Faxriddinovich',          mahalla:'Daxnaijom MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:9,  login:'Dashtigoz',       password:'12345', fullName:'Raximov Asliddin Suyunovich',           mahalla:'Dashtigoz MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:10, login:'Dexibola',        password:'12345', fullName:"Habibullayev Furqat Raxim o'g'li",      mahalla:'Dexibola MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:11, login:'Duoba',           password:'12345', fullName:'Nizomov Tillo Abduraxmonovich',         mahalla:'Duoba MFY',          district:'Boysun', phone:'', role:'rais' },
      { uid:12, login:'Inkabod',         password:'12345', fullName:'Shoymardonov Sirojiddin Boyqobilovich', mahalla:'Inkabod MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:13, login:'Kizilnavr',       password:'12345', fullName:'Bekmurodov Dilmurod Sattorovich',       mahalla:'Kizilnavr MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:14, login:'Kosiblar',        password:'12345', fullName:"Yo'ldoshov Qodir Sobirovich",           mahalla:'Kosiblar MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:15, login:'Kulkamish',       password:'12345', fullName:'Qurbonov Xabillo Nabiyevich',           mahalla:'Kulkamish MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:16, login:'Kuchkak',         password:'12345', fullName:'Norboyev Zokir Sobirovich',             mahalla:'Kuchkak MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:17, login:'Munchok',         password:'12345', fullName:"Xayitmurodov Baxtiyor Xolto'rayevich",  mahalla:'Munchok MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:18, login:'Mustakillik',     password:'12345', fullName:'Mamataliyeva Xadicha Amonovna',         mahalla:'Mustakillik MFY',    district:'Boysun', phone:'', role:'rais' },
      { uid:19, login:'Obi',             password:'12345', fullName:'Sattorov Yusup Xidirovich',             mahalla:'Obi MFY',            district:'Boysun', phone:'', role:'rais' },
      { uid:20, login:'Pasurxi',         password:'12345', fullName:'Raximov Xursand Azizovich',             mahalla:'Pasurxi MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:21, login:'Poygaboshi',      password:'12345', fullName:'Umbarov Ilyos Ismoilovich',             mahalla:'Poygaboshi MFY',     district:'Boysun', phone:'', role:'rais' },
      { uid:22, login:'Pulxokim',        password:'12345', fullName:'Daminov Xamza Amirqulovich',            mahalla:'Pulxokim MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:23, login:'Sayrob',          password:'12345', fullName:'Shamsiyev Mirzoqul Tursunovich',        mahalla:'Sayrob MFY',         district:'Boysun', phone:'', role:'rais' },
      { uid:24, login:'Temir Darvoza',   password:'12345', fullName:"Boturov Ulug'bek Muxamadiyevich",       mahalla:'Temir Darvoza MFY',  district:'Boysun', phone:'', role:'rais' },
      { uid:25, login:'Tillokamr',       password:'12345', fullName:'Gulboyev Xolmirzo Xushayevich',         mahalla:'Tillokamr MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:26, login:"Tog'chi",         password:'12345', fullName:'Qodirov Azamat Erkinovich',             mahalla:"Tog'chi MFY",        district:'Boysun', phone:'', role:'rais' },
      { uid:27, login:'Tuda',            password:'12345', fullName:"Shoyimov Bexruz Jo'raqulovich",         mahalla:'Tuda MFY',           district:'Boysun', phone:'', role:'rais' },
      { uid:28, login:'Tuzbozor',        password:'12345', fullName:'Poshshoyev Elmurod Zoirovich',          mahalla:'Tuzbozor MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:29, login:'Urmonchi',        password:'12345', fullName:'Pirnayev Mashrab Asatullayevich',       mahalla:'Urmonchi MFY',       district:'Boysun', phone:'', role:'rais' },
      { uid:30, login:"O'rta Machay",    password:'12345', fullName:'Amonqulov Yusuf Safarovich',            mahalla:"O'rta Machay MFY",   district:'Boysun', phone:'', role:'rais' },
      { uid:31, login:"Xo'jabulgon",     password:'12345', fullName:'Tojiyev Nodirbek Tojiyevich',           mahalla:"Xo'jabulgon MFY",    district:'Boysun', phone:'', role:'rais' },
      { uid:32, login:"Xo'jaidod",       password:'12345', fullName:'Norov Tolibjon Murodaliyevich',         mahalla:"Xo'jaidod MFY",      district:'Boysun', phone:'', role:'rais' },
      { uid:33, login:'Hunarmandlar',    password:'12345', fullName:'Rajabov Xaydar Ashurovich',             mahalla:'Hunarmandlar MFY',   district:'Boysun', phone:'', role:'rais' },
      { uid:34, login:'Chilonzor',       password:'12345', fullName:'Salomov Saydullo Kamolovich',           mahalla:'Chilonzor MFY',      district:'Boysun', phone:'', role:'rais' },
      { uid:35, login:'Chorchinor',      password:'12345', fullName:'Mamatqulova Charos Erkinovna',          mahalla:'Chorchinor MFY',     district:'Boysun', phone:'', role:'rais' },
      { uid:36, login:'Shirinobod',      password:'12345', fullName:'Azizov Normamat Majidovich',            mahalla:'Shirinobod MFY',     district:'Boysun', phone:'', role:'rais' },
      { uid:37, login:'Shifobulok',      password:'12345', fullName:"Allayorov Musulmon Eshmo'minovich",     mahalla:'Shifobulok MFY',     district:'Boysun', phone:'', role:'rais' },
      { uid:38, login:'Shursoy',         password:'12345', fullName:"Xurramov Turg'un Po'latovich",          mahalla:'Shursoy MFY',        district:'Boysun', phone:'', role:'rais' },
      { uid:39, login:'Yukori Machay',   password:'12345', fullName:'Murtazoyev Mengli Mavlonovich',         mahalla:'Yukori Machay MFY',  district:'Boysun', phone:'', role:'rais' },
    ];

    await User.insertMany(users);
    res.json({ success: true, message: `${users.length} ta foydalanuvchi yuklandi!` });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({
      success: true,
      message: 'Server va MongoDB ishlayapti',
      version: '2.0.0',
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      push: !!process.env.VAPID_PUBLIC_KEY,
    });
  } catch {
    res.status(500).json({ success: false, message: 'MongoDB ulanmagan' });
  }
});

// ============================================================
// SERVER ISHGA TUSHIRISH
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Mahalla Backend Server v2.0 — http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${MONGO_URI.split('@').pop()}`);
  console.log(`🖼  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ ulangan' : '❌ sozlanmagan'}`);
  console.log(`🔔 Push:       ${process.env.VAPID_PUBLIC_KEY      ? '✅ ulangan' : '❌ sozlanmagan'}`);
  console.log(`\n📋 Sozlash uchun backend/.env ga qo'shing:`);
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('   CLOUDINARY_CLOUD_NAME=...');
    console.log('   CLOUDINARY_API_KEY=...');
    console.log('   CLOUDINARY_API_SECRET=...');
  }
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.log('   VAPID keylari uchun: npx web-push generate-vapid-keys');
    console.log('   VAPID_PUBLIC_KEY=...');
    console.log('   VAPID_PRIVATE_KEY=...');
  }
});
