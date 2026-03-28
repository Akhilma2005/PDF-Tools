#!/usr/bin/env node
// Applies the qpdf QPDF_BIN fix directly — replaces patch-package
const fs   = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/node-qpdf2/dist/spawn.js');

if (!fs.existsSync(target)) {
  console.log('fix-qpdf: spawn.js not found, skipping');
  process.exit(0);
}

const patched = `// Ignore errors about unsafe-arguments, this is because data is unknown
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { spawn } from "node:child_process";
export default (callArguments) => new Promise((resolve, reject) => {
    const qpdfBin = process.env.QPDF_BIN || "qpdf";
    const child = spawn(qpdfBin, callArguments);
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (data) => {
        stdout.push(data);
    });
    child.stderr.on("data", (data) => {
        /* c8 ignore next */
        stderr.push(data);
    });
    child.on("error", (error) => {
        /* c8 ignore next */
        reject(error);
    });
    child.on("close", (code) => {
        if (code === 0) {
            resolve(Buffer.from(stdout.join("")));
        }
        else {
            // There is a problem from qpdf
            reject(Buffer.from(stderr.join("")).toLocaleString());
        }
    });
});
`;

const current = fs.readFileSync(target, 'utf8');
if (current.includes('QPDF_BIN')) {
  console.log('fix-qpdf: already patched, skipping');
  process.exit(0);
}

fs.writeFileSync(target, patched, 'utf8');
console.log('fix-qpdf: patched node-qpdf2/dist/spawn.js successfully');
