import { useState } from 'react';
import React from 'react';
import Layout from '../components/Layout';
import ToolCard from '../components/ToolCard';
import SEO from '../hooks/SEO';
import { tools } from '../data/tools';
import useInView from '../hooks/useInView';

const faqs = [
  { q: 'Are my files safe?', a: 'Yes. All uploaded files are automatically deleted from our servers after processing. We never store or share your files.' },
  { q: 'Is it really free?', a: 'Absolutely. All tools are 100% free with no hidden charges, no signup required.' },
  { q: 'What file formats are supported?', a: 'We support PDF, DOCX, XLSX, PPTX, JPG, PNG, WebP and more depending on the tool.' },
  { q: 'Is there a file size limit?', a: 'You can upload files up to 100MB per conversion. For larger files, consider compressing first.' },
  { q: 'Do I need to create an account?', a: 'No account needed. Just upload your file, process it, and download — that\'s it.' },
];

function AnimatedSection({ children, className = '', animation = 'reveal' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${animation} ${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

function StaggerGrid({ children, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`stagger ${className}`}>
      {React.Children.toArray(children).map((child, i) => (
        <div key={i} className={`reveal ${inView ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.07}s` }}>
          {child}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filtered = tools.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <SEO
        title="Free Online PDF Tools"
        description="Free online PDF tools — compress, merge, split, convert PDF files instantly. No signup required. 100% free."
        keywords="PDF tools, compress PDF, merge PDF, split PDF, PDF to Word, Word to PDF, free PDF tools online"
        canonical="/"
      />
      <main>
        <section className="hero">
          <div className="blob hero-blob-1"></div>
          <div className="blob hero-blob-2"></div>
          <div className="hero-bg"></div>
          <div className="container hero-content">
            <span className="badge fade-in hero-badge">✨ 100% Free — No Signup Required</span>
            <h1 className="fade-in-delay-1">
              Free Online<br />
              <span className="text-gradient-anim">PDF Tools</span>
            </h1>
            <p className="hero-sub fade-in-delay-2">
              Fast, secure and free PDF tools. No signup required.<br />
              Convert, compress, merge, split, protect and edit PDF files instantly in your browser.
            </p>
            <div className="hero-search fade-in-delay-3">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search tools... e.g. Compress PDF, Word to PDF"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="hero-actions fade-in-delay-3">
              <a href="#tools" className="btn btn-primary btn-lg pulse-btn">Browse All Tools</a>
              <a href="/tools/compress-pdf" className="btn btn-outline btn-lg">Compress PDF →</a>
            </div>
            <div className="hero-stats fade-in-delay-4">
              <div className="stat"><strong>10+</strong><span>PDF Tools</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><strong>100%</strong><span>Free Forever</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><strong>🔒</strong><span>Secure & Private</span></div>
            </div>
            <div className="hero-floaters" aria-hidden="true">
              <span className="floater f1 float">📄</span>
              <span className="floater f2 float-slow">🗜️</span>
              <span className="floater f3 float">✂️</span>
              <span className="floater f4 float-slow">🔗</span>
              <span className="floater f5 float">📊</span>
            </div>
          </div>
        </section>

        <section className="section" id="tools">
          <div className="container">
            <AnimatedSection className="section-title">
              <h2>{search ? `Results for "${search}"` : 'All PDF Tools'}</h2>
              <p>Everything you need to work with PDFs — all in one place</p>
            </AnimatedSection>
            {filtered.length > 0 ? (
              <StaggerGrid className="grid-4">
                {filtered.map(t => <ToolCard key={t.path} {...t} />)}
              </StaggerGrid>
            ) : (
              <div className="no-results"><span>😕</span><p>No tools found for "{search}"</p></div>
            )}
          </div>
        </section>

        <section className="upload-cta-section">
          <div className="container">
            <AnimatedSection animation="reveal-scale">
              <div className="upload-cta-card">
                <div className="upload-cta-text">
                  <h2>Ready to get started?</h2>
                  <p>Drop your PDF file and choose a tool to begin instantly.</p>
                </div>
                <div className="upload-cta-actions">
                  <a href="#tools" className="btn btn-primary btn-lg">Browse All Tools</a>
                  <a href="/tools/compress-pdf" className="btn btn-outline btn-lg">Compress PDF</a>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <AnimatedSection className="section-title">
              <h2>Why Choose PDFTools?</h2>
              <p>Built for speed, privacy, and simplicity</p>
            </AnimatedSection>
            <StaggerGrid className="grid-3">
              {[
                { icon: '⚡', title: 'Lightning Fast', desc: 'Process files in seconds with our optimized cloud engine.' },
                { icon: '🔒', title: 'Secure & Private', desc: 'Files are encrypted in transit and auto-deleted after processing.' },
                { icon: '🆓', title: 'Always Free', desc: 'No subscriptions, no hidden fees. All tools are free forever.' },
                { icon: '📱', title: 'Works Everywhere', desc: 'Use on desktop, tablet, or mobile — no app install needed.' },
                { icon: '🎯', title: 'High Quality', desc: 'Maintain original formatting and quality in every conversion.' },
                { icon: '🌐', title: 'No Signup', desc: 'Start using tools immediately. No account or email required.' },
              ].map(f => (
                <div className="feature-card card" key={f.title}>
                  <div className="feature-icon-wrap"><span className="feature-icon">{f.icon}</span></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </StaggerGrid>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container">
            <AnimatedSection className="section-title">
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about PDFTools</p>
            </AnimatedSection>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <div key={i} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}>
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    <span className={`faq-arrow ${openFaq === i ? 'faq-arrow-open' : ''}`}>▼</span>
                  </button>
                  <div className={`faq-answer-wrap ${openFaq === i ? 'faq-answer-open' : ''}`}>
                    <div className="faq-answer"><p>{f.a}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export async function getStaticProps() {
  return { props: {} };
}
