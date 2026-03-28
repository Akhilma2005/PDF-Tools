import Layout from '../components/Layout';
import SEO from '../hooks/SEO';
import { useRouter } from 'next/router';

const allowed = ['Converting your own personal or business documents', 'Using tools for educational or research purposes', 'Processing files you have legal rights to modify', 'Using the service for non-commercial personal projects'];
const notAllowed = ['Uploading files containing malware, viruses, or malicious code', 'Processing copyrighted content without authorization', 'Attempting to reverse-engineer or scrape our service', 'Using automated bots or scripts to abuse the service', 'Uploading illegal, harmful, or offensive content'];

export default function Terms() {
  const router = useRouter();
  return (
    <Layout>
      <SEO title="Terms & Conditions" description="PDFTools terms and conditions — learn about acceptable use, disclaimers, and your rights." canonical="/terms" />
      <main>
        <section className="page-hero">
          <div className="container">
            <button className="back-btn-static" onClick={() => router.back()}>← Back</button>
            <span className="badge">Legal</span>
            <h1>Terms & <span className="text-gradient">Conditions</span></h1>
            <p>Last updated: January 2025 · Please read these terms before using our service.</p>
          </div>
        </section>
        <section className="section">
          <div className="container legal-content">
            <div className="legal-section card">
              <div className="legal-section-header"><span className="legal-icon">📋</span><h2>Acceptance of Terms</h2></div>
              <p>By accessing and using PDFTools, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.</p>
            </div>
            <div className="terms-grid">
              <div className="card">
                <h3 style={{ color: '#16a34a', marginBottom: 16 }}>✅ Allowed Use</h3>
                <ul className="terms-list">{allowed.map(a => <li key={a}><span className="terms-check">✓</span>{a}</li>)}</ul>
              </div>
              <div className="card">
                <h3 style={{ color: '#dc2626', marginBottom: 16 }}>❌ Not Allowed</h3>
                <ul className="terms-list">{notAllowed.map(a => <li key={a}><span className="terms-x">✗</span>{a}</li>)}</ul>
              </div>
            </div>
            <div className="legal-section card">
              <div className="legal-section-header"><span className="legal-icon">⚖️</span><h2>Disclaimer of Warranties</h2></div>
              <p>PDFTools is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service availability. We are not liable for any data loss resulting from use of our service. Always keep backups of important files.</p>
            </div>
            <div className="legal-section card">
              <div className="legal-section-header"><span className="legal-icon">🔄</span><h2>Changes to Terms</h2></div>
              <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export async function getStaticProps() { return { props: {} }; }
