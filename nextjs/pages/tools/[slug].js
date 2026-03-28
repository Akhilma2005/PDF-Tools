import ToolPage from '../../components/ToolPage';
import { tools } from '../../data/tools';

export default function ToolRoute({ tool }) {
  if (!tool) return null;
  return <ToolPage tool={tool} showCompressionOptions={tool.path === '/tools/compress-pdf'} />;
}

export async function getStaticPaths() {
  return {
    paths: tools
      .filter(t => t.path !== '/tools/pdf-editor')
      .map(t => ({ params: { slug: t.path.replace('/tools/', '') } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const tool = tools.find(t => t.path === `/tools/${params.slug}`) || null;
  if (!tool) return { notFound: true };
  return { props: { tool } };
}
