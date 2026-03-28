const { isRealError } = require('./utils/libreoffice');

// Exact string LibreOffice produces (with \r\n)
const stderrBuf = Buffer.from('Could not find platform independent libraries <prefix>\r\n');

console.log('isRealError result:', isRealError(stderrBuf));
console.log('Should be: false');

// Also test as string
console.log('isRealError (string):', isRealError(stderrBuf.toString()));
