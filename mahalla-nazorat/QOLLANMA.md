# 🇺🇿 MAHALLA NAZORAT — TO'LIQ ISHGA TUSHIRISH QO'LLANMASI

---

## 📋 MUNDARIJA
1. [Kerakli dasturlar](#kerakli)
2. [Supabase (Database)](#supabase)
3. [Cloudinary (Rasmlar)](#cloudinary)
4. [.env faylini sozlash](#env)
5. [Local ishga tushirish](#local)
6. [Deploy (Internet)](#deploy)
7. [Muammolar va yechimlar](#muammolar)

---

## 1. KERAKLI DASTURLAR {#kerakli}

Kompyuteringizda quyidagilar bo'lishi kerak:

```
✅ Node.js v18+  → https://nodejs.org  (LTS versiyani oling)
✅ npm v9+       → Node.js bilan birga keladi
✅ Git           → https://git-scm.com
```

Versiyalarni tekshiring:
```bash
node --version   # v18.0.0 yoki yuqori
npm --version    # 9.0.0 yoki yuqori
git --version    # ixtiyoriy versiya
```

---

## 2. SUPABASE — BEPUL POSTGRESQL DATABASE {#supabase}

### Qadam 1: Ro'yxatdan o'tish
```
1. https://supabase.com saytiga o'ting
2. "Start your project" tugmasini bosing
3. GitHub yoki Email bilan kiring
```

### Qadam 2: Yangi loyiha yaratish
```
1. "New project" tugmasini bosing
2. Quyidagilarni to'ldiring:
   - Project name: mahalla-nazorat
   - Database Password: Kuchli parol (YODLAB QOLING!)
     Masalan: Mahalla@2024#Uzbekiston
   - Region: West EU (London)  ← O'zbekistonga eng yaqin
3. "Create new project" → 2 daqiqa kuting
```

### Qadam 3: Connection URL olish
```
1. Chap paneldan ⚙️ Settings → Database
2. "Connection string" bo'limini toping
3. "URI" tabini tanlang
4. Pastda "Connection string" ni ko'rasiz:

postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres

5. Bu URLni nusxalab oling va saqlang!
   MUHIM: [YOUR-PASSWORD] o'rniga 2-qadamda yaratgan parolingiz bo'ladi
```

**Misol:**
```
postgresql://postgres:Mahalla@2024#Uzbekiston@db.abcdefghij.supabase.co:5432/postgres
```

---

## 3. CLOUDINARY — BEPUL RASM STORAGE (25GB) {#cloudinary}

### Qadam 1: Ro'yxatdan o'tish
```
1. https://cloudinary.com saytiga o'ting
2. "Sign up for free" → Email bilan ro'yxatdan o'ting
3. Email tasdiqlang
```

### Qadam 2: API kalitlarini olish
```
1. Dashboard ga kiring
2. Yuqorida "API Keys" bo'limi ko'rinadi:

   Cloud name:   my-cloud-123456
   API Key:      123456789012345
   API Secret:   xxxxxxxxxxxxxxxxxxxxxxxxxxxx

3. Bularni nusxalab oling!
```

> 💡 Cloudinary MAJBURIY EMAS. Test uchun o'tkazib yuborishingiz mumkin.
> Rasm yuklanmaydi, lekin qolgan hamma narsa ishlaydi.

---

## 4. .ENV FAYLINI SOZLASH {#env}

### Backend .env fayli
`mahalla-nazorat/backend/.env` faylini oching va to'ldiring:

```env
# Supabase dan olgan URL ingiz
DATABASE_URL="postgresql://postgres:PAROLINGIZ@db.LOYIHA.supabase.co:5432/postgres"

# Ixtiyoriy uzun matn (o'zgartiring!)
JWT_SECRET="mahalla-nazorat-2024-uzbekiston-very-secret!"
JWT_EXPIRES_IN="7d"

# Cloudinary (dashboard dan)
CLOUDINARY_CLOUD_NAME="sizning-cloud-name"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="abc123xyz..."

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Default admin
SUPER_ADMIN_EMAIL="admin@mahalla.uz"
SUPER_ADMIN_PASSWORD="Admin@123456"
```

### Frontend .env fayli
`mahalla-nazorat/frontend/.env` fayli (o'zgartirishsiz qoldiring):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 5. LOCAL ISHGA TUSHIRISH {#local}

### Terminal 1 — Backend

```bash
# Papkaga o'ting
cd mahalla-nazorat/backend

# Paketlarni o'rnating (birinchi martada)
npm install

# Prisma client yaratish
npx prisma generate

# Database jadvallarini yaratish (Supabase ga ulanadi)
npx prisma db push

# Natija bunday ko'rinishi kerak:
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your Prisma schema.

# Dastlabki ma'lumotlarni yuklash
node src/seed.js

# Natija:
# ✅ Super Admin yaratildi: admin@mahalla.uz
# ✅ Hokim yaratildi: hokim@toshkent.uz
# ✅ Deputy yaratildi: deputy1@toshkent.uz
# ✅ Rais yaratildi: rais1@mahalla.uz
# ✅ Kategoriyalar yaratildi

# Serverni ishga tushirish
npm run dev

# Natija:
# 🚀 Server: http://localhost:5000
# ✅ Server ishga tushdi!
```

### Terminal 2 — Frontend

```bash
# Yangi terminal oching, papkaga o'ting
cd mahalla-nazorat/frontend

# Paketlarni o'rnating (birinchi martada)
npm install

# Frontend ni ishga tushirish
npm run dev

# Natija:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/
```

### Brauzerda ochish
```
http://localhost:5173
```

### Test hisoblari:
| Rol | Email | Parol |
|-----|-------|-------|
| Super Admin | admin@mahalla.uz | Admin@123456 |
| Hokim | hokim@toshkent.uz | Hokim@2024 |
| O'rinbosar 1 | deputy1@toshkent.uz | Deputy@1 |
| Rais 1 | rais1@mahalla.uz | Rais@1 |

---

## 6. INTERNET GA DEPLOY (BEPUL) {#deploy}

### 6.1 GitHub ga push qilish

```bash
# Asosiy papkaga o'ting
cd mahalla-nazorat

# Git repo yaratish
git init
git add .
git commit -m "Mahalla Nazorat v1.0"

# GitHub da yangi repo yarating:
# github.com → + New repository → mahalla-nazorat → Create

# GitHub ga push
git remote add origin https://github.com/SIZNING_USERNAME/mahalla-nazorat.git
git branch -M main
git push -u origin main
```

### 6.2 Render.com — Backend Deploy

```
1. https://render.com ga kiring (GitHub bilan)
2. "New +" → "Web Service"
3. GitHub reponi tanlang: mahalla-nazorat
4. Sozlamalar:
   - Root Directory: backend
   - Build Command:  npm install && npx prisma generate && npx prisma db push
   - Start Command:  npm start
   - Plan:           Free

5. "Environment Variables" bo'limiga o'ting va qo'shing:
   DATABASE_URL         = (Supabase URL)
   JWT_SECRET           = mahalla-nazorat-production-secret-2024!
   CLOUDINARY_CLOUD_NAME = (cloudinary dan)
   CLOUDINARY_API_KEY   = (cloudinary dan)
   CLOUDINARY_API_SECRET = (cloudinary dan)
   FRONTEND_URL         = https://SIZNING-APP.vercel.app
   NODE_ENV             = production

6. "Create Web Service" → deploy boshlanadi (3-5 daqiqa)
7. Deploy tugagach URL oling:
   https://mahalla-nazorat-api.onrender.com

8. Shell tab → "Connect" → Seed qilish:
   node src/seed.js
```

### 6.3 Vercel — Frontend Deploy

```
1. https://vercel.com ga kiring (GitHub bilan)
2. "Add New..." → "Project"
3. mahalla-nazorat reponi "Import" qiling
4. Configure Project:
   - Root Directory: frontend  ← MUHIM!
   - Framework: Vite
5. "Environment Variables" qo'shing:
   VITE_API_URL    = https://mahalla-nazorat-api.onrender.com/api
   VITE_SOCKET_URL = https://mahalla-nazorat-api.onrender.com
6. "Deploy" → 1-2 daqiqa
7. URL oling: https://mahalla-nazorat.vercel.app
```

### 6.4 Render da FRONTEND_URL ni yangilash

```
Render → mahalla-nazorat-api → Environment
FRONTEND_URL = https://mahalla-nazorat.vercel.app  ← Vercel URL
"Save Changes" → avtomatik redeploy
```

### 6.5 UptimeRobot (Server uyqlamasligi uchun)

```
Render free tier 15 daqiqa faoliyatsiz bo'lsa uxlaydi.
Oldini olish uchun:

1. https://uptimerobot.com → "Sign up free"
2. "Add New Monitor":
   - Monitor Type: HTTP(s)
   - Friendly Name: Mahalla Nazorat
   - URL: https://mahalla-nazorat-api.onrender.com/health
   - Monitoring Interval: 14 minutes
3. "Create Monitor" → Tayyor!
```

---

## 7. MUAMMOLAR VA YECHIMLAR {#muammolar}

### ❌ "Cannot connect to database"
```
Yechim: .env faylida DATABASE_URL ni tekshiring
- Parolda maxsus belgilar (@, #, !) bo'lsa URL encode qilish kerak:
  @ → %40
  # → %23
  ! → %21

Misol:
Parol: My@Pass#2024!
URL:   postgresql://postgres:My%40Pass%232024%21@db.xxx.supabase.co:5432/postgres
```

### ❌ "prisma generate" ishlamaydi
```bash
npm install prisma --save-dev
npx prisma generate
```

### ❌ Frontend backend ga ulana olmaydi (CORS error)
```
Yechim: backend .env da FRONTEND_URL to'g'ri bo'lishi kerak
development: FRONTEND_URL="http://localhost:5173"
production:  FRONTEND_URL="https://sizning-app.vercel.app"
```

### ❌ Rasm yuklanmaydi
```
Yechim: Cloudinary kalitlarini tekshiring
- CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET to'g'ri kiritilganmi?
```

### ❌ "Port already in use"
```bash
# Windows da:
netstat -ano | findstr :5000
taskkill /PID [PID_RAQAMI] /F

# Mac/Linux da:
lsof -ti:5000 | xargs kill -9
```

### ❌ Seed ishlamaydi
```bash
# .env fayl to'g'ri o'rnatilganligini tekshiring
# Keyin qayta ishga tushiring:
cd mahalla-nazorat/backend
node src/seed.js
```

### ❌ Vercel da "404 Not Found"
```
vercel.json faylida rewrites bor:
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
Bu fayl mavjudligini tekshiring.
```

---

## ✅ HAMMASI ISHLAYAPTI — TEKSHIRISH

```bash
# Backend health check:
curl http://localhost:5000/health
# Javob: {"status":"✅ OK","time":"..."}

# Login test:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mahalla.uz","password":"Admin@123456"}'
# Javob: {"token":"eyJ...","user":{...}}
```

---

## 📱 MOBIL QURILMADA OCHISH (Local)

```
1. Backend serverni ishga tushiring: npm run dev
2. Kompyuteringizning IP sini toping:
   Windows: ipconfig → IPv4 Address (masalan: 192.168.1.100)
   Mac:     ifconfig | grep inet

3. frontend/.env ni o'zgartiring:
   VITE_API_URL=http://192.168.1.100:5000/api
   VITE_SOCKET_URL=http://192.168.1.100:5000

4. Frontend ni qayta ishga tushiring:
   npm run dev -- --host

5. Telefoningizda oching:
   http://192.168.1.100:5173

   (Kompyuter va telefon bir Wi-Fi da bo'lishi kerak!)
```

---

Muammo bo'lsa — so'rang! 🇺🇿
