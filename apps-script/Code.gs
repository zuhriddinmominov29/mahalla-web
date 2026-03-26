/**
 * ============================================================
 * MAHALLA RAISLARI TIZIMI — GOOGLE APPS SCRIPT BACKEND
 * ============================================================
 *
 * O'RNATISH QADAMLARI:
 * 1. https://script.google.com — yangi loyiha yarating
 * 2. Bu kodni ko'chirib yapishitiring
 * 3. SPREADSHEET_ID ni o'zingizning jadval ID si bilan almashtiring
 * 4. "Deploy" > "New deployment" > "Web app" tanlang
 * 5. Execute as: "Me", Who has access: "Anyone" tanlang
 * 6. Deploy URL ni nusxalab admin panel > Sozlamalar'ga kiriting
 * 7. Google Sheets da quyidagi varaqlarni yarating (skript avtomatik yaratadi)
 * ============================================================
 */

const SPREADSHEET_ID = '1Mu_tB--lHqYQv323rhhG9-2saFsnrzagB2sH3Ob4GPk';
const SHEETS = {
  USERS:   'Foydalanuvchilar',
  REPORTS: 'Hisobotlar',
};

// ============================================================
// HTTP HANDLER
// ============================================================
function doGet(e) {
  const action = e?.parameter?.action || 'ping';
  let result;

  try {
    switch (action) {
      case 'ping':         result = { success: true, message: 'Mahalla tizimi ishlayapti!', version: '1.0' }; break;
      case 'myReports':    result = getMyReports(e.parameter); break;
      case 'allReports':   result = getAllReports(e.parameter); break;
      case 'getRaislar':   result = getRaislar(); break;
      case 'stats':        result = getStats(); break;
      default:             result = { success: false, message: 'Noma\'lum so\'rov: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.toString() };
  }

  return jsonResponse(result);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return jsonResponse({ success: false, message: 'JSON parse xatosi' });
  }

  const action = body.action || '';
  let result;

  try {
    switch (action) {
      case 'login':        result = login(body); break;
      case 'submitReport': result = submitReport(body); break;
      case 'addRais':      result = addRais(body); break;
      case 'changePass':   result = changePassword(body); break;
      default:             result = { success: false, message: 'Noma\'lum amal: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.toString() };
  }

  return jsonResponse(result);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// AUTENTIFIKATSIYA
// ============================================================
function login(body) {
  const { username, password } = body;
  if (!username || !password) {
    return { success: false, message: 'Login va parol talab qilinadi' };
  }

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.USERS, getUserHeaders());
  const data  = sheet.getDataRange().getValues();

  // Header = qator 0
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[2] === username && row[3] === password) {
      // Oxirgi kirish vaqtini yangilash
      sheet.getRange(i+1, 8).setValue(new Date().toISOString());
      return {
        success:  true,
        role:     row[7] || 'rais',
        user: {
          id:       row[0],
          login:    row[2],
          fullName: row[1],
          mahalla:  row[4],
          district: row[5],
          phone:    row[6],
          role:     row[7],
        },
      };
    }
  }
  return { success: false, message: 'Login yoki parol noto\'g\'ri!' };
}

// ============================================================
// HISOBOTLAR
// ============================================================
function submitReport(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.REPORTS, getReportHeaders());
  const now   = new Date().toISOString();
  const newId = getNextId(sheet);

  sheet.appendRow([
    newId,
    body.raisId      || '',
    body.raisName    || '',
    body.mahalla     || '',
    body.district    || '',
    body.reportType  || 'daily',
    body.reportDate  || '',
    body.reportTitle || '',
    parseInt(body.ind1) || 0,
    parseInt(body.ind2) || 0,
    parseInt(body.ind3) || 0,
    parseInt(body.ind4) || 0,
    parseInt(body.ind5) || 0,
    parseInt(body.ind6) || 0,
    body.reportContent || '',
    body.reportIssues  || '',
    parseInt(body.reportMonth) || new Date().getMonth() + 1,
    parseInt(body.reportYear)  || new Date().getFullYear(),
    now,
  ]);

  return { success: true, id: newId, message: 'Hisobot muvaffaqiyatli yuborildi!' };
}

function getMyReports(params) {
  const raisId = parseInt(params.raisId);
  const filter = params.filter || 'all';
  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet  = getOrCreateSheet(ss, SHEETS.REPORTS, getReportHeaders());
  const data   = sheet.getDataRange().getValues();

  let results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (parseInt(row[1]) !== raisId) continue;
    if (filter !== 'all' && row[5] !== filter) continue;
    results.push(rowToReport(row));
  }
  results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return { success: true, data: results };
}

function getAllReports(params = {}) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.REPORTS, getReportHeaders());
  const data  = sheet.getDataRange().getValues();

  let results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (params.raisId && params.raisId !== 'all' && parseInt(row[1]) !== parseInt(params.raisId)) continue;
    if (params.type   && params.type   !== 'all' && row[5] !== params.type) continue;
    if (params.dateFrom && row[6] < params.dateFrom) continue;
    if (params.dateTo   && row[6] > params.dateTo)   continue;
    results.push(rowToReport(row));
  }
  results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return { success: true, data: results };
}

