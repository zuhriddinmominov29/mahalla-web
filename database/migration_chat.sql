-- ================================================================
-- CHAT YANGILANISHI — reply (javob) va tahrirlash uchun
-- Supabase SQL Editor da ishga tushiring
-- ================================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to);
