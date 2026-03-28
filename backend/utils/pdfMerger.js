const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const { convertToPdf } = require('./libreoffice');
const { deleteFile } = require('./cleanup');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.jfif']);

const MAX_IMAGE_PX = 3000; // cap longest side to avoid RAM blowout on free-tier servers

const imageToPage = async (merged, filePath) => {
  const imgBuffer = await sharp(filePath)
    .resize(MAX_IMAGE_PX, MAX_IMAGE_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const img = await merged.embedJpg(imgBuffer);
  const page = merged.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
};
const OFFICE_EXTS = new Set(['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']);

/**
 * Merges multiple files (Images, PDFs, Office Docs) into a single PDF document.
 * @param {Array} files - Array of file objects from multer
 * @param {string} outputDir - Directory to store temporary converted files
 * @returns {Promise<PDFDocument>} - The merged PDF document
 */
const mergeToPdf = async (files, outputDir) => {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    console.log(`Merging file: ${file.originalname} (ext: ${ext})`);

    try {
      if (IMAGE_EXTS.has(ext)) {
        // ── Image → embed as new page ──────────────────────
        await imageToPage(merged, file.path);
        deleteFile(file.path);

      } else if (OFFICE_EXTS.has(ext)) {
        // ── Office doc → LibreOffice → merge pages ─────────
        const convertedPath = await convertToPdf(file.path, outputDir);
        const bytes = fs.readFileSync(convertedPath);
        try {
          const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach(p => merged.addPage(p));
        } catch (err) {
          throw new Error(`Failed to load converted PDF for ${file.originalname}: ${err.message}`);
        }
        deleteFile(file.path);
        deleteFile(convertedPath);

      } else if (ext === '.pdf') {
        // ── PDF → merge pages directly ─────────────────────
        const bytes = fs.readFileSync(file.path);
        try {
          const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach(p => merged.addPage(p));
          deleteFile(file.path);
        } catch (err) {
          // Fallback 1: Try as Image
          try {
            console.log(`PDF load failed for ${file.originalname}, trying as image...`);
            await imageToPage(merged, file.path);
            deleteFile(file.path);
          } catch (imgErr) {
            // Fallback 2: Try via LibreOffice (handles weird doc/image formats)
            try {
              console.log(`Image load failed for ${file.originalname}, trying via LibreOffice...`);
              const convertedPath = await convertToPdf(file.path, outputDir);
              const convBytes = fs.readFileSync(convertedPath);
              const doc = await PDFDocument.load(convBytes, { ignoreEncryption: true });
              const pages = await merged.copyPages(doc, doc.getPageIndices());
              pages.forEach(p => merged.addPage(p));
              deleteFile(file.path);
              deleteFile(convertedPath);
            } catch (libErr) {
              throw new Error(`Failed to process ${file.originalname}. 1) Not a valid PDF: ${err.message}. 2) Not a recognized image: ${imgErr.message}. 3) LibreOffice conversion failed: ${libErr.message}`);
            }
          }
        }


      } else {

        deleteFile(file.path);
        console.warn(`Skipping unsupported file type: ${ext}`);
      }
    } catch (err) {
      deleteFile(file.path);
      console.error(`Error processing ${file.originalname}:`, err.message);
      throw err; // Re-throw with file info
    }

  }

  return merged;
};

module.exports = { mergeToPdf };
