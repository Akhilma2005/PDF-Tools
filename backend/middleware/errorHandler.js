const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 100}MB`, 413);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return error(res, 'Too many files uploaded at once', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return error(res, 'Unexpected file field name', 400);
  }

  error(res, err.message || 'Internal server error', err.status || 500);
};
