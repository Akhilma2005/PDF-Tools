import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import ToolCard from '../components/ToolCard';
import Layout from '../components/Layout';
import SEO from '../hooks/SEO';
import { tools } from '../data/tools';
import useInView from '../hooks/useInView';

const UploadBox = dynamic(() => import('../components/UploadBox'), { ssr: false });

function Reveal({ children, animation = 'reveal', delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${animation} ${inView ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

export default function ToolPage({ tool, showCompressionOptions = false }) {
  const router = useRouter();
  const related = tools.filter(t => t.path !== tool.path).slice(0, 4);
  const [gridRef, gridInView] = useInView();

  return (
    <Layout>
      <SEO
        title={tool.title}
        description={tool.longDesc || tool.description}
        keywords={`${tool.title}, free ${tool.title} online, ${tool.title} tool, PDF converter`}
        canonical={tool.path}
      />
      <main className="tool-page">
        <section className="tool-hero">
          <div className="blob tool-blob-1"></div>
          <div className="container">
            <button className="back-btn" onClick={() => router.back()}>← Back</button>
            <div className="tool-hero-inner">
              <Reveal animation="reveal-scale" delay={0}>
                <div className="tool-hero-icon float" style={{ background: tool.color }}>{tool.icon}</div>
              </Reveal>
              <div>
                <Reveal delay={0.05}><span className="badge">Free Tool</span></Reveal>
                <Reveal delay={0.12}><h1>{tool.title}</h1></Reveal>
                <Reveal delay={0.2}><p className="tool-hero-desc">{tool.longDesc || tool.description}</p></Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="container">
            <Reveal animation="reveal-scale">
              {tool.comingSoon ? (
                <div className="coming-soon-box">
                  <div className="coming-soon-icon">🔧</div>
                  <h2>Coming Soon</h2>
                  <p>We're working hard to bring this feature online. Check back soon!</p>
                </div>
              ) : (
                <UploadBox
                  accept={tool.accept}
                  actionLabel={tool.action}
                  apiPath={tool.path}
                  multiple={tool.multiple || false}
                  showSplitOptions={tool.showSplitOptions || false}
                  showCompressionOptions={showCompressionOptions}
                  requiresPassword={tool.requiresPassword || false}
                  requiresNewPassword={tool.requiresNewPassword || false}
                />
              )}
            </Reveal>
          </div>
        </section>

        <section className="section how-section">
          <div className="container">
            <Reveal className="section-title">
              <h2>How It Works</h2>
              <p>Three simple steps — done in seconds</p>
            </Reveal>
            <div className="steps">
              {[
                { n: '1', icon: '📁', title: 'Upload File', desc: 'Drag & drop or click to select your file from your device.' },
                { n: '2', icon: '⚙️', title: tool.action, desc: 'Our engine processes your file instantly in the cloud.' },
                { n: '3', icon: '⬇️', title: 'Download', desc: "Download your converted file. It's auto-deleted after 1 hour." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 0.12}>
                  <div className="step-card">
                    <div className="step-number">{s.n}</div>
                    <div className="step-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--light)' }}>
          <div className="container">
            <Reveal className="section-title">
              <h2>More PDF Tools</h2>
              <p>Explore other tools you might need</p>
            </Reveal>
            <div ref={gridRef} className="grid-4">
              {related.map((t, i) => (
                <div key={t.path} className={`reveal ${gridInView ? 'visible' : ''}`}
                  style={{ transitionDelay: `${i * 0.08}s` }}>
                  <ToolCard {...t} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
