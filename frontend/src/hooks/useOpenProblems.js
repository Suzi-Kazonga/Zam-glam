import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOpenProblemCount } from '../api/supportApi';
import { isLocalDemoSession } from '../utils/localSession';
import useNotificationChime from './useNotificationChime';

// How many reported problems are still waiting for an administrator.
//
// This is what the badge on the profile icon and on the customer service button shows.
// For anybody who is not an administrator it is always 0, and nothing is ever requested.
//
// Pass chime: true in one place only — the header, which is on screen throughout — so a
// new report sounds once rather than once per component watching the same figure.
export default function useOpenProblems({ chime = false } = {}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!isAdmin || isLocalDemoSession()) {
      setOpen(0);
      return undefined;
    }

    let cancelled = false;
    const check = () => getOpenProblemCount()
      .then((count) => { if (!cancelled) setOpen(count); })
      .catch(() => {});

    check();
    const poll = window.setInterval(check, 15000);
    return () => { cancelled = true; window.clearInterval(poll); };
  }, [isAdmin, user?.email]);

  useNotificationChime(chime && isAdmin ? open : null);

  // setOpen is handed back so a panel that has just marked a problem done can drop the
  // figure at once, rather than leaving a stale badge until the next poll.
  return { open, setOpen };
}
