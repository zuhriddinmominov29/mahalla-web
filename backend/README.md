# Mahalla Tizimi — Backend

Node.js + Express + MongoDB backend serveri.

## O'rnatish

```bash
cd backend
npm install
```

## Sozlash

```bash
cp .env.example .env
# .env faylini tahrirlang
```

`.env` fayli:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mahalla
JWT_SECRET=murakkab-maxfiy-kalit-2026
PORT=3001
FRONTEND_URL=https://mahalla-tizimi.netlify.app
```

## MongoDB Atlas (bepul)

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) ga kiring
2. Bepul M0 cluster yarating
3. Database user yarating (username/password)
4. Network Access → `0.0.0.0/0` qo'shing (yoki server IP)
5. Connect → Connect your application → URI ni `.env` ga kiriting

## Ishga tushirish

```bash
npm start
# yoki dev mode:
npm run dev
```

## Birinchi marta — Ma'lumotlarni yuklash

Server ishga tushgandan keyin bir marta chaqiring:

```bash
curl -X POST http://localhost:3001/api/setup \
  -H "x-setup-key: setup-mahalla-2026"
```

## Deployment (Render.com — bepul)

1. [render.com](https://render.com) ga kiring
2. New → Web Service → GitHub repo ulang
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`
5. Environment Variables ga `.env` dan qiymatlarni kiriting
6. Deploy — URL olasiz (masalan: `https://mahalla-backend.onrender.com`)

## Frontend sozlash

Admin panelda **Sozlamalar → Backend URL** ga Render URL ni kiriting va **Saqlash** bosing.

## API Endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/auth/login | Kirish |
| POST | /api/auth/change-password | Parol o'zgartirish |
| POST | /api/reports | Hisobot yuborish |
| GET | /api/reports/my | O'z hisobotlari |
| GET | /api/reports/my/stats | Statistika |
| GET | /api/reports | Barcha hisobotlar (admin) |
| GET | /api/reports/stats | Admin statistika |
| GET | /api/tasks/active | Faol topshiriqlar |
| POST | /api/tasks | Topshiriq yaratish (admin) |
| PATCH | /api/tasks/:id/close | Topshiriqni yopish |
| GET | /api/users | Raislar ro'yxati |
| POST | /api/users | Rais qo'shish |
| GET | /api/health | Server holati |
| POST | /api/setup | Boshlang'ich ma'lumotlar |
