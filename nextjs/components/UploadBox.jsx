/* VISUAL_SPLIT_VERSION_2.3 — compress_fix */
import { useState, useRef } from 'react';
import RearrangePreview from './RearrangePreview';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://pdf-tools-2z5n.onrender.com/api';

// Strip /tools prefix: /tools/compress-pdf → /compress-pdf
function toApiPath(p) {
  return (p || '').replace(/^\/tools/, '');
}

export default function UploadBox({ accept = '*', actionLabel = 'Convert', apiPath = '', multiple = false, showSplitOptions = false, showCompressionOptions = false, requiresPassword = false, requiresNewPassword = false }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [splitEveryPage, setSplitEveryPage] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [thumbnails, setThumbnails] = useState(null);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [preset, setPreset] = useState('recommended');
  const [quality] = useState(60);
  const [compressedSize, setCompressedSize] = useState(null);
  const inputRef = useRef();

  const isSplit = toApiPath(apiPath) === '/split-pdf';

  const handleFiles = async (incoming) => {
    const arr = Array.from(incoming);
    if (!arr.length) return;
    setFiles(prev => multiple ? [...prev, ...arr] : [arr[0]]);
    setOriginalFileSize(arr[0].size);
    setStatus('idle');
    setProgress(0);
    setErrorMsg('');
    setDownloadLinks([]);
    setThumbnails(null);
    if (isSplit) fetchThumbnails(arr[0]);
  };

  const fetchThumbnails = async (file) => {
    if (!file) return;
    setLoadingThumbnails(true);
    setStatus('processing');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/get-thumbnails`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setThumbnails(data.thumbnails);
        setOriginalFilename(data.originalFile);
        setOriginalFileSize(data.originalSize || file.size);
        setStatus('idle');
        setProgress(0);
      } else {
        setErrorMsg('Failed to generate page previews. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setStatus('error');
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };

  const handleDownloadFull = async (selectedItems) => {
    setStatus('processing');
    setProgress(10);
    const formData = new FormData();
    formData.append('filename', originalFilename);
    formData.append('pageOrder', JSON.stringify(selectedItems.map(it => it.index)));
    let p = 10;
    const ticker = setInterval(() => { p = Math.min(p + Math.random() * 10, 85); setProgress(Math.round(p)); }, 300);
    try {
      const res = await fetch(`${API}/split-pdf`, { method: 'POST', body: formData });
      const data = await res.json();
      clearInterval(ticker);
      if (data.success) { triggerDownload(data.downloadUrl, data.filename); setProgress(100); setStatus('done'); }
      else { setErrorMsg('Failed to download PDF.'); setStatus('error'); }
    } catch { clearInterval(ticker); setErrorMsg('Failed to download PDF.'); setStatus('error'); }
  };

  const handleAction = async () => {
    if (!files.length) return;
    const backendPath = toApiPath(apiPath);
    if (!backendPath) return;
    const endpoint = `${API}${backendPath}`;
    setStatus('processing');
    setProgress(10);
    setErrorMsg('');
    setDownloadLinks([]);

    const formData = new FormData();
    if (originalFilename && isSplit) {
      formData.append('filename', originalFilename);
    } else if (multiple) {
      files.forEach(f => formData.append('files', f));
    } else {
      formData.append('file', files[0]);
    }
    if (showSplitOptions) formData.append('splitEveryPage', splitEveryPage);
    if (showCompressionOptions) { formData.append('compressionLevel', preset); formData.append('quality', quality); }
    if (requiresPassword || requiresNewPassword) formData.append('password', password);

    let p = 10;
    const ticker = setInterval(() => { p = Math.min(p + Math.random() * 12, 85); setProgress(Math.round(p)); }, 300);
    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      clearInterval(ticker);
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Conversion failed. Please try again.');
        setStatus('error'); setProgress(0); return;
      }
      if (data.files && Array.isArray(data.files)) {
        setDownloadLinks(data.files.map((f, i) => ({
          url: f.downloadUrl, filename: f.filename,
          label: f.pages.length === 1 ? `Page ${f.pages[0]}` : `Part ${i + 1}`,
          pages: f.pages,
        })));
      } else {
        setDownloadLinks([{ url: data.downloadUrl, filename: data.filename, label: 'Download File' }]);
        if (showCompressionOptions && data.compressedSize) setCompressedSize(data.compressedSize);
      }
      setProgress(100); setStatus('done');
    } catch {
      clearInterval(ticker);
      setErrorMsg('Could not connect to server. Please try again.');
      setStatus('error'); setProgress(0);
    }
  };

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const PRESETS = [
    { id: 'extreme',     label: 'Maximum',     icon: '🗜️', desc: 'Smallest file size', color: '#ef4444', ratio: 0.20 },
    { id: 'recommended', label: 'Recommended', icon: '⚡',  desc: 'Best balance',       color: '#5a60ff', ratio: 0.45 },
    { id: 'low',         label: 'Less',        icon: '🖼️', desc: 'Preserve quality',   color: '#16a34a', ratio: 0.70 },
  ];
  const activePreset = PRESETS.find(p => p.id === preset);
  const estimatedSize = Math.round(originalFileSize * activePreset.ratio);

  const reset = () => {
    setFiles([]); setProgress(0); setStatus('idle'); setErrorMsg('');
    setDownloadLinks([]); setThumbnails(null); setLoadingThumbnails(false);
    setCompressedSize(null); setPassword('');
  };

  const formatSize = (bytes) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="upload-section">
      {showCompressionOptions && (
        <div className="compress-meter-card">
          <div className="compress-meter-title">🎚️ Choose Compression Level</div>
          <div className="compress-presets">
            {PRESETS.map(p => (
              <button key={p.id} className={`compress-preset-btn ${preset === p.id ? 'active' : ''}`}
                style={preset === p.id ? { borderColor: p.color, background: `${p.color}12` } : {}}
                onClick={() => setPreset(p.id)}>
                <span className="preset-icon">{p.icon}</span>
                <span className="preset-label" style={preset === p.id ? { color: p.color } : {}}>{p.label}</span>
                <span className="preset-desc">{p.desc}</span>
                {preset === p.id && <span className="preset-check" style={{ background: p.color }}>✓</span>}
              </button>
            ))}
          </div>
          <div className="compress-meter-bar-wrap">
            <div className="compress-meter-labels">
              <span>Original{originalFileSize > 0 ? `: ${formatSize(originalFileSize)}` : ''}</span>
              <span style={{ color: activePreset.color, fontWeight: 700 }}>
                {originalFileSize > 0 ? `~${formatSize(estimatedSize)}` : `~${Math.round(activePreset.ratio * 100)}% of original`}
              </span>
            </div>
            <div className="compress-meter-track">
              <div className="compress-meter-full" />
              <div className="compress-meter-fill" style={{ width: `${activePreset.ratio * 100}%`, background: activePreset.color }} />
            </div>
            <div className="compress-meter-ends"><span>Smallest</span><span>Original size</span></div>
          </div>
        </div>
      )}

      {!files.length ? (
        <div className={`upload-box ${dragging ? 'upload-box-drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}>
          <div className="upload-icon">☁️</div>
          <h3>Drag & Drop your file{multiple ? 's' : ''} here</h3>
          <p>or click to browse from your device</p>
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
            Choose File{multiple ? 's' : ''}
          </button>
          <span className="upload-hint">Supports PDF, Images, Word, Excel, PPT</span>
          <input ref={inputRef} type="file" accept={accept} hidden multiple={multiple}
            onChange={(e) => handleFiles(e.target.files)} />
        </div>
      ) : (
        <div className="file-preview-card">
          {isSplit && loadingThumbnails && (
            <div className="previews-loading-state">
              <div className="spinner"></div>
              <div className="thumb-msg">
                <span className="thumb-msg-1">Generating page previews...</span>
                <span className="thumb-msg-2">Still working — splitting pages...</span>
                <span className="thumb-msg-3">Almost there — converting to images...</span>
                <span className="thumb-msg-4">Large PDF — this may take a moment...</span>
              </div>
              <div className="thumb-progress-track"><div className="thumb-progress-fill" /></div>
            </div>
          )}

          {isSplit && thumbnails ? (
            <>
              {status === 'done' ? (
                <div className="split-results-box">
                  <div className="split-results-title">✅ Your PDF is ready — check your downloads!</div>
                  <button className="btn btn-danger btn-sm" style={{ marginTop: '12px' }} onClick={reset}>✕ Start Over</button>
                </div>
              ) : (
                <RearrangePreview thumbnails={thumbnails} onDownload={handleDownloadFull} loading={status === 'processing'} />
              )}
            </>
          ) : (
            !loadingThumbnails && (
              <>
                <div className="file-preview-info">
                  <div className="file-icon">📄</div>
                  <div>
                    {files.map((f, i) => (
                      <div key={i} className="file-name">{f.name} <span className="file-size">({formatSize(f.size)})</span></div>
                    ))}
                  </div>
                </div>

                {requiresPassword && (
                  <div className="password-input-box">
                    <label className="password-label">🔑 PDF Password</label>
                    <div className="password-field">
                      <input type={showPassword ? 'text' : 'password'} className="password-input"
                        placeholder="Enter PDF password" value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAction()} />
                      <button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="option-help">Leave empty if the PDF has no open password.</p>
                  </div>
                )}

                {requiresNewPassword && (
                  <div className="password-input-box">
                    <label className="password-label">🔒 Set Password</label>
                    <div className="password-field">
                      <input type={showPassword ? 'text' : 'password'} className="password-input"
                        placeholder="Enter a password to protect the PDF" value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAction()} />
                      <button className="password-toggle" type="button" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="option-help">Anyone opening this PDF will need this password.</p>
                  </div>
                )}

                {showSplitOptions && status === 'idle' && (
                  <div className="tool-options-box reveal-scale">
                    <label className="checkbox-container">
                      <input type="checkbox" checked={splitEveryPage} onChange={(e) => setSplitEveryPage(e.target.checked)} />
                      <span className="checkmark"></span>
                      Split every page into a separate PDF
                    </label>
                    <p className="option-help">Every page of your PDF will become its own individual file.</p>
                  </div>
                )}

                {showCompressionOptions && status === 'idle' && (
                  <div className="compress-panel reveal-scale">
                    <div className="compress-presets">
                      {PRESETS.map(p => (
                        <button key={p.id} className={`compress-preset-btn ${preset === p.id ? 'active' : ''}`}
                          style={preset === p.id ? { borderColor: p.color, background: `${p.color}12` } : {}}
                          onClick={() => setPreset(p.id)}>
                          <span className="preset-icon">{p.icon}</span>
                          <span className="preset-label" style={preset === p.id ? { color: p.color } : {}}>{p.label}</span>
                          <span className="preset-desc">{p.desc}</span>
                          {preset === p.id && <span className="preset-check" style={{ background: p.color }}>✓</span>}
                        </button>
                      ))}
                    </div>
                    {originalFileSize > 0 && (
                      <div className="compress-estimate-box">
                        <div className="compress-estimate-row">
                          <div className="compress-estimate-item">
                            <span className="compress-estimate-label">Original</span>
                            <span className="compress-estimate-value original">{formatSize(originalFileSize)}</span>
                          </div>
                          <span className="compress-arrow">→</span>
                          <div className="compress-estimate-item">
                            <span className="compress-estimate-label">Estimated</span>
                            <span className="compress-estimate-value compressed">{formatSize(estimatedSize)}</span>
                          </div>
                          <span className="compress-save-chip">~{Math.round((1 - estimatedSize / originalFileSize) * 100)}% off</span>
                        </div>
                        <div className="compress-bar-track">
                          <div className="compress-bar-fill" style={{ width: `${(estimatedSize / originalFileSize) * 100}%`, background: activePreset.color }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showCompressionOptions && status === 'done' && downloadLinks.length > 0 && (
                  <div className="compress-result-box">
                    <div className="compress-result-title">✅ Compression Complete!</div>
                    <div className="compress-result-stats">
                      <div className="compress-stat"><span className="compress-stat-label">Original</span><span className="compress-stat-value">{formatSize(originalFileSize)}</span></div>
                      <div className="compress-stat"><span className="compress-stat-label">Compressed</span><span className="compress-stat-value">{formatSize(compressedSize || estimatedSize)}</span></div>
                      <div className="compress-stat"><span className="compress-stat-label">Saved</span><span className="compress-stat-value saved">{Math.round((1 - (compressedSize || estimatedSize) / originalFileSize) * 100)}%</span></div>
                    </div>
                    <div className="compress-result-actions">
                      {downloadLinks.map((link, i) => (
                        <button key={i} className="btn btn-primary compress-dl-btn" onClick={() => triggerDownload(link.url, link.filename)}>
                          ⬇️ Download Compressed PDF
                        </button>
                      ))}
                      <button className="btn btn-secondary btn-sm" onClick={reset}>🔄 Compress Another</button>
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {status !== 'idle' && status !== 'error' && !loadingThumbnails && (
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'var(--gradient)' }} />
              </div>
              <span className="progress-label">{status === 'done' ? '✅ Done!' : `${Math.round(progress)}%`}</span>
            </div>
          )}

          {status === 'error' && <div className="error-note">❌ {errorMsg}</div>}

          {!thumbnails && !loadingThumbnails && (
            <div className="file-actions">
              {status === 'idle' && (
                <>
                  {!isSplit ? (
                    <button className="btn btn-primary" onClick={handleAction}>⚡ {actionLabel}</button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => fetchThumbnails(files[0])}>🔄 Retry Previews</button>
                  )}
                  {multiple && (
                    <button className="btn btn-secondary btn-sm" onClick={() => inputRef.current.click()}>➕ Add Files</button>
                  )}
                </>
              )}
              {status === 'done' && !showCompressionOptions && downloadLinks.map((link, i) => (
                <button key={i} className="btn btn-primary" onClick={() => triggerDownload(link.url, link.filename)}>
                  ⬇️ {link.label}
                </button>
              ))}
              {status === 'error' && (
                <button className="btn btn-primary" onClick={() => isSplit ? fetchThumbnails(files[0]) : handleAction()}>
                  🔄 Retry
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={reset}>✕ Start Over</button>
            </div>
          )}

          {thumbnails && (status === 'done' || status === 'error') && (
            <div className="file-actions">
              <button className="btn btn-danger btn-sm" onClick={reset}>✕ Start Over</button>
            </div>
          )}

          <div className="security-note">🔒 Files are auto-deleted after processing. Your privacy is protected.</div>
        </div>
      )}
    </div>
  );
}
