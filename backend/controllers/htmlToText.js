const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No HTML file uploaded');

  try {
    const html = fs.readFileSync(req.file.path, 'utf8');
    const text = stripHtml(html);
    const outName = `${uuidv4()}.txt`;
    fs.writeFileSync(outputPath(outName), text, 'utf8');
    deleteFile(req.file.path);

    success(res, {
      message: 'HTML converted to text successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=extracted-text`,
    });
  } catch (err) {
    deleteFile(req.file.path);
    error(res, `Conversion failed: ${err.message}`, 500);
  }
};
