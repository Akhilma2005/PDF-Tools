const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.warn(`Warning: ${cmd} failed — ${e.message}`);
  }
}

// Only run on Linux (Render)
if (process.platform !== 'linux') {
  console.log('Not Linux, skipping system deps install.');
  process.exit(0);
}

console.log('Installing system dependencies via apt-get (no sudo needed on Render build)...');
run('apt-get update -qq');
run('apt-get install -y -qq libreoffice qpdf --no-install-recommends');
console.log('Done.');
