import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import ToolCard from './ToolCard';
import useInView from '../hooks/useInView';
import { tools } from '../data/tools';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const TOOLS = [
  { id: 'select',    icon: '🖱️',  label: 'Select'    },
  { id: 'text',      icon: 'T',    label: 'Add Text'  },
  { id: 'draw',      icon: '✏️',  label: 'Draw'      },
  { id: 'highlight', icon: '🖊️', label: 'Highlight'  },
  { id: 'erase',     icon: '🧹',  label: 'Erase'     },
];

const COLORS = ['#1a1a2e', '#ef4444', '#5a60ff', '#16a34a', '#f59e0b', '#ec4899'];
const SIZES  = [2, 4, 8, 14, 20];

export default function PdfEditorClient() {
  const [file, setFile]           = useState(null);
  const [pages, setPages]         = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [color, setColor]         = useState('#1a1a2e');
  const [size, setSize]           = useState(4);
  const [fontSize, setFontSize]   = useState(16);
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos]     = useState(null);
  const fileInputRef = useRef();
  const drawingRef   = useRef({});

  const loadPdf = useCallback(async (f) => {
    setLoading(true); setPages([]); setSelectedAnnotation(null); setTextPos(null);
    try {
      const buf = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      const loaded = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        loaded.push({ canvas, annotations: [], width: viewport.width, height: viewport.height });
      }
      setPages(loaded);
    } catch (e) { alert('Failed to load PDF: ' + e.message); }
    setLoading(false);
  }, []);

  const handleFile = (f) => { if (!f || f.type !== 'application/pdf') return; setFile(f); loadPdf(f); };

  const renderPage = useCallback((pageIdx, overlayCanvas) => {
    if (!pages[pageIdx]) return;
    const { canvas, annotations } = pages[pageIdx];
    const ctx = overlayCanvas.getContext('2d');
    overlayCanvas.width = canvas.width; overlayCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    annotations.forEach((ann, annIdx) => {
      const isSelected = selectedAnnotation?.pageIdx === pageIdx && selectedAnnotation?.annIdx === annIdx;
      if (ann.type === 'draw' || ann.type === 'highlight') {
        ctx.save(); ctx.strokeStyle = ann.color; ctx.lineWidth = ann.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (ann.type === 'highlight') { ctx.globalAlpha = 0.35; ctx.lineWidth = ann.size * 3; }
        ctx.beginPath(); ann.path.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.stroke(); ctx.restore();
      } else if (ann.type === 'text') {
        ctx.save(); ctx.font = `${ann.size}px Inter, sans-serif`; ctx.fillStyle = ann.color;
        ctx.fillText(ann.text, ann.x, ann.y);
        if (isSelected) {
          const w = ctx.measureText(ann.text).width;
          ctx.strokeStyle = '#5a60ff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
          ctx.strokeRect(ann.x - 4, ann.y - ann.size - 2, w + 8, ann.size + 8);
        }
        ctx.restore();
      }
    });
  }, [pages, selectedAnnotation]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const onPointerDown = (e, pageIdx, overlayCanvas) => {
    const pos = getPos(e, overlayCanvas);
    if (activeTool === 'select') {
      const anns = pages[pageIdx].annotations;
      for (let i = anns.length - 1; i >= 0; i--) {
        const ann = anns[i];
        if (ann.type === 'text') {
          const ctx = overlayCanvas.getContext('2d'); ctx.font = `${ann.size}px Inter, sans-serif`;
          const w = ctx.measureText(ann.text).width;
          if (pos.x >= ann.x - 4 && pos.x <= ann.x + w + 4 && pos.y >= ann.y - ann.size - 2 && pos.y <= ann.y + 8) { setSelectedAnnotation({ pageIdx, annIdx: i }); return; }
        }
      }
      setSelectedAnnotation(null); return;
    }
    if (activeTool === 'text') { setTextPos({ pageIdx, x: pos.x, y: pos.y }); setTextInput(''); return; }
    if (activeTool === 'erase') {
      setPages(prev => {
        const next = [...prev]; const anns = [...next[pageIdx].annotations];
        for (let i = anns.length - 1; i >= 0; i--) {
          const ann = anns[i];
          if (ann.type === 'text') {
            const ctx = overlayCanvas.getContext('2d'); ctx.font = `${ann.size}px Inter, sans-serif`;
            const w = ctx.measureText(ann.text).width;
            if (pos.x >= ann.x - 4 && pos.x <= ann.x + w + 4 && pos.y >= ann.y - ann.size - 2 && pos.y <= ann.y + 8) { anns.splice(i, 1); next[pageIdx] = { ...next[pageIdx], annotations: anns }; return next; }
          } else if (ann.type === 'draw' || ann.type === 'highlight') {
            if (ann.path.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < 12)) { anns.splice(i, 1); next[pageIdx] = { ...next[pageIdx], annotations: anns }; return next; }
          }
        }
        return next;
      }); return;
    }
    drawingRef.current[pageIdx] = { isDown: true, path: [pos] };
  };

  const onPointerMove = (e, pageIdx, overlayCanvas) => {
    const state = drawingRef.current[pageIdx];
    if (!state?.isDown) return;
    const pos = getPos(e, overlayCanvas); state.path.push(pos);
    const ctx = overlayCanvas.getContext('2d');
    const { canvas, annotations } = pages[pageIdx];
    ctx.drawImage(canvas, 0, 0);
    annotations.forEach((ann, annIdx) => {
      const isSelected = selectedAnnotation?.pageIdx === pageIdx && selectedAnnotation?.annIdx === annIdx;
      if (ann.type === 'draw' || ann.type === 'highlight') {
        ctx.save(); ctx.strokeStyle = ann.color; ctx.lineWidth = ann.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (ann.type === 'highlight') { ctx.globalAlpha = 0.35; ctx.lineWidth = ann.size * 3; }
        ctx.beginPath(); ann.path.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.stroke(); ctx.restore();
      } else if (ann.type === 'text') {
        ctx.save(); ctx.font = `${ann.size}px Inter, sans-serif`; ctx.fillStyle = ann.color; ctx.fillText(ann.text, ann.x, ann.y);
        if (isSelected) { const w = ctx.measureText(ann.text).width; ctx.strokeStyle = '#5a60ff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.strokeRect(ann.x - 4, ann.y - ann.size - 2, w + 8, ann.size + 8); }
        ctx.restore();
      }
    });
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (activeTool === 'highlight') { ctx.globalAlpha = 0.35; ctx.lineWidth = size * 3; }
    ctx.beginPath(); state.path.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    ctx.stroke(); ctx.restore();
  };

  const onPointerUp = (e, pageIdx) => {
    const state = drawingRef.current[pageIdx];
    if (!state?.isDown) return; state.isDown = false;
    if (state.path.length < 2) return;
    setPages(prev => { const next = [...prev]; next[pageIdx] = { ...next[pageIdx], annotations: [...next[pageIdx].annotations, { type: activeTool, color, size, path: state.path }] }; return next; });
    drawingRef.current[pageIdx] = null;
  };

  const commitText = () => {
    if (!textInput.trim() || !textPos) { setTextPos(null); return; }
    const { pageIdx, x, y } = textPos;
    setPages(prev => { const next = [...prev]; next[pageIdx] = { ...next[pageIdx], annotations: [...next[pageIdx].annotations, { type: 'text', text: textInput, x, y, color, size: fontSize }] }; return next; });
    setTextPos(null); setTextInput('');
  };

  const undoPage = (pageIdx) => {
    setPages(prev => { const next = [...prev]; const anns = [...next[pageIdx].annotations]; if (!anns.length) return prev; anns.pop(); next[pageIdx] = { ...next[pageIdx], annotations: anns }; return next; });
    setSelectedAnnotation(null);
  };

  const deletePage = (pageIdx) => { setPages(prev => prev.filter((_, i) => i !== pageIdx)); if (selectedAnnotation?.pageIdx === pageIdx) setSelectedAnnotation(null); };

  const deleteSelected = useCallback(() => {
    if (!selectedAnnotation) return;
    const { pageIdx, annIdx } = selectedAnnotation;
    setPages(prev => { const next = [...prev]; const anns = [...next[pageIdx].annotations]; anns.splice(annIdx, 1); next[pageIdx] = { ...next[pageIdx], annotations: anns }; return next; });
    setSelectedAnnotation(null);
  }, [selectedAnnotation]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelected]);

  const exportPdf = async () => {
    if (!pages.length) return; setExporting(true);
    try {
      const pdfDocOut = await PDFDocument.create();
      for (const pg of pages) {
        const flat = document.createElement('canvas'); flat.width = pg.canvas.width; flat.height = pg.canvas.height;
        const ctx = flat.getContext('2d'); ctx.drawImage(pg.canvas, 0, 0);
        pg.annotations.forEach(ann => {
          if (ann.type === 'draw' || ann.type === 'highlight') {
            ctx.save(); ctx.strokeStyle = ann.color; ctx.lineWidth = ann.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (ann.type === 'highlight') { ctx.globalAlpha = 0.35; ctx.lineWidth = ann.size * 3; }
            ctx.beginPath(); ann.path.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
            ctx.stroke(); ctx.restore();
          } else if (ann.type === 'text') { ctx.save(); ctx.font = `${ann.size}px Inter, sans-serif`; ctx.fillStyle = ann.color; ctx.fillText(ann.text, ann.x, ann.y); ctx.restore(); }
        });
        const imgData = flat.toDataURL('image/jpeg', 0.92);
        const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
        const img = await pdfDocOut.embedJpg(imgBytes);
        const pdfPage = pdfDocOut.addPage([pg.width, pg.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: pg.width, height: pg.height });
      }
      const bytes = await pdfDocOut.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = (file?.name?.replace('.pdf', '') || 'edited') + '_edited.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
    setExporting(false);
  };

  function PageCanvas({ pageIdx }) {
    const ref = useRef();
    useEffect(() => { if (ref.current) renderPage(pageIdx, ref.current); });
    const cursor = activeTool === 'text' ? 'text' : activeTool === 'erase' ? 'cell' : activeTool === 'select' ? 'default' : 'crosshair';
    return (
      <canvas ref={ref} className="editor-page-canvas" style={{ cursor }}
        onPointerDown={e => onPointerDown(e, pageIdx, ref.current)}
        onPointerMove={e => onPointerMove(e, pageIdx, ref.current)}
        onPointerUp={e => onPointerUp(e, pageIdx)}
        onPointerLeave={e => onPointerUp(e, pageIdx)} />
    );
  }

  if (!file || loading) {
    const related = tools.filter(t => t.path !== '/pdf-editor').slice(0, 4);
    const [gridRef, gridInView] = useInView();
    return (
      <main className="tool-page">
        <section className="tool-hero">
          <div className="blob tool-blob-1" />
          <div className="container">
            <div className="tool-hero-inner">
              <div className="tool-hero-icon float" style={{ background: 'rgba(90,96,255,0.1)' }}>✏️</div>
              <div>
                <span className="badge">Free Tool</span>
                <h1>PDF Editor</h1>
                <p className="tool-hero-desc">Add text, draw, highlight, and annotate your PDF — all in the browser. No uploads needed.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="section-sm">
          <div className="container">
            <div className={`editor-dropzone ${dragging ? 'editor-dropzone-drag' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current.click()}>
              {loading ? (
                <><div className="spinner" style={{ width: 44, height: 44, border: '4px solid rgba(90,96,255,0.12)', borderLeftColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} /><p style={{ color: 'var(--muted)' }}>Loading PDF…</p></>
              ) : (
                <>
                  <div className="upload-icon">☁️</div>
                  <h3>Drag & Drop your PDF here</h3>
                  <p>or click to browse from your device</p>
                  <button className="btn btn-primary" onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>Choose PDF</button>
                  <span className="upload-hint">Only PDF files are supported</span>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>
        </section>
        <section className="section how-section">
          <div className="container">
            <div className="section-title"><h2>How It Works</h2><p>Three simple steps — done in seconds</p></div>
            <div className="steps">
              {[{ n: '1', icon: '📁', title: 'Upload PDF', desc: 'Drag & drop or click to select your PDF file.' }, { n: '2', icon: '✏️', title: 'Edit & Annotate', desc: 'Add text, draw, highlight or erase directly on the PDF pages.' }, { n: '3', icon: '⬇️', title: 'Download', desc: 'Download your edited PDF instantly — processed entirely in your browser.' }].map(s => (
                <div key={s.n} className="step-card"><div className="step-number">{s.n}</div><div className="step-icon">{s.icon}</div><h3>{s.title}</h3><p>{s.desc}</p></div>
              ))}
            </div>
          </div>
        </section>
        <section className="section" style={{ background: 'var(--light)' }}>
          <div className="container">
            <div className="section-title"><h2>More PDF Tools</h2><p>Explore other tools you might need</p></div>
            <div ref={gridRef} className="grid-4">
              {related.map((t, i) => (
                <div key={t.path} className={`reveal ${gridInView ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <ToolCard {...t} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <button className="editor-back-btn" onClick={() => { setFile(null); setPages([]); }}>← Back</button>
          <span className="editor-filename">{file.name}</span>
        </div>
        <div className="editor-tools">
          {TOOLS.map(t => (
            <button key={t.id} className={`editor-tool-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => { setActiveTool(t.id); setTextPos(null); setSelectedAnnotation(null); }} title={t.label}>
              <span className="editor-tool-icon">{t.icon}</span>
              <span className="editor-tool-label">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="editor-toolbar-right">
          {(activeTool === 'draw' || activeTool === 'highlight') && (
            <div className="editor-size-picker">
              {SIZES.map(s => <button key={s} className={`editor-size-dot ${size === s ? 'active' : ''}`} style={{ width: s + 10, height: s + 10 }} onClick={() => setSize(s)} />)}
            </div>
          )}
          {activeTool === 'text' && (
            <select className="editor-font-size" value={fontSize} onChange={e => setFontSize(+e.target.value)}>
              {[10,12,14,16,18,20,24,28,32,40,48].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          )}
          {activeTool !== 'select' && activeTool !== 'erase' && (
            <div className="editor-colors">
              {COLORS.map(c => <button key={c} className={`editor-color-dot ${color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}
            </div>
          )}
          {selectedAnnotation && <button className="btn btn-danger btn-sm" onClick={deleteSelected}>🗑️ Delete</button>}
          <button className="btn btn-primary btn-sm editor-export-btn" onClick={exportPdf} disabled={exporting}>
            {exporting ? '⏳ Exporting…' : '⬇️ Download PDF'}
          </button>
        </div>
      </div>
      <div className="editor-canvas-area">
        {pages.map((pg, i) => (
          <div key={i} className="editor-page-wrap">
            <div className="editor-page-header">
              <span className="editor-page-label">Page {i + 1}</span>
              <button className="editor-page-undo" onClick={() => undoPage(i)} disabled={!pg.annotations.length}>↩ Undo</button>
              <button className="editor-page-delete" onClick={() => deletePage(i)}>🗑️</button>
            </div>
            <PageCanvas pageIdx={i} />
          </div>
        ))}
      </div>
      {textPos && (
        <div className="editor-text-overlay" onClick={e => { if (e.target === e.currentTarget) commitText(); }}>
          <div className="editor-text-popup">
            <p className="editor-text-popup-hint">Type your text, then click Add</p>
            <input autoFocus className="editor-text-input" value={textInput} onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
              placeholder="Enter text…" style={{ color, fontSize }} />
            <div className="editor-text-actions">
              <button className="btn btn-primary btn-sm" onClick={commitText}>Add Text</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setTextPos(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
