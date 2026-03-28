const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No file uploaded');

  const { compressionLevel = 'recommended' } = req.body;
  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const originalSize = fs.statSync(filePath).size;

  const presets = {
    extreme:     { quality: 20, resize: 800 },
    recommended: { quality: 60, resize: 1920 },
    low:         { quality: 85, resize: 3000 },
  };

  const { quality, resize } = presets[compressionLevel] || presets.recommended;

  try {
    const outExt = ['.png'].includes(ext) ? '.png' : '.jpg';
    const outName = `${uuidv4()}${outExt}`;
    const outPath = outputPath(outName);

    let pipeline = sharp(filePath).resize(resize, resize, { fit: 'inside', withoutEnlargement: true });

    if (outExt === '.png') {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    }

    await pipeline.toFile(outPath);

    const compressedSize = fs.statSync(outPath).size;
    deleteFile(filePath);

    success(res, {
      message: 'Image compressed successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=Compressed Image`,
      originalSize,
      compressedSize,
      savedPercent: Math.max(0, Math.round((1 - compressedSize / originalSize) * 100)),
    });
  } catch (err) {
    deleteFile(filePath);
    error(res, `Compression failed: ${err.message}`, 500);
  }
};
