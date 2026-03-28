const libre = require('libreoffice-convert');
const fs = require('fs');
const path = require('path');

async function check() {
  const dummyPath = path.join(__dirname, 'dummy.txt');
  fs.writeFileSync(dummyPath, 'Hello World');
  
  console.log('Testing libreoffice-convert with dummy.txt...');
  try {
    const input = fs.readFileSync(dummyPath);
    // Trying '.pdf' vs 'pdf'
    const output = await libre.convert(input, '.pdf', undefined);
    console.log('Output length with ".pdf":', output.length);
    if (output.length > 5 && output.toString('utf8', 0, 4) === '%PDF') {
        console.log('✅ Valid PDF header found with ".pdf"');
    } else {
        console.log('❌ Invalid PDF header with ".pdf":', output.toString('utf8', 0, 20));
    }
  } catch (err) {
    console.log('❌ Error with ".pdf":', err.message);
  }

  try {
    const input = fs.readFileSync(dummyPath);
    const output = await libre.convert(input, 'pdf', undefined);
    console.log('Output length with "pdf":', output.length);
    if (output.length > 5 && output.toString('utf8', 0, 4) === '%PDF') {
        console.log('✅ Valid PDF header found with "pdf"');
    } else {
        console.log('❌ Invalid PDF header with "pdf":', output.toString('utf8', 0, 20));
    }
  } catch (err) {
    console.log('❌ Error with "pdf":', err.message);
  }
}

check();
