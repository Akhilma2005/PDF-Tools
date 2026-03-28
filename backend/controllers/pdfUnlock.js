const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');
const qpdf = require('node-qpdf2');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No PDF file uploaded');

  const password  = req.body.password || '';
  const inputPath = req.file.path;
  const outName   = `${uuidv4()}.pdf`;
  const outPath   = outputPath(outName);

  try {
    await qpdf.decrypt({ input: inputPath, output: outPath, password });
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100) throw new Error('Decryption failed. The password may be incorrect.');
    deleteFile(inputPath);
    success(res, {
      message: 'PDF unlocked successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
    });
  } catch (err) {
    if (fs.existsSync(outPath)) deleteFile(outPath);
    deleteFile(inputPath);
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('password') || msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
      return error(res, 'Incorrect password. Please try again.', 400);
    }
    error(res, `Unlock failed: ${msg || 'Unknown error'}`, 500);
  }
};
