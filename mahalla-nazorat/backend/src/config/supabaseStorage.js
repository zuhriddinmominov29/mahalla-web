const { createClient } = require('@supabase/supabase-js');

// Supabase Storage client (service role key kerak - RLS bypass uchun)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
