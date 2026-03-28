const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');
const { convertToPdf, isSofficeAvailable } = require('../utils/libreoffice');

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
    let tempPdfPath = null;

    if (ext === '.pdf') {
      pdfBytes = fs.readFileSync(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.jfif'].includes(ext)) {
      // Compress image and convert to PDF
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
      // Office doc -> Convert to PDF
      if (!isSofficeAvailable()) {
        if (req.file) deleteFile(filePath);
        return error(res, 'Office file compression requires LibreOffice. Please upload a PDF or image file instead.', 422);
      }
      tempPdfPath = await convertToPdf(filePath, outputDir);
      pdfBytes = fs.readFileSync(tempPdfPath);
    }

    let compressed;
    let compressedSize;
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    // Try basic compression first
    compressed = await doc.save({ useObjectStreams: true });
    compressedSize = compressed.length;

    // If basic compression didn't help much (< 5% reduction), use Deep Compression (Rasterization)
    // For "extreme" we always check if we can reduce it more.
    if (ext === '.pdf' && isSofficeAvailable() && (compressedSize > originalSize * 0.95 || compressionLevel === 'extreme')) {
      console.log(`Basic compression insufficient or 'extreme' requested, starting Deep Compression (Quality: ${quality})...`);
      const pageCount = doc.getPageCount();
      const compressedDoc = await PDFDocument.create();
      const BATCH_SIZE = 5;

      for (let j = 0; j < pageCount; j += BATCH_SIZE) {
        const batch = Array.from({ length: Math.min(BATCH_SIZE, pageCount - j) }, (_, i) => j + i);

        const batchResults = await Promise.all(batch.map(async (i) => {
          const tempPageDoc = await PDFDocument.create();
          const [copiedPage] = await tempPageDoc.copyPages(doc, [i]);
          tempPageDoc.addPage(copiedPage);
          const tempPageBytes = await tempPageDoc.save();
          const tempPagePath = path.join(outputDir, `p_comp_${uuidv4()}.pdf`);
          fs.writeFileSync(tempPagePath, tempPageBytes);

          try {
            const pageJpgPath = await convertToPdf(tempPagePath, outputDir, 'jpg');
            const optimizedJpgBuffer = await sharp(pageJpgPath)
              .resize(resize, resize, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality, progressive: true })
              .toBuffer();
            deleteFile(tempPagePath);
            deleteFile(pageJpgPath);
            return { type: 'image', buffer: optimizedJpgBuffer };
          } catch (e) {
            console.warn(`Deep compression skipped for page ${i}:`, e.message);
            deleteFile(tempPagePath);
            return { type: 'page', index: i };
          }
        }));

        for (const item of batchResults) {
          if (item.type === 'image') {
            const img = await compressedDoc.embedJpg(item.buffer);
            const page = compressedDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          } else {
            const [origPage] = await compressedDoc.copyPages(doc, [item.index]);
            compressedDoc.addPage(origPage);
          }
        }
      }
      compressed = await compressedDoc.save({ useObjectStreams: true });
      compressedSize = compressed.length;
    }

    const outName = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), compressed);

    // Cleanup
    if (req.file) deleteFile(filePath);
    if (tempPdfPath) deleteFile(tempPdfPath);

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

