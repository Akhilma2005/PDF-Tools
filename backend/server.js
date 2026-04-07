require('dotenv').config();
require('./setup');
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const apiRoutes    = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const { startCleanup } = require('./utils/cleanup');

const app  = express();
const PORT = process.env.PORT || 5000;

['uploads', 'outputs'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({ origin: '*', exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/outputs', express.static(path.join(__dirname, 'outputs')));
app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n🚀 PDFTools Backend running on http://localhost:${PORT}`);
  startCleanup();
});
server.timeout        = 120000;
server.headersTimeout = 125000;

module.exports = app;
