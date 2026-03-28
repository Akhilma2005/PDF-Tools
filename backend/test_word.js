const fs = require('fs');
const path = require('path');
const { convertToPdf } = require('./utils/libreoffice');

const testInput = path.join(__dirname, 'uploads', 'test_word.txt');
fs.writeFileSync(testInput, 'Hello World - test conversion');

console.log('Input:', testInput);
console.log('Converting...');

convertToPdf(testInput, path.join(__dirname, 'outputs'))
  .then(out => {
    console.log('SUCCESS:', out);
    console.log('File size:', fs.statSync(out).size, 'bytes');
  })
  .catch(err => console.error('FAILED:', err.message));
