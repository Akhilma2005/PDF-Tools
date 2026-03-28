// Simulate what multer fileFilter sees for /word-to-pdf
const reqPath = '/word-to-pdf';
const tool = reqPath.replace('/', '');
console.log('tool:', tool);

const allowedTypes = {
  'word-to-pdf': /msword|wordprocessingml|doc|docx/,
};

const allowed = allowedTypes[tool];
console.log('allowed found:', !!allowed);

// Test cases — what browsers actually send for .docx
const cases = [
  { mime: 'application/msword', ext: 'doc' },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  { mime: 'application/octet-stream', ext: 'docx' },  // Windows Chrome
  { mime: 'application/zip', ext: 'docx' },            // Some browsers
];

cases.forEach(({ mime, ext }) => {
  const mimePass = allowed.test(mime);
  const extPass = allowed.test(ext);
  console.log(`mime="${mime}" ext="${ext}" -> mime:${mimePass} ext:${extPass} PASS:${mimePass || extPass}`);
});
