const path = require('path');

const success = (res, data) => res.status(200).json({ success: true, ...data });

const error = (res, message, status = 400) => res.status(status).json({ success: false, message });

const downloadUrl = (req, filename) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}/api/download/${filename}`;
};
const previewUrl = (req, filename) => `${req.protocol}://${req.get('host')}/api/outputs/${filename}`;

const outputPath = (filename) => path.join(__dirname, '../outputs', filename);

module.exports = {
  success,
  error,
  downloadUrl,
  previewUrl,
  outputPath,
};
