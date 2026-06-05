-- Hisobot lokatsiyasi uchun ustunlar qo'shish
ALTER TABLE daily_submissions
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy  REAL;

-- Tezroq so'rov uchun (lokatsiyali hisobotlar)
CREATE INDEX IF NOT EXISTS idx_daily_sub_location
  ON daily_submissions(submit_date)
  WHERE latitude IS NOT NULL;
