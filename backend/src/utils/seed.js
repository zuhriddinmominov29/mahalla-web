/**
 * Seed script — Barcha foydalanuvchilarni yaratadi
 * Ishlatish: node src/utils/seed.js
 */
require('dotenv').config({ path: '../../.env' });
const bcrypt    = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DISTRICT_ID = '00000000-0000-0000-0000-000000000001';

const RAISLAR = [
  { name: "To'rayev O'ral Samatovich",             mahalla: 'Avlod' },
  { name: "Murtazoyev To'lqin G'afforovich",        mahalla: 'Ariq usti' },
  { name: 'Bozorov Nayim Nurutdinovich',             mahalla: 'Bibishirin' },
  { name: 'Ismatova Iroda Nematovna',                mahalla: "Bog'ibolo" },
  { name: 'Ermamatov Muxammadi Xusanovich',          mahalla: 'Boshrabot' },
  { name: "Mislimov O'ral Xayrullayevich",           mahalla: 'Gaza' },
  { name: 'Boymahmatov Safarali Boylarovich',        mahalla: 'Darband' },
  { name: 'Fozilov Zafar Faxriddinovich',            mahalla: 'Daxnaijom' },
  { name: 'Raximov Asliddin Suyunovich',             mahalla: 'Dashtigoz' },
  { name: "Habibullayev Furqat Raxim o'g'li",        mahalla: 'Dehibolo' },
  { name: 'Nizomov Tillo Abduraxmonovich',           mahalla: 'Duoba' },
  { name: 'Shoymardonov Sirojiddin Boyqobilovich',   mahalla: 'Inkabod' },
  { name: 'Bekmurodov Dilmurod Sattorovich',         mahalla: 'Qizilnavr' },
  { name: "Yo'ldoshov Qodir Sobirovich",             mahalla: 'Kosiblar' },
  { name: 'Qurbonov Xabillo Nabiyevich',             mahalla: 'Kofrun' },
  { name: 'Norboyev Zokir Sobirovich',               mahalla: 'Kuchkak' },
  { name: "Xayitmurodov Baxtiyor Xolto'rayevich",    mahalla: 'Munchoq' },
  { name: 'Mamataliyeva Xadicha Amonovna',           mahalla: 'Mustaqillik' },
  { name: 'Sattorov Yusup Xidirovich',               mahalla: 'Obi' },
  { name: 'Raximov Xursand Azizovich',               mahalla: 'Pasurxi' },
  { name: 'Umbarov Ilyos Ismoilovich',               mahalla: 'Poygaboshi' },
  { name: 'Daminov Xamza Amirqulovich',              mahalla: 'Pulxokim' },
  { name: 'Shamsiyev Mirzoqul Tursunovich',          mahalla: 'Sayrob' },
  { name: "Boturov Ulug'bek Muxamadiyevich",         mahalla: 'Temir Darvoza' },
  { name: 'Gulboyev Xolmirzo Xushayevich',           mahalla: 'Tillokamr' },
  { name: 'Qodirov Azamat Erkinovich',               mahalla: "Tog'chi" },
  { name: "Shoyimov Bexruz Jo'raqulovich",           mahalla: "To'da" },
  { name: 'Poshshoyev Elmurod Zoirovich',            mahalla: 'Tuzbozor' },
  { name: 'Pirnayev Mashrab Asatullayevich',         mahalla: "O'rmonchi" },
  { name: 'Amonqulov Yusuf Safarovich',              mahalla: "O'rta Machay" },
  { name: 'Tojiyev Nodirbek Tojiyevich',             mahalla: "Xo'jabulgon" },
  { name: 'Norov Tolibjon Murodaliyevich',           mahalla: "Xo'jaidod" },
  { name: 'Rajabov Xaydar Ashurovich',               mahalla: 'Hunarmandlar' },
  { name: 'Salomov Saydullo Kamolovich',             mahalla: 'Chilonzor' },
  { name: 'Mamatqulova Charos Erkinovna',            mahalla: 'Chorchinor' },
  { name: 'Azizov Normamat Majidovich',              mahalla: 'Shirinobod' },
  { name: "Allayorov Musulmon Eshmo'minovich",       mahalla: 'Shifobuloq' },
  { name: "Xurramov Turg'un Po'latovich",            mahalla: "Sho'rsoy" },
  { name: 'Murtazoyev Mengli Mavlonovich',           mahalla: 'Yuqori Machay' },
];

async function seed() {
  console.log('🌱 Seed boshlandi...\n');

  // Mahallalarni olish
  const { data: mahallas } = await db
    .from('mahallas')
    .select('id, name')
    .eq('district_id', DISTRICT_ID);

  const mahallaMap = {};
  (mahallas || []).forEach(m => { mahallaMap[m.name] = m.id; });

  const defaultHash = await bcrypt.hash('12345', 10);
  const adminHash   = await bcrypt.hash('Admin@2026', 10);

  // Super Admin
  await db.from('users').upsert({
    district_id: DISTRICT_ID, mahalla_id: null,
    role: 'super_admin', full_name: 'Super Administrator',
    username: 'admin', password_hash: adminHash,
  }, { onConflict: 'username' });
  console.log('✅ Super Admin yaratildi');

  // Hokim
  await db.from('users').upsert({
    district_id: DISTRICT_ID, mahalla_id: null,
    role: 'hokim',
    full_name: "Bahodir Shukurov Shato'rayevich",
    username: 'hokim', password_hash: adminHash,
  }, { onConflict: 'username' });
  console.log('✅ Hokim yaratildi');

  // Uyushma Rahbari
  await db.from('users').upsert({
    district_id: DISTRICT_ID, mahalla_id: null,
    role: 'uyushma', full_name: 'Zoir Rahmonov',
    username: 'uyushma', password_hash: defaultHash,
  }, { onConflict: 'username' });
  console.log('✅ Uyushma Rahbari yaratildi');

  // Raislar
  let count = 0;
  for (const r of RAISLAR) {
    const mahalla_id = mahallaMap[r.mahalla];
    const username   = r.mahalla
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    await db.from('users').upsert({
      district_id: DISTRICT_ID,
      mahalla_id:  mahalla_id || null,
      role:        'rais',
      full_name:   r.name,
      username,
      password_hash: defaultHash,
    }, { onConflict: 'username' });
    count++;
  }
  console.log(`✅ ${count} ta rais yaratildi`);
  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  console.log('\nLogin ma\'lumotlari:');
  console.log('  admin   → Admin@2026');
  console.log('  hokim   → Admin@2026');
  console.log('  uyushma → 12345');
  console.log('  raislar → 12345 (username = mahalla nomi)');
}

seed().catch(console.error).finally(() => process.exit());
