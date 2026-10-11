import { Link } from 'react-router-dom';

export function HeartStitch({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ className = '', light = false, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-script leading-none whitespace-nowrap ${light ? 'text-cream' : 'text-charcoal'} ${className}`}
      aria-label="Sew Lets Face It - home"
    >
      <span className="text-[1.9rem] sm:text-[2.1rem]">Sew Lets Face It</span>
      <HeartStitch className="size-6 -translate-y-0.5" />
    </Link>
  );
}
