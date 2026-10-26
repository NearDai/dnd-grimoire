import { NavLink } from "react-router-dom";
import "./Masthead.css";

const LINKS = [
  { to: "/", en: "Characters", th: "ตัวละคร", end: true },
  { to: "/create", en: "Create", th: "สร้างตัวละคร", end: false },
  { to: "/rules", en: "Rules", th: "กฎและข้อมูล", end: false },
];

// ตราโล่เหล็กกับดาบไขว้ (ตราประจำตำรา)
export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg className="emblem" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="emb-blade" x1="0" x2="1">
          <stop offset="0" stopColor="#f1ead8" />
          <stop offset="1" stopColor="#9c978c" />
        </linearGradient>
        <linearGradient id="emb-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b8a85" />
          <stop offset=".55" stopColor="#5b5a57" />
          <stop offset="1" stopColor="#34332f" />
        </linearGradient>
      </defs>
      <g strokeLinecap="round">
        <path d="M11 55 47 11" stroke="url(#emb-blade)" strokeWidth="3.4" />
        <path d="M9 45l10 10" stroke="#c9a24a" strokeWidth="3.2" />
        <circle cx="8" cy="58" r="2.6" fill="#c9a24a" />
        <path d="M53 55 17 11" stroke="url(#emb-blade)" strokeWidth="3.4" />
        <path d="M45 55l10-10" stroke="#c9a24a" strokeWidth="3.2" />
        <circle cx="56" cy="58" r="2.6" fill="#c9a24a" />
      </g>
      <path
        d="M32 13c7 3.5 12 4 17 4v14c0 12-7.5 20-17 24-9.5-4-17-12-17-24V17c5 0 10-.5 17-4z"
        fill="url(#emb-iron)"
        stroke="#c9a24a"
        strokeWidth="2"
      />
      <path d="M32 22v24M24 31h16" stroke="#c9a24a" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="31" r="3" fill="#ecd18a" stroke="#8a6a26" />
    </svg>
  );
}

export default function Masthead() {
  return (
    <header className="banner">
      <div className="banner-inner">
        <NavLink to="/" className="brand" aria-label="Adventurer's Grimoire home">
          <Emblem size={52} />
          <span className="brand-text">
            <strong>Adventurer's Grimoire</strong>
            <span className="th" lang="th">ตำรานักผจญภัย</span>
          </span>
        </NavLink>
        <nav className="banner-nav" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="banner-tab">
              {l.en}
              <span className="th" lang="th">{l.th}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
