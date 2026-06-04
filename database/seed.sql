-- ================================================================
-- SEED DATA — Boysun Tumani
-- ================================================================

-- 1. District
INSERT INTO districts (id, name, region, hokim_name) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Boysun', 'Surxondaryo',
   'Bahodir Shukurov Shato''rayevich');

-- 2. Mahallas (39 ta)
INSERT INTO mahallas (district_id, name, order_num) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Avlod', 1),
  ('00000000-0000-0000-0000-000000000001', 'Ariq usti', 2),
  ('00000000-0000-0000-0000-000000000001', 'Bibishirin', 3),
  ('00000000-0000-0000-0000-000000000001', 'Bog''ibolo', 4),
  ('00000000-0000-0000-0000-000000000001', 'Boshrabot', 5),
  ('00000000-0000-0000-0000-000000000001', 'Gaza', 6),
  ('00000000-0000-0000-0000-000000000001', 'Darband', 7),
  ('00000000-0000-0000-0000-000000000001', 'Daxnaijom', 8),
  ('00000000-0000-0000-0000-000000000001', 'Dashtigoz', 9),
  ('00000000-0000-0000-0000-000000000001', 'Dehibolo', 10),
  ('00000000-0000-0000-0000-000000000001', 'Duoba', 11),
  ('00000000-0000-0000-0000-000000000001', 'Inkabod', 12),
  ('00000000-0000-0000-0000-000000000001', 'Qizilnavr', 13),
  ('00000000-0000-0000-0000-000000000001', 'Kosiblar', 14),
  ('00000000-0000-0000-0000-000000000001', 'Kofrun', 15),
  ('00000000-0000-0000-0000-000000000001', 'Kuchkak', 16),
  ('00000000-0000-0000-0000-000000000001', 'Munchoq', 17),
  ('00000000-0000-0000-0000-000000000001', 'Mustaqillik', 18),
  ('00000000-0000-0000-0000-000000000001', 'Obi', 19),
  ('00000000-0000-0000-0000-000000000001', 'Pasurxi', 20),
  ('00000000-0000-0000-0000-000000000001', 'Poygaboshi', 21),
  ('00000000-0000-0000-0000-000000000001', 'Pulxokim', 22),
  ('00000000-0000-0000-0000-000000000001', 'Sayrob', 23),
  ('00000000-0000-0000-0000-000000000001', 'Temir Darvoza', 24),
  ('00000000-0000-0000-0000-000000000001', 'Tillokamr', 25),
  ('00000000-0000-0000-0000-000000000001', 'Tog''chi', 26),
  ('00000000-0000-0000-0000-000000000001', 'To''da', 27),
  ('00000000-0000-0000-0000-000000000001', 'Tuzbozor', 28),
  ('00000000-0000-0000-0000-000000000001', 'O''rmonchi', 29),
  ('00000000-0000-0000-0000-000000000001', 'O''rta Machay', 30),
  ('00000000-0000-0000-0000-000000000001', 'Xo''jabulgon', 31),
  ('00000000-0000-0000-0000-000000000001', 'Xo''jaidod', 32),
  ('00000000-0000-0000-0000-000000000001', 'Hunarmandlar', 33),
  ('00000000-0000-0000-0000-000000000001', 'Chilonzor', 34),
  ('00000000-0000-0000-0000-000000000001', 'Chorchinor', 35),
  ('00000000-0000-0000-0000-000000000001', 'Shirinobod', 36),
  ('00000000-0000-0000-0000-000000000001', 'Shifobuloq', 37),
  ('00000000-0000-0000-0000-000000000001', 'Sho''rsoy', 38),
  ('00000000-0000-0000-0000-000000000001', 'Yuqori Machay', 39);

-- 3. Users (parollar: bcrypt hash of '12345' — login dan so'ng o'zgartirish kerak)
-- super_admin va hokim uchun qattiqroq parol
-- bcrypt hash of 'Admin@2026' = $2b$10$...
-- Bu yerda placeholder, seed.js skript orqali to'g'ri hash qo'yiladi

-- Super Admin
INSERT INTO users (district_id, mahalla_id, role, full_name, username, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'super_admin',
   'Super Administrator', 'admin',
   '$2b$10$YourHashHere');

-- Hokim
INSERT INTO users (district_id, mahalla_id, role, full_name, username, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'hokim',
   'Bahodir Shukurov Shato''rayevich', 'hokim',
   '$2b$10$YourHashHere');

-- Uyushma Rahbari
INSERT INTO users (district_id, mahalla_id, role, full_name, username, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'uyushma',
   'Zoir Rahmonov', 'uyushma',
   '$2b$10$YourHashHere');
