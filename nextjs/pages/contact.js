import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../hooks/SEO';
import { useRouter } from 'next/router';

export default function Contact() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  return (
    <Layout>
      <SEO title="Contact Us" description="Get in touch with the PDFTools team. We respond to every message within 24 hours." canonical="/contact" />
      <main>
        <section className="page-hero">
          <div className="container">
            <button className="back-btn-static" onClick={() => router.back()}>← Back</button>
            <span className="badge">Contact</span>
            <h1>Get In <span className="text-gradient">Touch</span></h1>
            <p>Have a question, suggestion, or issue? We'd love to hear from you.</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info">
                <h2>We're here to help</h2>
                <p style={{ marginTop: 12, lineHeight: 1.8 }}>Whether you have a bug report, feature request, or just want to say hello — send us a message and we'll get back to you within 24 hours.</p>
                <div className="contact-cards">
                  <div className="contact-card card"><span>📧</span><div><h4>Email Support</h4><p>support@pdftools.app</p></div></div>
                  <div className="contact-card card"><span>⏱️</span><div><h4>Response Time</h4><p>Within 24 hours</p></div></div>
                </div>
              </div>
              <div className="contact-form-wrap card">
                {sent ? (
                  <div className="form-success">
                    <div style={{ fontSize: '3rem' }}>✅</div>
                    <h3>Message Sent!</h3>
                    <p>Thanks for reaching out. We'll reply within 24 hours.</p>
                    <button className="btn btn-primary" onClick={() => setSent(false)}>Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="contact-form">
                    <h3>Send a Message</h3>
                    <div className="form-group">
                      <label>Your Name</label>
                      <input type="text" required placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea required rows={5} placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send Message ✉️</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export async function getStaticProps() { return { props: {} }; }
