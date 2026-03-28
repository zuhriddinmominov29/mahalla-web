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
    where: { email: 'hokim@boysun.uz' },
    update: { name: 'Boxadir Shukurov Shoturayevich', district: 'Boysun' },
    create: { name: 'Boxadir Shukurov Shoturayevich', email: 'hokim@boysun.uz', password: await bcrypt.hash('Hokim@2026', 12), role: 'HOKIM', district: 'Boysun' },
  });

  // Deputilar (O'rinbosarlar)
  const fields = ['Ijtimoiy', 'Iqtisodiy', 'Kommunal', "Ta'lim va sog'liqni saqlash"];
  for (let i = 0; i < fields.length; i++) {
    await prisma.user.upsert({
      where: { email: `deputy${i+1}@boysun.uz` },
      update: {},
      create: {
        name: `${fields[i]} bo'yicha O'rinbosar`,
        email: `deputy${i+1}@boysun.uz`,
        password: await bcrypt.hash(`Deputy@${i+1}`, 12),
        role: 'DEPUTY',
        district: 'Boysun',
        deputyField: fields[i],
      },
    });
  }

  // ─── Boysun tumani mahalla raislar ────────────────────────────────────────
  const mahallalar = [
    { mahalla: 'Avlod MFY',         name: "To'rayev O'ral Samatovich" },
    { mahalla: 'Arik usti MFY',     name: "Murtazoyev To'lqin G'afforovich" },
    { mahalla: 'Bibishirin MFY',    name: 'Bozorov Nayim Nurutdinovich' },
    { mahalla: 'Bogibolo MFY',      name: 'Ismatova Iroda Nematovna' },
    { mahalla: 'Boshrabot MFY',     name: 'Ermamatov Muxammadi Xusanovich' },
    { mahalla: 'Gaza MFY',          name: "Mislimov O'ral Xayrullayevich" },
    { mahalla: 'Darband MFY',       name: 'Boymahmatov Safarali Boylarovich' },
    { mahalla: 'Daxnaijom MFY',     name: 'Fozilov Zafar Faxriddinovich' },
    { mahalla: 'Dashtigoz MFY',     name: 'Raximov Asliddin Suyunovich' },
    { mahalla: 'Dexibola MFY',      name: "Habibullayev Furqat Raxim o'g'li" },
    { mahalla: 'Duoba MFY',         name: 'Nizomov Tillo Abduraxmonovich' },
    { mahalla: 'Inkabod MFY',       name: 'Shoymardonov Sirojiddin Boyqobilovich' },
    { mahalla: 'Kizilnavr MFY',     name: 'Bekmurodov Dilmurod Sattorovich' },
    { mahalla: 'Kosiblar MFY',      name: "Yo'ldoshov Qodir Sobirovich" },
    { mahalla: 'Kulqamish MFY',     name: 'Qurbonov Xabillo Nabiyevich' },
    { mahalla: 'Kuchqaq MFY',       name: 'Norboyev Zokir Sobirovich' },
    { mahalla: 'Munchok MFY',       name: "Xayitmurodov Baxtiyor Xolto'rayevich" },
    { mahalla: 'Mustaqillik MFY',   name: 'Mamataliyeva Xadicha Amonovna' },
    { mahalla: 'Obi MFY',           name: 'Sattorov Yusup Xidirovich' },
    { mahalla: 'Pasurxi MFY',       name: 'Raximov Xursand Azizovich' },
    { mahalla: 'Poygaboshi MFY',    name: 'Umbarov Ilyos Ismoilovich' },
    { mahalla: 'Pulxokim MFY',      name: 'Daminov Xamza Amirqulovich' },
    { mahalla: 'Sayrob MFY',        name: 'Shamsiyev Mirzoqul Tursunovich' },
    { mahalla: 'Temir Darvoza MFY', name: "Boturov Ulug'bek Muxamadiyevich" },
    { mahalla: 'Tilloqamar MFY',    name: 'Gulboyev Xolmirzo Xushayevich' },
    { mahalla: 'Togchi MFY',        name: 'Qodirov Azamat Erkinovich' },
    { mahalla: 'Tuda MFY',          name: "Shoyimov Bexruz Jo'raqulovich" },
    { mahalla: 'Tuzbozor MFY',      name: 'Poshshoyev Elmurod Zoirovich' },
    { mahalla: 'Urmonchi MFY',      name: 'Pirnayev Mashrab Asatullayevich' },
    { mahalla: 'Urta Machay MFY',   name: 'Amonqulov Yusuf Safarovich' },
    { mahalla: 'Xujabulgon MFY',    name: 'Tojiyev Nodirbek Tojiyevich' },
    { mahalla: 'Xujaidod MFY',      name: 'Norov Tolibjon Murodaliyevich' },
    { mahalla: 'Xunarmandlar MFY',  name: 'Rajabov Xaydar Ashurovich' },
    { mahalla: 'Chilonzor MFY',     name: 'Salomov Saydullo Kamolovich' },
    { mahalla: 'Chorchinor MFY',    name: 'Mamatqulova Charos Erkinovna' },
    { mahalla: 'Shirinobod MFY',    name: 'Azizov Normamat Majidovich' },
    { mahalla: 'Shifobulоq MFY',    name: "Allayorov Musulmon Eshmo'minovich" },
    { mahalla: 'Shursoy MFY',       name: "Xurramov Turg'un Po'latovich" },
    { mahalla: 'Yuqori Machay MFY', name: 'Murtazoyev Mengli Mavlonovich' },
  ];

  for (let i = 0; i < mahallalar.length; i++) {
    const m = mahallalar[i];
    const emailSlug = `rais${i + 1}`;
    await prisma.user.upsert({
      where: { email: `${emailSlug}@boysun.uz` },
      update: { name: m.name, mahalla: m.mahalla },
      create: {
        name: m.name,
        email: `${emailSlug}@boysun.uz`,
        password: await bcrypt.hash(`Rais@${i + 1}`, 12),
        role: 'RAIS',
        district: 'Boysun',
        mahalla: m.mahalla,
      },
    });
    console.log(`✅ ${i + 1}. ${m.mahalla} — ${m.name}`);
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

  console.log('\n✅ Seed muvaffaqiyatli!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:  admin@mahalla.uz      / Admin@123456');
  console.log('Hokim:        hokim@boysun.uz       / Hokim@2026');
  console.log("O'rinbosar:   deputy1@boysun.uz     / Deputy@1");
  console.log('Rais (1):     rais1@boysun.uz       / Rais@1   (Avlod MFY)');
  console.log('Rais (39):    rais39@boysun.uz      / Rais@39  (Yuqori Machay MFY)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error('❌ Seed xatosi:', e); process.exit(1); }).finally(() => prisma.$disconnect());
