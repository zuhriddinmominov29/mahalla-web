# Google Apps Script — O'rnatish Qo'llanmasi

## 1-qadam: Google Apps Script loyihasini yaratish

1. Brauzerda **https://script.google.com** ga kiring
2. **"Yangi loyiha"** (New Project) tugmasini bosing
3. Loyiha nomini o'zgartiring: `Mahalla Tizimi Backend`

## 2-qadam: Kodni yuklash

1. `Code.gs` faylidagi barcha kodni ko'chirib oling
2. Apps Script muharririga yapishitiring
3. Faylni saqlang (Ctrl+S)

## 3-qadam: Ilovani joylashtirish

1. Yuqoridagi **"Deploy"** menyusini bosing
2. **"New deployment"** tanlang
3. **"Select type"** da **"Web app"** tanlang
4. Sozlamalar:
   - Description: `Mahalla Tizimi v1.0`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. **"Deploy"** tugmasini bosing
6. Paydo bo'lgan **URL** ni nusxalab oling

## 4-qadam: URL ni web ilovaga ulash

1. Admin panel ga kiring (`admin.html`)
2. **Sozlamalar** bo'limiga o'ting
3. **Apps Script URL** maydoniga nusxalangan URL ni kiriting
4. **"Saqlash"** tugmasini bosing
5. **"Ulanishni Tekshirish"** tugmasini bosing — "Muvaffaqiyatli ulandi!" xabari kelishi kerak

## 5-qadam: Boshlang'ich ma'lumotlarni yuklash

Apps Script muharriridagi funksiyani ishga tushiring:
1. Funksiyalar ro'yxatidan `setupInitialData` ni tanlang
2. **"Run"** (▶) tugmasini bosing
3. Google Sheets da **"Foydalanuvchilar"** va **"Hisobotlar"** varaqlar paydo bo'ladi

## Muhim Eslatmalar

- **Demo rejim**: Google Sheets ulanmagan bo'lsa, ilova demo ma'lumotlar bilan ishlaydi
- **Ma'lumotlar**: Real ma'lumotlar Google Sheets da saqlanadi
- **Parollar**: Raislar login parollarini o'zgartira oladi
- **Default parol**: Barcha raislar uchun `12345`
- **Admin login**: `admin` / `Admin@2024`

## Google Sheets Struktura

### "Foydalanuvchilar" varag'i
| ID | To'liq ism | Login | Parol | Mahalla | Tuman | Telefon | Rol | Oxirgi kirish |

### "Hisobotlar" varag'i
| ID | Rais ID | Rais Ismi | Mahalla | Tuman | Tur | Sana | Sarlavha | ... |
