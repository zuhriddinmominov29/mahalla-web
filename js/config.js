/**
 * MAHALLA TIZIMI — KONFIGURATSIYA
 * Backend URL ni o'zingizning serveringizga o'zgartiring
 */

const CONFIG = {
  // =====================================================
  // BACKEND API manzili
  // Local ishlab chiqishda: 'http://localhost:3001'
  // Produksiyada: 'https://your-backend.onrender.com'  yoki shu kabi
  // =====================================================
  API_URL: localStorage.getItem('mahalla_api_url') || 'https://mahalla-web.onrender.com',

  // Sessiya muddati (soat)
  SESSION_HOURS: 8,

  // Ilova versiyasi
  VERSION: '3.0.0',
};

// ============================================================
// Utility: sana formatlash
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function currentMonthYear() {
  const d = new Date();
  return { month: d.getMonth()+1, year: d.getFullYear() };
}

const TODAY = todayStr();

// ============================================================
// 39 MAHALLA RAISI — STATIK RO'YXAT (faqat frontend uchun)
// Parollar saqlanmaydi — bu faqat nom va ID lar
// ============================================================
const RAISLAR_DATA = [
  { id:1,  login:'Avlod',         fullName:"To'rayev O'ral Samatovich",             mahalla:'Avlod MFY',            role:'rais' },
  { id:2,  login:'Arik usti',     fullName:"Murtazoyev To'lqin G'afforovich",       mahalla:'Arik usti MFY',        role:'rais' },
  { id:3,  login:'Bibishirin',    fullName:'Bozorov Nayim Nurutdinovich',           mahalla:'Bibishirin MFY',       role:'rais' },
  { id:4,  login:'Bogibolo',      fullName:'Ismatova Iroda Nematovna',              mahalla:'Bogibolo MFY',         role:'rais' },
  { id:5,  login:'Boshrabot',     fullName:'Ermamatov Muxammadi Xusanovich',        mahalla:'Boshrabot MFY',        role:'rais' },
  { id:6,  login:'Gaza',          fullName:"Mislimov O'ral Xayrullayevich",         mahalla:'Gaza MFY',             role:'rais' },
  { id:7,  login:'Darband',       fullName:'Boymahmatov Safarali Boylarovich',      mahalla:'Darband MFY',          role:'rais' },
  { id:8,  login:'Daxnaijom',     fullName:'Fozilov Zafar Faxriddinovich',          mahalla:'Daxnaijom MFY',        role:'rais' },
  { id:9,  login:'Dashtigoz',     fullName:'Raximov Asliddin Suyunovich',           mahalla:'Dashtigoz MFY',        role:'rais' },
  { id:10, login:'Dexibola',      fullName:"Habibullayev Furqat Raxim o'g'li",      mahalla:'Dexibola MFY',         role:'rais' },
  { id:11, login:'Duoba',         fullName:'Nizomov Tillo Abduraxmonovich',         mahalla:'Duoba MFY',            role:'rais' },
  { id:12, login:'Inkabod',       fullName:'Shoymardonov Sirojiddin Boyqobilovich', mahalla:'Inkabod MFY',          role:'rais' },
  { id:13, login:'Kizilnavr',     fullName:'Bekmurodov Dilmurod Sattorovich',       mahalla:'Kizilnavr MFY',        role:'rais' },
  { id:14, login:'Kosiblar',      fullName:"Yo'ldoshov Qodir Sobirovich",           mahalla:'Kosiblar MFY',         role:'rais' },
  { id:15, login:'Kulkamish',     fullName:'Qurbonov Xabillo Nabiyevich',           mahalla:'Kulkamish MFY',        role:'rais' },
  { id:16, login:'Kuchkak',       fullName:'Norboyev Zokir Sobirovich',             mahalla:'Kuchkak MFY',          role:'rais' },
  { id:17, login:'Munchok',       fullName:"Xayitmurodov Baxtiyor Xolto'rayevich",  mahalla:'Munchok MFY',          role:'rais' },
  { id:18, login:'Mustakillik',   fullName:'Mamataliyeva Xadicha Amonovna',         mahalla:'Mustakillik MFY',      role:'rais' },
  { id:19, login:'Obi',           fullName:'Sattorov Yusup Xidirovich',             mahalla:'Obi MFY',              role:'rais' },
  { id:20, login:'Pasurxi',       fullName:'Raximov Xursand Azizovich',             mahalla:'Pasurxi MFY',          role:'rais' },
  { id:21, login:'Poygaboshi',    fullName:'Umbarov Ilyos Ismoilovich',             mahalla:'Poygaboshi MFY',       role:'rais' },
  { id:22, login:'Pulxokim',      fullName:'Daminov Xamza Amirqulovich',            mahalla:'Pulxokim MFY',         role:'rais' },
  { id:23, login:'Sayrob',        fullName:'Shamsiyev Mirzoqul Tursunovich',        mahalla:'Sayrob MFY',           role:'rais' },
  { id:24, login:'Temir Darvoza', fullName:"Boturov Ulug'bek Muxamadiyevich",       mahalla:'Temir Darvoza MFY',    role:'rais' },
  { id:25, login:'Tillokamr',     fullName:'Gulboyev Xolmirzo Xushayevich',         mahalla:'Tillokamr MFY',        role:'rais' },
  { id:26, login:"Tog'chi",       fullName:'Qodirov Azamat Erkinovich',             mahalla:"Tog'chi MFY",          role:'rais' },
  { id:27, login:'Tuda',          fullName:"Shoyimov Bexruz Jo'raqulovich",         mahalla:'Tuda MFY',             role:'rais' },
  { id:28, login:'Tuzbozor',      fullName:'Poshshoyev Elmurod Zoirovich',          mahalla:'Tuzbozor MFY',         role:'rais' },
  { id:29, login:'Urmonchi',      fullName:'Pirnayev Mashrab Asatullayevich',       mahalla:'Urmonchi MFY',         role:'rais' },
  { id:30, login:"O'rta Machay",  fullName:'Amonqulov Yusuf Safarovich',            mahalla:"O'rta Machay MFY",     role:'rais' },
  { id:31, login:"Xo'jabulgon",   fullName:'Tojiyev Nodirbek Tojiyevich',           mahalla:"Xo'jabulgon MFY",      role:'rais' },
  { id:32, login:"Xo'jaidod",     fullName:'Norov Tolibjon Murodaliyevich',         mahalla:"Xo'jaidod MFY",        role:'rais' },
  { id:33, login:'Hunarmandlar',  fullName:'Rajabov Xaydar Ashurovich',             mahalla:'Hunarmandlar MFY',     role:'rais' },
  { id:34, login:'Chilonzor',     fullName:'Salomov Saydullo Kamolovich',           mahalla:'Chilonzor MFY',        role:'rais' },
  { id:35, login:'Chorchinor',    fullName:'Mamatqulova Charos Erkinovna',          mahalla:'Chorchinor MFY',       role:'rais' },
  { id:36, login:'Shirinobod',    fullName:'Azizov Normamat Majidovich',            mahalla:'Shirinobod MFY',       role:'rais' },
  { id:37, login:'Shifobulok',    fullName:"Allayorov Musulmon Eshmo'minovich",     mahalla:'Shifobulok MFY',       role:'rais' },
  { id:38, login:'Shursoy',       fullName:"Xurramov Turg'un Po'latovich",          mahalla:'Shursoy MFY',          role:'rais' },
  { id:39, login:'Yukori Machay', fullName:'Murtazoyev Mengli Mavlonovich',         mahalla:'Yukori Machay MFY',    role:'rais' },
];

// Topshiriq statusi
const TASK_STATUS = {
  ACTIVE:  'active',
  CLOSED:  'closed',
};

// Sidebar toggle (umumiy)
function toggleSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('sidebarOverlay');
  if (sb) sb.classList.toggle('open');
  if (ov) ov.classList.toggle('open');
}

// Current date display
function updateCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) el.textContent = formatDate(new Date().toISOString());
}
document.addEventListener('DOMContentLoaded', updateCurrentDate);
