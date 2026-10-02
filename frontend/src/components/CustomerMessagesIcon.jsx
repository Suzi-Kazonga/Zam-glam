import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMessageThreads } from '../api/messageApi';
import { isLocalDemoSession } from '../utils/localSession';

export default function CustomerMessagesIcon() {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;
    let cancelled = false;
    const load = () => getMessageThreads()
      .then((threads) => {
        if (!cancelled) setReplies(threads.filter((thread) => thread.last_sender_role === 'seller'));
      })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const label = replies.length
    ? `${replies.length} seller repl${replies.length === 1 ? 'y' : 'ies'} waiting`
    : 'Customer messages';

  return (
    <Link
      to="/customer/dashboard?section=Messages"
      aria-label={label}
      title={replies.length ? label : 'Open messages with sellers'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-white/10"
    >
      💬
      {replies.length > 0 && <span className="absolute right-0 top-0 rounded-full bg-sky-700 px-2 py-0.5 text-xs font-bold text-white">{replies.length}</span>}
    </Link>
  );
}