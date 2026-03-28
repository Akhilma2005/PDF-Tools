const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUTS_DIR = path.join(__dirname, '../outputs');

const deleteOldFiles = (dir) => {
  if (!fs.existsSync(dir)) return;
  const expiry = (parseInt(process.env.FILE_EXPIRY_MINUTES) || 60) * 60 * 1000;
  const now = Date.now();
  fs.readdirSync(dir).forEach(file => {
    if (file === '.gitkeep') return;
    const filePath = path.join(dir, file);
    try {
      const { mtimeMs } = fs.statSync(filePath);
      if (now - mtimeMs > expiry) fs.unlinkSync(filePath);
    } catch (_) {}
  });
};

const startCleanup = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    deleteOldFiles(UPLOADS_DIR);
    deleteOldFiles(OUTPUTS_DIR);
  });
};

const deleteFile = (filePath) => {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
};

module.exports = { startCleanup, deleteFile };
