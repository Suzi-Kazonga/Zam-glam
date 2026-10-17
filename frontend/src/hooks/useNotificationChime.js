import { useEffect, useRef } from 'react';
import { playNotificationChime } from '../utils/notificationChime';

// Chime when a notification count goes up.
//
// Every notification bell in the application polls and keeps a count. Pass that count
// here and the device sounds when it rises — a new order, a parcel to collect, a courier
// at the counter, a reported problem.
//
// The first reading is only remembered, never sounded: arriving at a page with three
// things already waiting is not news.
export default function useNotificationChime(count) {
  const previous = useRef(null);

  useEffect(() => {
    const current = Number(count);
    if (!Number.isFinite(current)) return;
    if (previous.current !== null && current > previous.current) playNotificationChime();
    previous.current = current;
  }, [count]);
}
