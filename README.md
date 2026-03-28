# PDF Tools

A full-stack web application for working with PDF files. Built with **Next.js** (frontend) and **Node.js/Express** (backend), deployed on **Vercel** + **Render**.

🌐 **Live Site**: https://mypdfcastle.vercel.app  
🔧 **Backend API**: https://pdf-tools-bzm0.onrender.com/api

---

## Project Structure

```
pdf_maker/
├── nextjs/        # Next.js frontend (Vercel)
├── backend/       # Node.js/Express backend (Render - Docker)
└── render.yaml    # Render deployment config
```

---

## Frontend — `nextjs/`

Built with **Next.js** (Pages Router), deployed on **Vercel**.

### Tech Stack
- Next.js 14
- React
- CSS Modules + custom CSS

### Pages
| Route | Description |
|-------|-------------|
| `/` | Home — tool grid, search, FAQ |
| `/tools/[slug]` | Dynamic tool page |
| `/tools/pdf-editor` | PDF editor (canvas-based) |
| `/about` | About page |
| `/contact` | Contact page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/404` | Custom not found page |

### Key Components
| Component | Description |
|-----------|-------------|
| `UploadBox` | File upload, progress, download |
| `ToolCard` | Tool grid card |
| `ToolPage` | Shared tool page layout |
| `RearrangePreview` | PDF page drag-and-drop for split tool |
| `PdfEditorClient` | Canvas-based PDF annotation editor |
| `Layout` | Header + Footer wrapper |

### Environment Variables
Create `nextjs/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Run Locally
```bash
cd nextjs
npm install
npm run dev
```
Open http://localhost:3000

### Build & Deploy
```bash
npm run build
npm start
```
Deployed automatically to **Vercel** on push to `main`.

---

## Backend — `backend/`

Built with **Node.js + Express**, deployed on **Render** using **Docker**.

### Tech Stack
- Node.js 20
- Express 5
- LibreOffice (Word/Excel/PPT conversion)
- qpdf (PDF protect/unlock)
- poppler-utils (PDF thumbnails)
- pdf-lib (merge, split, rearrange)
- sharp (image processing)
- pdf-parse (text extraction)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/image-to-pdf` | Convert images to PDF |
| POST | `/api/merge-pdf` | Merge multiple PDFs |
| POST | `/api/compress-pdf` | Compress PDF |
| POST | `/api/split-pdf` | Split PDF into pages |
| POST | `/api/get-thumbnails` | Generate page thumbnails |
| POST | `/api/word-to-pdf` | Convert DOCX to PDF |
| POST | `/api/pdf-to-word` | Convert PDF to DOCX |
| POST | `/api/excel-to-pdf` | Convert XLSX to PDF |
| POST | `/api/ppt-to-pdf` | Convert PPTX to PDF |
| POST | `/api/pdf-to-ppt` | Convert PDF to PPTX |
| POST | `/api/pdf-protect` | Add password to PDF |
| POST | `/api/pdf-unlock` | Remove password from PDF |
| POST | `/api/pdf-to-text` | Extract text from PDF |
| POST | `/api/html-to-text` | Extract text from HTML |
| POST | `/api/html-to-pdf` | Convert HTML to PDF |
| POST | `/api/rearrange-pdf` | Rearrange PDF pages |
| GET | `/api/download/:filename` | Download processed file |
| GET | `/api/health` | Health check |
| GET | `/api/debug-env` | Debug environment info |

### Environment Variables
Create `backend/.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE_MB=100
FILE_EXPIRY_MINUTES=60
QPDF_BIN=C:\Program Files\qpdf 12.3.2\bin\qpdf.exe   # Windows only
```

### Run Locally
Requires **LibreOffice**, **qpdf**, and **poppler-utils** installed on your system.

```bash
cd backend
npm install
npm run dev
```
API runs on http://localhost:5000

### Docker
```bash
cd backend
docker build -t pdf-tools-backend .
docker run -p 5000:5000 pdf-tools-backend
```

The Dockerfile installs LibreOffice, qpdf, and poppler-utils automatically.

### Deployment (Render)
- Runtime: **Docker**
- Dockerfile path: `./backend/Dockerfile`
- Processed files are auto-deleted after `FILE_EXPIRY_MINUTES` minutes

---

## Deployment

### Frontend — Vercel
1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `nextjs`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://pdf-tools-bzm0.onrender.com/api`
4. Deploy

### Backend — Render
1. Create new **Web Service** on Render
2. Connect GitHub repo
3. Set **Runtime** to `Docker`
4. Set **Dockerfile Path** to `./backend/Dockerfile`
5. Add environment variables:
   - `PORT` = `5000`
   - `MAX_FILE_SIZE_MB` = `100`
   - `FILE_EXPIRY_MINUTES` = `60`
6. Deploy

---

## Local Development (Full Stack)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd nextjs
npm install
npm run dev
```

Make sure `nextjs/.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
