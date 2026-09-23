import { useLocation, useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={() => navigate(window.history.length > 1 ? -1 : '/')}
      className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      aria-label="Go back to the previous page"
    >
      <span aria-hidden="true">←</span>
      Back
    </button>
  );
}
