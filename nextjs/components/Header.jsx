import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navLink = (href, label) => (
    <Link href={href} onClick={() => setOpen(false)}
      className={router.pathname === href ? 'active' : ''}>
      {label}
    </Link>
  );

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">📄</span>
          <span className="logo-text">PDF<span className="text-gradient">Tools</span></span>
        </Link>
        <nav className={`nav ${open ? 'nav-open' : ''}`}>
          {navLink('/', 'Home')}
          {navLink('/about', 'About')}
          {navLink('/contact', 'Contact')}
          <Link href="/tools/image-to-pdf" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
            Try Tools
          </Link>
        </nav>
        <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
          <span className={open ? 'bar bar-open' : 'bar'}></span>
          <span className={open ? 'bar bar-open' : 'bar'}></span>
          <span className={open ? 'bar bar-open' : 'bar'}></span>
        </button>
      </div>
    </header>
  );
}
