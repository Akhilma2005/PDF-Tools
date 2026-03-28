const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');
const fs = require('fs');

async function main() {
  const data = new Uint8Array(fs.readFileSync('test.pdf'));
  const doc  = await pdfjsLib.getDocument({ data, disableFontFace: true }).promise;
  const page = await doc.getPage(1);
  const vp   = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(vp.width, vp.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  const buf = canvas.toBuffer('image/jpeg', { quality: 0.85 });
  console.log('JPEG size:', buf.length, 'bytes — OK');
}
main().catch(e => console.error('FAIL:', e.message));
