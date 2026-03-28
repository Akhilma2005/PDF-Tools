import { useState } from 'react';

export default function RearrangePreview({ thumbnails, onDownload, loading = false }) {
  const [items, setItems] = useState(thumbnails);
  const [selected, setSelected] = useState(() => new Set(thumbnails.map((_, i) => i)));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const toggleSelect = (e, index) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const allSelected = selected.size === items.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((_, i) => i)));

  // ── Drag to reorder ──────────────────────────────────────
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setOverIndex(index);
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const [moved] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, moved);

    // keep selected set in sync with new positions
    const newSelected = new Set();
    selected.forEach(si => {
      if (si === draggedIndex) { newSelected.add(index); return; }
      if (draggedIndex < index) {
        newSelected.add(si > draggedIndex && si <= index ? si - 1 : si);
      } else {
        newSelected.add(si >= index && si < draggedIndex ? si + 1 : si);
      }
    });

    setDraggedIndex(index);
    setItems(newItems);
    setSelected(newSelected);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const handleDownload = () => {
    const selectedItems = items.filter((_, i) => selected.has(i));
    if (selectedItems.length) onDownload(selectedItems);
  };

  return (
    <div className="rearrange-container">
      <div className="rearrange-toolbar">
        <button className="btn-text" onClick={toggleAll}>
          {allSelected ? '☐ Deselect All' : '☑ Select All'}
        </button>
        <span className="selected-count">
          {selected.size} / {items.length} pages selected
        </span>
      </div>

      <div className="thumbnails-grid">
        {items.map((item, index) => (
          <div
            key={item.filename}
            className={[
              'thumbnail-card',
              selected.has(index) ? 'is-selected' : '',
              draggedIndex === index ? 'is-dragging' : '',
              overIndex === index && draggedIndex !== index ? 'is-over' : '',
            ].join(' ')}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* checkbox */}
            <div
              className={`page-checkbox ${selected.has(index) ? 'checked' : ''}`}
              onClick={(e) => toggleSelect(e, index)}
            >
              {selected.has(index) && <span>✓</span>}
            </div>

            {/* thumbnail image */}
            <div className="thumbnail-img-wrap">
              <img src={item.url} alt={`Page ${item.index + 1}`} loading="lazy" />
            </div>

            {/* page number */}
            <div className="page-label">Page {index + 1}</div>
          </div>
        ))}
      </div>

      <div className="rearrange-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleDownload}
          disabled={selected.size === 0 || loading}
        >
          {loading ? '⏳ Processing...' : <>⬇️ Download PDF&nbsp;<span className="page-count-badge">{selected.size} page{selected.size !== 1 ? 's' : ''}</span></>}
        </button>
      </div>
    </div>
  );
}
