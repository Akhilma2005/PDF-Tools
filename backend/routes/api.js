const router = require('express').Router();
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { error } = require('../utils/response');

const compressImage = require('../controllers/compressImage');
const imageToPdf   = require('../controllers/imageToPdf');
const mergePdf     = require('../controllers/mergePdf');
const compressPdf  = require('../controllers/compressPdf');
const splitPdf     = require('../controllers/splitPdf');
const getThumbnails= require('../controllers/getThumbnails');
const wordToPdf    = require('../controllers/wordToPdf');
const pdfToWord    = require('../controllers/pdfToWord');
const excelToPdf   = require('../controllers/excelToPdf');
const pptToPdf     = require('../controllers/pptToPdf');
const pdfUnlock    = require('../controllers/pdfUnlock');
const pdfToText    = require('../controllers/pdfToText');
const rearrangePdf = require('../controllers/rearrangePdf');
const pdfToPpt     = require('../controllers/pdfToPpt');
const htmlToText   = require('../controllers/htmlToText');
const htmlToPdf    = require('../controllers/htmlToPdf');
const pdfProtect   = require('../controllers/pdfProtect');

router.post('/compress-image', upload.single('file'),      compressImage);
router.post('/image-to-pdf',   upload.single('file'),      imageToPdf);
router.post('/merge-pdf',      upload.array('files', 100), mergePdf);
router.post('/compress-pdf',   upload.single('file'),      compressPdf);
router.post('/split-pdf',      upload.single('file'),      splitPdf);
router.post('/get-thumbnails', upload.single('file'),      getThumbnails);
router.post('/word-to-pdf',    upload.single('file'),      wordToPdf);
router.post('/pdf-to-word',    upload.single('file'),      pdfToWord);
router.post('/excel-to-pdf',   upload.single('file'),      excelToPdf);
router.post('/ppt-to-pdf',     upload.single('file'),      pptToPdf);
router.post('/pdf-unlock',     upload.single('file'),      pdfUnlock);
router.post('/pdf-to-text',    upload.single('file'),      pdfToText);
router.post('/rearrange-pdf',  upload.single('file'),      rearrangePdf);
router.post('/pdf-to-ppt',     upload.single('file'),      pdfToPpt);
router.post('/html-to-text',   upload.single('file'),      htmlToText);
router.post('/html-to-pdf',    upload.single('file'),      htmlToPdf);
router.post('/pdf-protect',    upload.single('file'),      pdfProtect);

router.get('/download/:filename', (req, res) => {
  const filename   = path.basename(req.params.filename);
  const filePath   = path.join(__dirname, '../outputs', filename);
  if (!fs.existsSync(filePath)) return error(res, 'File not found or already deleted', 404);
  const ext        = path.extname(filename);
  const friendlyName = req.query.name ? `${req.query.name}${ext}` : filename;
  res.download(filePath, friendlyName);
});

router.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

router.get('/debug-env', (req, res) => {
  const checks = {};
  ['soffice', 'libreoffice', 'pdftoppm', 'qpdf'].forEach(cmd => {
    const r = spawnSync('which', [cmd], { encoding: 'utf8' });
    checks[cmd] = r.status === 0 ? r.stdout.trim() : 'NOT FOUND';
  });
  const qpdfBinEnv = process.env.QPDF_BIN || 'not set';
  const qpdfBinExists = qpdfBinEnv !== 'not set' && fs.existsSync(qpdfBinEnv);
  res.json({ platform: process.platform, QPDF_BIN: qpdfBinEnv, QPDF_BIN_exists: qpdfBinExists, checks });
});

module.exports = router;
