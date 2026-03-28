const fs  = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No HTML file uploaded');

  const inputPath = req.file.path;
  const outName   = `${uuidv4()}.pdf`;
  const outPath   = outputPath(outName);

  try {
    const htmlCode = fs.readFileSync(inputPath, 'utf8');
    deleteFile(inputPath);

    const doc    = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // Header bar
    doc.rect(0, 0, doc.page.width, 50).fill('#1e1e2e');
    doc.fillColor('#a6e3a1').fontSize(11).font('Courier-Bold')
       .text('HTML Source Code', 40, 17);

    doc.moveDown(2);

    // Render each line in monospace
    const lines    = htmlCode.split('\n');
    const lineH    = 13;
    const pageH    = doc.page.height - doc.page.margins.bottom;
    const codeX    = 40;
    let   lineNum  = 1;

    doc.fontSize(8.5).font('Courier');

    for (const line of lines) {
      // New page if needed
      if (doc.y + lineH > pageH) {
        doc.addPage();
        doc.fontSize(8.5).font('Courier');
      }

      const y = doc.y;

      // Alternating row background
      if (lineNum % 2 === 0) {
        doc.rect(0, y - 1, doc.page.width, lineH + 1).fill('#f8f8ff').fillColor('#1e1e2e');
      }

      // Line number gutter
      doc.fillColor('#999').font('Courier')
         .text(String(lineNum).padStart(4, ' '), codeX, y, { width: 28, lineBreak: false });

      // Code line — syntax-colour by content
      const color = getColor(line);
      doc.fillColor(color).font('Courier')
         .text(line || ' ', codeX + 32, y, {
           width: doc.page.width - codeX - 32 - 20,
           lineBreak: false,
           ellipsis: false,
         });

      doc.moveDown(0.55);
      lineNum++;
    }

    doc.end();

    stream.on('finish', () => {
      success(res, {
        message: 'HTML source code converted to PDF',
        filename: outName,
        downloadUrl: `${downloadUrl(req, outName)}?name=HTML Source PDF`,
      });
    });

    stream.on('error', (e) => {
      error(res, `PDF write failed: ${e.message}`, 500);
    });

  } catch (err) {
    if (fs.existsSync(outPath)) deleteFile(outPath);
    error(res, `Conversion failed: ${err.message}`, 500);
  }
};

// Basic syntax colouring by line content
function getColor(line) {
  const t = line.trim();
  if (t.startsWith('<!--'))           return '#6a9955'; // comment — green
  if (t.startsWith('<!DOCTYPE'))      return '#569cd6'; // doctype — blue
  if (/^<\/?\w/.test(t))              return '#4ec9b0'; // tag — teal
  if (/^\s*(style|<style)/i.test(t))  return '#ce9178'; // style — orange
  if (/^\s*(script|<script)/i.test(t))return '#dcdcaa'; // script — yellow
  if (/=["'][^"']*["']/.test(t))      return '#9cdcfe'; // attribute value — light blue
  return '#1e1e2e';                                      // default — dark
}
