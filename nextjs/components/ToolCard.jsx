import Link from 'next/link';

export default function ToolCard({ icon, title, description, path, color, comingSoon }) {
  return (
    <Link href={path} className="tool-card">
      <div className="tool-card-icon" style={{ background: color || 'rgba(90,96,255,0.1)' }}>
        {icon}
      </div>
      <div className="tool-card-title-row">
        <h3 className="tool-card-title">{title}</h3>
        {comingSoon && <span className="tool-card-soon">Soon</span>}
      </div>
      <p className="tool-card-desc">{description}</p>
      <span className="tool-card-cta">{comingSoon ? 'Coming Soon' : 'Use Tool →'}</span>
    </Link>
  );
}
