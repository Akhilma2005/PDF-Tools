const { findSoffice, convertToPdf } = require('../utils/libreoffice');
const path = require('path');
const fs = require('fs');

async function verify() {
  console.log('--- LibreOffice Verification ---');
  
  const soffice = findSoffice();
  console.log(`Located soffice at: ${soffice}`);
  
  try {
    // We can't easily run a full conversion without a sample file,
    // but we can at least check if the path exists if it's not the default 'soffice'.
    if (soffice !== 'soffice') {
      if (fs.existsSync(soffice)) {
          console.log('✅ Specific LibreOffice executable found on disk.');
      } else {
          console.log('❌ Specific LibreOffice executable NOT found on disk.');
      }
    } else {
        console.log('ℹ️ Using default "soffice" from PATH. Ensure it is installed and in your environment variables.');
    }

    console.log('\n--- Environment Check ---');
    console.log(`Platform: ${process.platform}`);
    console.log(`Outputs DIR exists: ${fs.existsSync(path.join(__dirname, '../outputs'))}`);

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

verify();
