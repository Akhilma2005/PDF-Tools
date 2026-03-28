const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No PDF file uploaded');

  try {
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);

    const outName = `${uuidv4()}.txt`;
    fs.writeFileSync(outputPath(outName), data.text, 'utf8');
    deleteFile(req.file.path);

    const friendlyUrl = `${downloadUrl(req, outName)}?name=PDF Tools`;
    success(res, {
      message: 'Text extracted successfully',
      filename: 'PDF Tools.txt',
      downloadUrl: friendlyUrl,
      pageCount: data.numpages,
      charCount: data.text.length,
      preview: data.text.slice(0, 300),
    });
  } catch (err) {
    deleteFile(req.file.path);
    error(res, `Text extraction failed: ${err.message}`, 500);
  }
};
