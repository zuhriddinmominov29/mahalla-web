// Canvas API yordamida frontend rasm kompressiyasi
const MAX_W = 1280, MAX_H = 960, QUALITY = 0.75;

export const compressImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Faqat rasm fayllari'));

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = ({ target: { result } }) => {
    const img = new Image();
    img.src = result;
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > MAX_W || h > MAX_H) {
        const r = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Kompressiya xatosi'));
          const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          console.log(`📸 ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB`);
          resolve(compressed);
        },
        'image/jpeg', QUALITY
      );
    };
    img.onerror = () => reject(new Error('Rasm yuklash xatosi'));
  };
  reader.onerror = () => reject(new Error("Fayl o'qish xatosi"));
});

export const compressImages = async (files) =>
  Promise.all(Array.from(files).slice(0, 4).map(compressImage));

export const createPreviewUrl = (file) => URL.createObjectURL(file);
export const revokePreviewUrls = (urls) => urls.forEach(URL.revokeObjectURL);
