import Layout from '../components/Layout';
import SEO from '../hooks/SEO';
import { useRouter } from 'next/router';

export default function About() {
  const router = useRouter();
  return (
    <Layout>
      <SEO title="About Us" description="PDFTools was built to give everyone access to powerful PDF tools — completely free, no signup required." canonical="/about" />
      <main>
        <section className="page-hero">
          <div className="container">
            <button className="back-btn-static" onClick={() => router.back()}>← Back</button>
            <span className="badge">About Us</span>
            <h1>We Make PDF Work <span className="text-gradient">Simple</span></h1>
            <p>PDFTools was built with one mission: give everyone access to powerful PDF tools — completely free, with no strings attached.</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="about-grid">
              <div>
                <h2>Our Mission</h2>
                <p style={{ marginTop: 16, lineHeight: 1.8 }}>We believe productivity tools should be accessible to everyone — students, freelancers, small businesses, and enterprises alike. PDFTools removes the barrier of expensive software by providing a full suite of PDF utilities directly in your browser, for free.</p>
                <p style={{ marginTop: 16, lineHeight: 1.8 }}>No downloads. No subscriptions. No data harvesting. Just fast, reliable PDF processing that respects your privacy.</p>
              </div>
              <div className="about-stats-grid">
                {[{ n: '10+', label: 'Free Tools' }, { n: '100%', label: 'Browser-Based' }, { n: '0', label: 'Signups Required' }, { n: '🔒', label: 'Auto File Deletion' }].map(s => (
                  <div className="about-stat card" key={s.label}>
                    <div className="about-stat-n">{s.n}</div>
                    <div className="about-stat-l">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="section" style={{ background: 'var(--light)' }}>
          <div className="container">
            <div className="section-title"><h2>Why Choose Us?</h2></div>
            <div className="grid-3">
              {[
                { icon: '⚡', title: 'Speed First', desc: 'Optimized processing engine delivers results in seconds, not minutes.' },
                { icon: '🔐', title: 'Privacy by Design', desc: 'Files are processed in memory and deleted immediately after download.' },
                { icon: '🌍', title: 'Works Everywhere', desc: 'Any device, any browser, any OS. No installation ever needed.' },
                { icon: '🎯', title: 'High Accuracy', desc: 'Industry-leading conversion quality that preserves your original formatting.' },
                { icon: '🆓', title: 'Forever Free', desc: 'Core tools will always be free. We are supported by non-intrusive ads.' },
                { icon: '💬', title: 'Real Support', desc: 'Got a problem? Our team responds to every support request within 24 hours.' },
              ].map(f => (
                <div className="card" key={f.title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p style={{ marginTop: 8 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export async function getStaticProps() { return { props: {} }; }
