-- ================================================================
-- BOYSUN TUMANI MAHALLA TIZIMI — DATABASE SCHEMA
-- Supabase PostgreSQL
-- AI ga tayyor, ko'p tuman uchun kengaytiriladigan
-- ================================================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. DISTRICTS (Tumanlar) — Multi-tenant asosi
-- ================================================================
CREATE TABLE districts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  region      TEXT DEFAULT 'Surxondaryo',
  hokim_name  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. MAHALLAS
-- ================================================================
CREATE TABLE mahallas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_num   INTEGER,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. USERS
-- ================================================================
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id  UUID REFERENCES districts(id) ON DELETE CASCADE,
  mahalla_id   UUID REFERENCES mahallas(id) ON DELETE SET NULL,
  role         TEXT NOT NULL CHECK (role IN ('super_admin','hokim','uyushma','rais')),
  full_name    TEXT NOT NULL,
  username     TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone        TEXT,
  is_active    BOOLEAN DEFAULT true,
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. MESSAGES (Chat)
-- ================================================================
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id  UUID NOT NULL REFERENCES districts(id),
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','image','file','mixed')),
  -- null = barcha raislar ko'radi, array = faqat shu IDlar
  recipients   UUID[] DEFAULT NULL,
  is_report    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 5. ATTACHMENTS (Rasm/Fayl)
-- ================================================================
CREATE TABLE attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  name        TEXT,
  mime_type   TEXT,
  size_bytes  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 6. MESSAGE READS (Kim o'qidi)
-- ================================================================
CREATE TABLE message_reads (
  message_id  UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- ================================================================
-- 7. EMERGENCIES (Favqulodda Vaziyat)
-- ================================================================
CREATE TABLE emergencies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES districts(id),
  mahalla_id  UUID NOT NULL REFERENCES mahallas(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  -- yomgir, shamol, elektr, sel, talofat, yongir
  types       TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  severity    TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  casualties  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','resolved')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. DAILY SUBMISSIONS (Hisobot analitika)
-- ================================================================
CREATE TABLE daily_submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES districts(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  mahalla_id  UUID REFERENCES mahallas(id),
  message_id  UUID REFERENCES messages(id),
  submit_date DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, submit_date)
);

-- ================================================================
-- INDEXES (Tezlik uchun)
-- ================================================================
CREATE INDEX idx_messages_district   ON messages(district_id);
CREATE INDEX idx_messages_sender     ON messages(sender_id);
CREATE INDEX idx_messages_created    ON messages(created_at DESC);
CREATE INDEX idx_emergencies_dist    ON emergencies(district_id);
CREATE INDEX idx_emergencies_mahalla ON emergencies(mahalla_id);
CREATE INDEX idx_emergencies_status  ON emergencies(status);
CREATE INDEX idx_daily_sub_date      ON daily_submissions(submit_date);
CREATE INDEX idx_users_district      ON users(district_id);
CREATE INDEX idx_mahallas_district   ON mahallas(district_id);

-- ================================================================
-- TRIGGERS (Auto updated_at)
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER districts_updated_at
  BEFORE UPDATE ON districts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- REAL-TIME (Supabase Realtime uchun yoqish)
-- ================================================================
ALTER TABLE messages    REPLICA IDENTITY FULL;
ALTER TABLE emergencies REPLICA IDENTITY FULL;
ALTER TABLE message_reads REPLICA IDENTITY FULL;
