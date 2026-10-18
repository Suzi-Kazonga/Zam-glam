// The shopper's chat button, with the number of unread messages from shops beside it.

import { Link } from 'react-router-dom';
import useUnreadMessages from '../hooks/useUnreadMessages';

export default function CustomerMessagesIcon() {
  // Counted on the server from what shops have sent and the shopper has not opened; the
  // hook also chimes when it rises.
  const unread = useUnreadMessages();

  const label = unread
    ? `${unread} unread message${unread === 1 ? '' : 's'}`
    : 'Messages with shops';

  return (
    <Link
      to="/customer/dashboard?section=Messages"
      aria-label={label}
      title={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      💬
      {unread > 0 && <span className="absolute right-0 top-0 rounded-full bg-sky-700 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
    </Link>
  );
}
