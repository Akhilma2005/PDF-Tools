import Layout from '../components/Layout';
import SEO from '../hooks/SEO';
import { useRouter } from 'next/router';

const sections = [
  { icon: '📁', title: 'Data Handling', content: 'When you upload a file to PDFTools, it is transmitted over an encrypted HTTPS connection. Files are processed in isolated temporary storage and are never read, analyzed, or accessed by our team for any purpose other than performing the requested conversion.' },
  { icon: '🗑️', title: 'File Storage Rules', content: 'All uploaded files and processed output files are automatically and permanently deleted from our servers within 1 hour of processing. We do not maintain any backups of user files. Once deleted, files cannot be recovered.' },
  { icon: '🚫', title: 'No Tracking', content: 'We do not use invasive tracking technologies. We use minimal, privacy-respecting analytics (page views only) to understand how our tools are used. We do not track individual users, build profiles, or use behavioral advertising.' },
  { icon: '🤝', title: 'No Selling Data', content: 'We do not sell, rent, trade, or share your personal data or file contents with any third parties, advertisers, or data brokers. Your files and usage data are yours alone.' },
  { icon: '🍪', title: 'Cookies', content: 'We use only essential cookies required for the website to function. No third-party advertising cookies are used. You can disable cookies in your browser settings without affecting core functionality.' },
  { icon: '📬', title: 'Contact & Updates', content: 'If you have questions about this privacy policy or how your data is handled, contact us at privacy@pdftools.app. We may update this policy periodically and will post changes on this page with an updated date.' },
];

export default function Privacy() {
  const router = useRouter();
  return (
    <Layout>
      <SEO title="Privacy Policy" description="PDFTools privacy policy — your files are encrypted, never stored, and auto-deleted after processing." canonical="/privacy" />
      <main>
        <section className="page-hero">
          <div className="container">
            <button className="back-btn-static" onClick={() => router.back()}>← Back</button>
            <span className="badge">Legal</span>
            <h1>Privacy <span className="text-gradient">Policy</span></h1>
            <p>Last updated: January 2025 · We take your privacy seriously.</p>
          </div>
        </section>
        <section className="section">
          <div className="container legal-content">
            {sections.map(s => (
              <div className="legal-section card" key={s.title}>
                <div className="legal-section-header"><span className="legal-icon">{s.icon}</span><h2>{s.title}</h2></div>
                <p>{s.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export async function getStaticProps() { return { props: {} }; }
