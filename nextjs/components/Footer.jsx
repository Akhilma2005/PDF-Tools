import Link from 'next/link';

const tools = [
  { label: 'Image to PDF', path: '/tools/image-to-pdf' },
  { label: 'Merge PDF', path: '/tools/merge-pdf' },
  { label: 'Compress PDF', path: '/tools/compress-pdf' },
  { label: 'Split PDF', path: '/tools/split-pdf' },
  { label: 'Word to PDF', path: '/tools/word-to-pdf' },
  { label: 'PDF to Word', path: '/tools/pdf-to-word' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="logo" style={{ marginBottom: 12 }}>
            <span>📄</span>
            <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>PDF<span className="text-gradient">Tools</span></span>
          </div>
          <p>Fast, secure & free PDF tools for everyone. No signup required.</p>
        </div>
        <div>
          <h4 className="footer-heading">Tools</h4>
          <ul className="footer-links">
            {tools.map(t => <li key={t.path}><Link href={t.path}>{t.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="footer-heading">More Tools</h4>
          <ul className="footer-links">
            <li><Link href="/tools/excel-to-pdf">Excel to PDF</Link></li>
            <li><Link href="/tools/ppt-to-pdf">PowerPoint to PDF</Link></li>
            <li><Link href="/tools/pdf-unlock">PDF Unlock</Link></li>
            <li><Link href="/tools/pdf-to-text">PDF to Text</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} PDFTools. All rights reserved. Files are auto-deleted after processing. 🔒</p>
        </div>
      </div>
    </footer>
  );
}