function rowToReport(row) {
  return {
    id:          row[0],
    raisId:      row[1],
    raisName:    row[2],
    mahalla:     row[3],
    district:    row[4],
    reportType:  row[5],
    reportDate:  row[6],
    reportTitle: row[7],
    ind1: row[8], ind2: row[9], ind3: row[10],
    ind4: row[11], ind5: row[12], ind6: row[13],
    content:     row[14],
    issues:      row[15],
    month:       row[16],
    year:        row[17],
    submittedAt: row[18],
  };
}

// ============================================================
// RAISLAR
// ============================================================
function getRaislar() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.USERS, getUserHeaders());
  const data  = sheet.getDataRange().getValues();

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[7] !== 'rais') continue;
    results.push({
      id:       row[0],
      fullName: row[1],
      login:    row[2],
      mahalla:  row[4],
      district: row[5],
      phone:    row[6],
      role:     row[7],
    });
  }
  return { success: true, data: results };
}

function addRais(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.USERS, getUserHeaders());
  const data  = sheet.getDataRange().getValues();
  const newId = getNextId(sheet);

  // Login mavjudligini tekshirish
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === body.login) {
      return { success: false, message: 'Bu login allaqachon mavjud!' };
    }
  }

  sheet.appendRow([
    newId,
    body.fullName || '',
    body.login    || '',
    body.password || '12345',
    body.mahalla  || '',
    body.district || '',
    body.phone    || '',
    'rais',
    new Date().toISOString(),
  ]);
  return { success: true, id: newId };
}

function changePassword(body) {
  const { userId, newPassword } = body;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.USERS, getUserHeaders());
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      sheet.getRange(i+1, 4).setValue(newPassword);
      return { success: true };
    }
  }
  return { success: false, message: 'Foydalanuvchi topilmadi' };
}

// ============================================================
// STATISTIKA
// ============================================================
function getStats() {
  const ss      = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet   = getOrCreateSheet(ss, SHEETS.REPORTS, getReportHeaders());
  const data    = sheet.getDataRange().getValues();
  const today   = new Date().toISOString().split('T')[0];
  const now     = new Date();
  const month   = now.getMonth() + 1;
  const year    = now.getFullYear();

  let total = 0, todayReps = 0, monthReps = 0;
  const submittedRaisIds = new Set();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    total++;
    if (row[6] === today) todayReps++;
    if (row[16] == month && row[17] == year) {
      monthReps++;
      submittedRaisIds.add(row[1]);
    }
  }

  return {
    success:          true,
    totalReports:     total,
    todayReports:     todayReps,
    monthReports:     monthReps,
    submittedRaisIds: [...submittedRaisIds],
    missingCount:     Math.max(0, 39 - submittedRaisIds.size),
  };
}

// ============================================================
// YORDAM FUNKSIYALARI
// ============================================================
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#0D2B5C')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getNextId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return Math.max(0, ...ids.map(Number)) + 1;
}

function getUserHeaders() {
  return ['ID','To\'liq ism','Login','Parol','Mahalla','Tuman','Telefon','Rol','Oxirgi kirish'];
}

function getReportHeaders() {
  return [
    'ID','Rais ID','Rais Ismi','Mahalla','Tuman','Tur','Sana','Sarlavha',
    'Murojaat','Hal etilgan','Oilaviy ziyorat','Yoshlar','Ijtimoiy yordam','Uy-joy',
    'Hisobot matni','Muammolar','Oy','Yil','Yuborilgan vaqt'
  ];
}

// ============================================================
// BOSHLANG'ICH MA'LUMOTLARNI YUKLASH
// (birinchi marta ishga tushirganda chaqiring)
// ============================================================
function setupInitialData() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEETS.USERS, getUserHeaders());

  // Admin foydalanuvchi
  sheet.appendRow([0, 'Tizim Administratori', 'admin', 'Admin@2024', '', '', '', 'admin', '']);

  // 39 ta rais (demo)
  const raislar = [
    [1,'Abdullayev Jasur Sobirovich','mahalla01','12345','Yangi Hayot mahallasi','Yunusobod tumani','+998901234501','rais',''],
    [2,'Rahimov Sherzod Qodirovich','mahalla02','12345','Mustaqillik mahallasi','Yunusobod tumani','+998901234502','rais',''],
    [3,'Toshmatov Nodir Hamidovich','mahalla03','12345',"Navro'z mahallasi",'Yunusobod tumani','+998901234503','rais',''],
    // ... qolganlarini qo'shing
  ];
  raislar.forEach(r => sheet.appendRow(r));

  SpreadsheetApp.flush();
  Logger.log('Boshlang\'ich ma\'lumotlar yuklandi!');
}
