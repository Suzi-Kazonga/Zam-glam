// The back button, in its two forms.
//
// With no props it is the round button that floats at the top left of every page, sending
// the visitor back where they came from (App renders it once for the whole site).
//
// Given `to` or `label`, it is an inline "← Back" button placed by the page itself — the
// login and sign-up pages use it to send people somewhere specific. Those pages have their
// own, so the floating one stays off them rather than showing two.

import { useLocation, useNavigate } from 'react-router-dom';

// On a phone the floating button would sit on the top bar's search box, so the bars carry
// their own back arrow there (HeaderBackButton) and the floating one steps aside whenever
// one is on the page (styles/globals.css, [data-header-back]).

// Pages that place their own inline back button.
const HAS_OWN_BACK = (path) => path === '/login' || path.startsWith('/signup');

export default function BackButton({ to, label, className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inline = Boolean(to || label);

  if (inline) {
    const text = label || 'Back';
    return (
      <button
        type="button"
        onClick={() => (to ? navigate(to) : navigate(-1))}
        aria-label={text}
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-0.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${className}`}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.5 10H4.5" />
          <path d="m9 5-5 5 5 5" />
        </svg>
        <span>{text}</span>
      </button>
    );
  }

  if (location.pathname === '/' || HAS_OWN_BACK(location.pathname)) return null;

  return (
    <button
      type="button"
      data-floating-back=""
      onClick={() => navigate(window.history.length > 1 ? -1 : '/')}
      className="fixed left-4 top-20 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:-translate-x-0.5 hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      aria-label="Go back"
      title="Go back"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M19 12H5m7 7-7-7 7-7" />
      </svg>
    </button>
  );
}

// The back arrow inside a top bar, shown on phones only (wider screens have the floating one).
export function HeaderBackButton({ light = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/') return null;
  return (
    <button
      type="button"
      data-header-back=""
      onClick={() => navigate(window.history.length > 1 ? -1 : '/')}
      aria-label="Go back"
      title="Go back"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition lg:hidden ${light ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M19 12H5m7 7-7-7 7-7" />
      </svg>
    </button>
  );
}
