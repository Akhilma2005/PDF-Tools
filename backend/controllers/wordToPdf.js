const fs      = require('fs');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { success, error, downloadUrl } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No Word file uploaded');

  const inputPath = req.file.path;
  const outputDir = path.join(__dirname, '../outputs');

  try {
    // Convert DOCX to plain text via mammoth
    const result = await mammoth.extractRawText({ path: inputPath });
    const text = result.value || '';

    // Build PDF from text using pdf-lib
    const pdfDoc  = await PDFDocument.create();
    const font    = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const margin   = 50;
    const lineHeight = fontSize * 1.4;

    const pageWidth  = 595;
    const pageHeight = 842;
    const maxWidth   = pageWidth - margin * 2;

    // Word-wrap lines
    const rawLines = text.split('\n');
    const lines = [];
    for (const raw of rawLines) {
      if (!raw.trim()) { lines.push(''); continue; }
      const words = raw.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        const w = font.widthOfTextAtSize(test, fontSize);
        if (w > maxWidth && current) { lines.push(current); current = word; }
        else current = test;
      }
      if (current) lines.push(current);
    }

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      if (line) {
        page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
      }
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    const outName  = `${uuidv4()}.pdf`;
    fs.writeFileSync(path.join(outputDir, outName), pdfBytes);
    deleteFile(inputPath);

    success(res, {
      message: 'Word converted to PDF',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
    });
  } catch (err) {
    deleteFile(inputPath);
    error(res, `Conversion failed: ${err.message}`, 500);
  }
};
