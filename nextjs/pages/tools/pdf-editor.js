import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import SEO from '../../hooks/SEO';

const PdfEditorClient = dynamic(() => import('../../components/PdfEditorClient'), { ssr: false });

export default function PdfEditorPage() {
  return (
    <Layout hideFooter={true}>
      <SEO title="PDF Editor" description="Edit PDF files online — add text, draw, highlight and annotate. Free, no upload needed." canonical="/tools/pdf-editor" />
      <PdfEditorClient />
    </Layout>
  );
}

export async function getStaticProps() { return { props: {} }; }
