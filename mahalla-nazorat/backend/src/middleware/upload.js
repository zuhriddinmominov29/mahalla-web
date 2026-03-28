const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

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

// ─── Cloudinary ga yuklash ────────────────────────────────────────────────────
const uploadToCloudinary = (buffer, folder = 'mahalla-reports') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// ─── Rasmlarni kompressiya + yuklash ─────────────────────────────────────────
const processAndUploadImages = async (files) => {
  if (!files?.length) return [];
  const limited = files.slice(0, 4);
  return Promise.all(
    limited.map(async (file) => {
      const compressed = await compressImage(file.buffer);
      const result = await uploadToCloudinary(compressed);
      return { url: result.secure_url, publicId: result.public_id };
    })
  );
};

const deleteFromCloudinary = async (publicId) =>
  cloudinary.uploader.destroy(publicId);

module.exports = { upload, processAndUploadImages, deleteFromCloudinary };
