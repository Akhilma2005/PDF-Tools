const { convertToPdf } = require('../utils/libreoffice');
const path = require('path');
const fs = require('fs');

async function test() {
    const input = path.join(__dirname, 'test.pdf');
    if (!fs.existsSync(input)) {
        console.log("No test.pdf found.");
        return;
    }
    const outDir = path.join(__dirname, 'test_thumbs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    try {
        console.log("Converting...");
        const result = await convertToPdf(input, outDir, 'jpg');
        console.log("Result path:", result);
        console.log("File exists:", fs.existsSync(result));
        if (fs.existsSync(result)) {
            console.log("File size:", fs.statSync(result).size);
        }
    } catch (err) {
        console.error("Conversion ERROR:", err.message);
        console.log("Files in outDir:", fs.readdirSync(outDir));
    }
}

test();
