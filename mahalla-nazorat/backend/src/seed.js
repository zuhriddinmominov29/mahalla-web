require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed boshlandi...\n');

  // Super Admin
  await prisma.user.upsert({
    where: { email: process.env.SUPER_ADMIN_EMAIL || 'admin@mahalla.uz' },
    update: {},
    create: { name: 'Super Admin', email: process.env.SUPER_ADMIN_EMAIL || 'admin@mahalla.uz', password: await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456', 12), role: 'SUPER_ADMIN' },
  });

  // Hokim
  await prisma.user.upsert({
    where: { email: 'hokim@toshkent.uz' },
    update: {},
    create: { name: 'Toshkent Hokimi', email: 'hokim@toshkent.uz', password: await bcrypt.hash('Hokim@2024', 12), role: 'HOKIM', district: 'Toshkent' },
  });

  // Deputilar
  const fields = ['Ijtimoiy', 'Iqtisodiy', 'Kommunal', "Ta'lim va sog'liqni saqlash"];
  for (let i = 0; i < fields.length; i++) {
    await prisma.user.upsert({
      where: { email: `deputy${i+1}@toshkent.uz` },
      update: {},
      create: { name: `${fields[i]} bo'yicha O'rinbosar`, email: `deputy${i+1}@toshkent.uz`, password: await bcrypt.hash(`Deputy@${i+1}`, 12), role: 'DEPUTY', district: 'Toshkent', deputyField: fields[i] },
    });
  }

  // Raislar
  const mahallalar = [
    { name: 'Yunusobod-1', district: 'Yunusobod' },
    { name: 'Chilonzor-5', district: 'Chilonzor' },
    { name: 'Mirzo Ulugbek-3', district: 'Mirzo Ulugbek' },
    { name: 'Shayxontohur-7', district: 'Shayxontohur' },
  ];
  for (let i = 0; i < mahallalar.length; i++) {
    const m = mahallalar[i];
    await prisma.user.upsert({
      where: { email: `rais${i+1}@mahalla.uz` },
      update: {},
      create: { name: `${m.name} Mahalla Raisi`, email: `rais${i+1}@mahalla.uz`, password: await bcrypt.hash(`Rais@${i+1}`, 12), role: 'RAIS', district: m.district, mahalla: m.name },
    });
  }

  // Kategoriyalar
  const cats = [
    { name: 'Kommunal xizmatlar', color: '#3B82F6', icon: '🏗️' },
    { name: 'Ijtimoiy yordam',     color: '#10B981', icon: '🤝' },
    { name: "Ta'lim",              color: '#F59E0B', icon: '📚' },
    { name: "Sog'liqni saqlash",   color: '#EF4444', icon: '🏥' },
    { name: 'Xavfsizlik',          color: '#8B5CF6', icon: '🛡️' },
    { name: 'Yashillashtirish',    color: '#22C55E', icon: '🌳' },
    { name: "Yo'l va transport",   color: '#F97316', icon: '🚗' },
    { name: 'Sport va yoshlar',    color: '#06B6D4', icon: '⚽' },
  ];
  for (const cat of cats) {
    await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: cat });
  }

  console.log('✅ Seed muvaffaqiyatli!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin: admin@mahalla.uz     / Admin@123456');
  console.log('Hokim:       hokim@toshkent.uz    / Hokim@2024');
  console.log("O'rinbosar:  deputy1@toshkent.uz  / Deputy@1");
  console.log('Rais:        rais1@mahalla.uz     / Rais@1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error('❌ Seed xatosi:', e); process.exit(1); }).finally(() => prisma.$disconnect());
