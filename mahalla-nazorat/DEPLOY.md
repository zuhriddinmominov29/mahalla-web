# 🇺🇿 Mahalla Nazorat - Bepul Deploy Qo'llanmasi

## Arxitektura (hammasi BEPUL)
```
Vercel (Frontend)  →  Render.com (Backend)  →  Supabase (PostgreSQL)
                                            →  Cloudinary (Rasmlar)
```

---

## 1️⃣ SUPABASE - Bepul PostgreSQL (500MB)

1. **[supabase.com](https://supabase.com)** → GitHub bilan kiring → "New Project"
2. Settings → Database → Connection string → **URI** ni nusxalang:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

---

## 2️⃣ CLOUDINARY - Bepul Rasm Storage (25GB)

1. **[cloudinary.com](https://cloudinary.com)** → Register
2. Dashboard da API kalitlarini oling:
   - Cloud Name, API Key, API Secret

---

## 3️⃣ RENDER.COM - Bepul Backend (750 soat/oy)

1. **[render.com](https://render.com)** → "New Web Service"
2. GitHub reponi ulang → `mahalla-nazorat/backend` papkasini tanlang
3. Sozlamalar:
   ```
   Build:  npm install && npx prisma generate && npx prisma db push
   Start:  npm start
   Plan:   Free
   ```
4. Environment Variables:
   ```
   DATABASE_URL         = supabase URI
   JWT_SECRET           = uzun_tasodifiy_string
   CLOUDINARY_CLOUD_NAME = ...
   CLOUDINARY_API_KEY   = ...
   CLOUDINARY_API_SECRET = ...
   FRONTEND_URL         = https://sizning-app.vercel.app
   NODE_ENV             = production
   ```
5. Deploy bo'lgach Render Shell orqali seed:
   ```bash
   node src/seed.js
   ```

---

## 4️⃣ VERCEL - Bepul Frontend

1. **[vercel.com](https://vercel.com)** → "Import Project"
2. `mahalla-nazorat/frontend` papkasini tanlang
3. Environment Variables:
   ```
   VITE_API_URL    = https://mahalla-nazorat-api.onrender.com/api
   VITE_SOCKET_URL = https://mahalla-nazorat-api.onrender.com
   ```
4. Deploy! ✅

---

## 5️⃣ LOCAL DA ISHLATISH

### Backend:
```bash
cd mahalla-nazorat/backend
cp .env.example .env
# .env ni to'ldiring

npm install
npx prisma generate
npx prisma db push
node src/seed.js
npm run dev
# http://localhost:5000
```

### Frontend:
```bash
cd mahalla-nazorat/frontend
# .env yarating:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

npm install
npm run dev
# http://localhost:5173
```

---

## 📋 Demo Hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| 🔑 Super Admin | admin@mahalla.uz | Admin@123456 |
| 🏛️ Hokim | hokim@toshkent.uz | Hokim@2024 |
| 👔 O'rinbosar (Ijtimoiy) | deputy1@toshkent.uz | Deputy@1 |
| 👔 O'rinbosar (Iqtisodiy) | deputy2@toshkent.uz | Deputy@2 |
| 👔 O'rinbosar (Kommunal) | deputy3@toshkent.uz | Deputy@3 |
| 👔 O'rinbosar (Ta'lim) | deputy4@toshkent.uz | Deputy@4 |
| 🏘️ Rais 1 (Yunusobod-1) | rais1@mahalla.uz | Rais@1 |
| 🏘️ Rais 2 (Chilonzor-5) | rais2@mahalla.uz | Rais@2 |

---

## 💡 Foydali Maslahatlar

**Render Free uyg'otish vaqti:**
- 15 daqiqa faoliyatsizdan keyin server uxlaydi
- [UptimeRobot](https://uptimerobot.com) bilan 14 daqiqada bir ping qiling:
  ```
  URL: https://your-api.onrender.com/health
  ```

**GitHub ga push:**
```bash
cd mahalla-nazorat
git init
git add .
git commit -m "Mahalla Nazorat tizimi v1.0"
git remote add origin https://github.com/username/mahalla-nazorat
git push -u origin main
```
