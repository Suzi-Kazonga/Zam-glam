// The chat button for a shop, and the support link for an administrator or a visitor.
//
// A shop's button carries the number of unread messages from customers beside it — the
// one place those are counted, so the same message is never announced twice.

import { Link } from 'react-router-dom';
import useUnreadMessages from '../hooks/useUnreadMessages';

export default function HelpChatIcon({ user, neutral = false }) {
  const unread = useUnreadMessages();
  const isSeller = user?.role === 'seller';

  const destination = user?.role === 'customer'
    ? '/customer/dashboard?section=Messages'
    : isSeller
      ? '/seller/dashboard?section=Messages'
      : '/contact';
  const label = user?.role === 'customer'
    ? 'Chat with sellers'
    : isSeller
      ? (unread ? `${unread} unread message${unread === 1 ? '' : 's'} from customers` : 'Chat with customers')
      : 'Contact Zamglam support';

  return (
    <Link
      to={destination}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${neutral ? 'text-slate-700 hover:bg-slate-100 focus-visible:outline-indigo-600' : 'text-white hover:bg-white/10 focus-visible:outline-white'}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.5h5.25M12 3.75c-4.97 0-9 3.58-9 8 0 1.77.66 3.4 1.78 4.7L3.75 20.25l4.26-1.36c1.2.55 2.55.86 3.99.86 4.97 0 9-3.58 9-8s-4.03-8-9-8Z" />
      </svg>
      {isSeller && unread > 0 && (
        <span className="absolute right-0 top-0 rounded-full bg-sky-700 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
      )}
    </Link>
  );
}
