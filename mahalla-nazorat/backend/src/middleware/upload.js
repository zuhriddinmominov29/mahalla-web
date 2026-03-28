const multer = require('multer');
const sharp = require('sharp');
const supabase = require('../config/supabaseStorage');
const { v4: uuidv4 } = require('uuid');

// ─── Multer memory storage ────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat JPG, PNG, WEBP rasmlar qabul qilinadi.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 4 }, // 10MB, max 4 ta
});

// ─── Sharp kompressiyasi ──────────────────────────────────────────────────────
const compressImage = async (buffer) =>
  await sharp(buffer)
    .resize(1280, 960, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, progressive: true, mozjpeg: true })
    .toBuffer();

// ─── Supabase Storage ga yuklash ──────────────────────────────────────────────
const uploadToSupabase = async (buffer, originalName) => {
  const fileName = `reports/${uuidv4()}.jpg`;

  const { data, error } = await supabase.storage
    .from('mahalla-images')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload xatosi: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from('mahalla-images')
    .getPublicUrl(fileName);

  return {
    url: publicUrlData.publicUrl,
    publicId: fileName, // delete uchun saqlaymiz
  };
};

// ─── Rasmlarni kompressiya + yuklash ─────────────────────────────────────────
const processAndUploadImages = async (files) => {
  if (!files?.length) return [];
  const limited = files.slice(0, 4);
  return Promise.all(
    limited.map(async (file) => {
      const compressed = await compressImage(file.buffer);
      return uploadToSupabase(compressed, file.originalname);
    })
  );
};

// ─── Supabase dan rasm o'chirish ──────────────────────────────────────────────
const deleteFromStorage = async (publicId) => {
  const { error } = await supabase.storage
    .from('mahalla-images')
    .remove([publicId]);
  if (error) console.error('Rasm o\'chirish xatosi:', error.message);
};

module.exports = { upload, processAndUploadImages, deleteFromStorage };
