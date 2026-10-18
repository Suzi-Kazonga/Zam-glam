import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMessageThreads } from '../api/messageApi';
import { isLocalDemoSession } from '../utils/localSession';
import useNotificationChime from './useNotificationChime';

// How many messages are waiting to be read, across every conversation.
//
// This is the counter beside the chat button. "Unread" is decided on the server: a message
// from the other side that nobody has opened yet. Opening the conversation reads it, and
// the count falls at the next check.
//
// Only shoppers and shops have conversations; for anybody else it is always 0 and nothing
// is requested. The device chimes when the count rises.
export default function useUnreadMessages() {
  const { user } = useAuth();
  const talks = user?.role === 'customer' || user?.role === 'seller';
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!talks || isLocalDemoSession()) {
      setUnread(0);
      return undefined;
    }

    let cancelled = false;
    const load = () => getMessageThreads()
      .then((threads) => {
        if (cancelled) return;
        const total = (Array.isArray(threads) ? threads : [])
          .reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);
        setUnread(total);
      })
      .catch(() => {});

    load();
    const timer = window.setInterval(load, 5000);
    // Opening a conversation reads it; say so at once rather than at the next poll.
    const onRead = () => load();
    window.addEventListener('zamglam:messages-read', onRead);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('zamglam:messages-read', onRead);
    };
  }, [talks, user?.email]);

  useNotificationChime(talks ? unread : null);

  return unread;
}
