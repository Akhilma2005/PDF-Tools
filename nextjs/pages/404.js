import Link from 'next/link';
import Layout from '../components/Layout';
import SEO from '../hooks/SEO';

export default function NotFound() {
  return (
    <Layout>
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      <main className="not-found-page">
        <div className="container not-found-content">
          <div className="not-found-art">
            <div className="not-found-number">
              <span className="text-gradient">4</span>
              <span className="not-found-emoji">😵</span>
              <span className="text-gradient">4</span>
            </div>
          </div>
          <h1>Page Not Found</h1>
          <p>Oops! The page you're looking for doesn't exist or has been moved.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <Link href="/" className="btn btn-primary btn-lg">🏠 Go Home</Link>
            <Link href="/#tools" className="btn btn-outline btn-lg">Browse Tools</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
