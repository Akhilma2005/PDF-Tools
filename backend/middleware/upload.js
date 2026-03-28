const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const allowedTypes = {
  'image-to-pdf':  /image|jpeg|jpg|png|webp|gif|pdf|msword|wordprocessingml|doc|docx|excel|spreadsheetml|xls|xlsx|powerpoint|presentationml|ppt|pptx|tiff|bmp|jfif/,
  'merge-pdf':     /image|jpeg|jpg|png|webp|gif|pdf|msword|wordprocessingml|doc|docx|excel|spreadsheetml|xls|xlsx|powerpoint|presentationml|ppt|pptx|tiff|bmp|jfif/,


  'compress-pdf':  /image|jpeg|jpg|png|webp|gif|pdf|msword|wordprocessingml|doc|docx|excel|spreadsheetml|xls|xlsx|powerpoint|presentationml|ppt|pptx|tiff|bmp|jfif/,

  'split-pdf':     /pdf/,
  'word-to-pdf':   /msword|wordprocessingml|doc|docx/,
  'pdf-to-word':   /pdf/,
  'excel-to-pdf':  /excel|spreadsheetml|xls|xlsx/,
  'ppt-to-pdf':    /powerpoint|presentationml|ppt|pptx/,
  'pdf-unlock':    /pdf/,
  'pdf-protect':   /pdf/,
  'pdf-to-text':   /pdf/,
  'pdf-to-ppt':    /pdf/,
  'rearrange-pdf': /pdf/,
  'html-to-text':  /html/,
  'html-to-pdf':   /html/,
};

const fileFilter = (req, file, cb) => {
  const tool = req.params.tool || req.path.replace('/', '');
  const allowed = allowedTypes[tool];
  const mimetype = allowed ? allowed.test(file.mimetype) : true;
  const extname = allowed ? allowed.test(path.extname(file.originalname).toLowerCase().replace('.', '')) : true;
  if (mimetype || extname) return cb(null, true);
  cb(new Error(`Invalid file type for tool: ${tool}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024 },
});

module.exports = upload;
