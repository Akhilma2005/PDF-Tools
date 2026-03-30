const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  const { compressionLevel = 'recommended', quality: customQuality, filename } = req.body;
  
  let filePath;
  if (req.file) {
    filePath = req.file.path;
  } else if (filename) {
    filePath = path.join(__dirname, '../uploads', filename);
  } else {
    return error(res, 'No file provided');
  }

  if (!fs.existsSync(filePath)) return error(res, 'File not found');

  // Define compression presets
  const presets = {
    extreme:     { quality: 20, resize: 800 },
    recommended: { quality: 50, resize: 1200 },
    low:         { quality: 80, resize: 2000 }
  };

  const settings = presets[compressionLevel] || presets.recommended;
  const quality = customQuality ? parseInt(customQuality) : settings.quality;
  const resize = settings.resize;

  const ext = path.extname(filePath).toLowerCase();
  const outputDir = path.join(__dirname, '../outputs');
  const originalSize = fs.statSync(filePath).size;

  try {
    let pdfBytes;

    if (ext === '.pdf') {
      pdfBytes = fs.readFileSync(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.jfif'].includes(ext)) {
      const imgBuffer = await sharp(filePath)
        .resize(resize, resize, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, progressive: true })
        .toBuffer();
      const merged = await PDFDocument.create();
      const img = await merged.embedJpg(imgBuffer);
      const page = merged.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      pdfBytes = await merged.save();
    } else {
      if (req.file) deleteFile(filePath);
      return error(res, 'Please upload a PDF or image file.', 422);
    }

    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const compressed = await doc.save({ useObjectStreams: true });
    const compressedSize = compressed.length;

    const outName = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), compressed);

    if (req.file) deleteFile(filePath);

    success(res, {
      message: 'File compressed successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
      originalSize,
      compressedSize,
      savedPercent: Math.max(0, Math.round((1 - compressedSize / originalSize) * 100)),
    });

  } catch (err) {
    if (req.file) deleteFile(filePath);
    error(res, `Compression failed: ${err.message}`, 500);
  }
};

