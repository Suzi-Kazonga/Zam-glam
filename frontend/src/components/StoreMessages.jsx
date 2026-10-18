// Conversations between a shopper and a shop, as one list.
//
// Every conversation is folded shut to a single line: who it is with — the shop, for a
// shopper; the customer, for a shop — the last message either way, and how many of the
// other side's messages are still unread. Opening one shows the whole conversation and
// a reply box in place, and reads it; only one is open at a time.

import { useEffect, useMemo, useState } from 'react';
import { getMessageThreads, getThreadMessages, sendThreadMessage } from '../api/messageApi';

function threadLabel(thread, role) {
  return role === 'seller' ? thread.customer_name || 'Customer' : thread.store_name || 'Shop';
}

function threadKey(thread, role) {
  return `${thread.store_id}:${role === 'seller' ? thread.customer_id : 'customer'}`;
}

// "10:42" today, "17 Oct" before that: enough to tell a fresh conversation from an old one.
function when(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// Tell the chat button its count has changed, so it does not wait for its next check.
const announceRead = () => window.dispatchEvent(new Event('zamglam:messages-read'));

export default function StoreMessages({ role, stores = [] }) {
  const [threads, setThreads] = useState([]);
  const [openKey, setOpenKey] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [newDraft, setNewDraft] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadThreads = () => getMessageThreads()
    .then((rows) => {
      setThreads(Array.isArray(rows) ? rows : []);
      setLoading(false);
    })
    .catch(() => {
      setError('Could not load your conversations.');
      setLoading(false);
    });

  useEffect(() => {
    loadThreads();
    const timer = window.setInterval(loadThreads, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const openThread = useMemo(() => threads.find((thread) => threadKey(thread, role) === openKey) || null, [threads, role, openKey]);
  const openStoreId = openThread?.store_id || null;
  const openCustomerId = role === 'seller' ? openThread?.customer_id : null;

  // The open conversation's messages. Fetching them is what reads them, so the unread
  // figure on its line and on the chat button drops.
  useEffect(() => {
    if (!openStoreId) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    const loadMessages = () => getThreadMessages(openStoreId, openCustomerId)
      .then((rows) => {
        if (cancelled) return;
        setMessages(rows);
        setThreads((current) => current.map((thread) => (threadKey(thread, role) === openKey ? { ...thread, unread_count: 0 } : thread)));
        announceRead();
      })
      .catch(() => { if (!cancelled) setError('Could not load messages for this conversation.'); });
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [openStoreId, openCustomerId, openKey, role]);

  const toggle = (key) => {
    setError('');
    setDraft('');
    setOpenKey((current) => (current === key ? '' : key));
  };

  const startThread = async (event) => {
    event.preventDefault();
    if (!newStoreId || !newDraft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const message = await sendThreadMessage(Number(newStoreId), newDraft.trim());
      const store = stores.find((item) => Number(item.id) === Number(newStoreId));
      const started = {
        store_id: Number(newStoreId),
        store_name: store?.name || 'Shop',
        last_message: message.body,
        last_sender_role: role,
        updated_at: message.created_at,
        unread_count: 0,
      };
      setThreads((current) => [started, ...current.filter((thread) => Number(thread.store_id) !== Number(newStoreId))]);
      setOpenKey(threadKey(started, role));
      setNewDraft('');
      setNewStoreId('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  const reply = async (event) => {
    event.preventDefault();
    if (!openStoreId || !draft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const message = await sendThreadMessage(openStoreId, draft.trim(), openCustomerId);
      setMessages((current) => [...current, message]);
      setThreads((current) => current.map((thread) => (threadKey(thread, role) === openKey
        ? { ...thread, last_message: message.body, last_sender_role: role, updated_at: message.created_at }
        : thread)));
      setDraft('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  const totalUnread = threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0);

  return (
    <section className="space-y-4">
      {role === 'customer' && (
        <form onSubmit={startThread} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <label htmlFor="message-store" className="text-xs font-semibold text-slate-600">Message a shop</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select id="message-store" required value={newStoreId} onChange={(event) => setNewStoreId(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm sm:w-56">
              <option value="">Choose store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <textarea aria-label="New message" maxLength={2000} rows={1} value={newDraft} onChange={(event) => setNewDraft(event.target.value)} placeholder="Ask about a product or order" className="min-w-0 flex-1 resize-y rounded-md border border-slate-300 px-2 py-2 text-sm" />
            <button type="submit" disabled={busy || !newStoreId || !newDraft.trim()} className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Start conversation'}</button>
          </div>
        </form>
      )}

      <div className="rounded-md border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
          {totalUnread > 0 && <span className="text-xs font-semibold text-sky-800">{totalUnread} unread</span>}
        </header>

        {error && <p role="alert" className="m-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

        <ul className="divide-y divide-slate-100">
          {threads.map((thread) => {
            const key = threadKey(thread, role);
            const isOpen = openKey === key;
            const unread = Number(thread.unread_count || 0);
            const mine = thread.last_sender_role === role;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{threadLabel(thread, role)}</span>
                    <span className={`mt-0.5 block truncate text-xs ${unread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                      {mine ? 'You: ' : ''}{thread.last_message || 'No messages yet'}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] text-slate-400">{when(thread.updated_at)}</span>
                    {unread > 0 && (
                      <span aria-label={`${unread} unread`} className="rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-white">
                    <div className="max-h-96 space-y-3 overflow-y-auto p-4" aria-live="polite">
                      {messages.map((message) => (
                        <article key={message.id} className={`max-w-[90%] rounded-md px-3 py-2 text-sm ${message.sender_role === role ? 'ml-auto bg-emerald-50 text-emerald-950' : 'bg-slate-100 text-slate-800'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <time className="mt-1 block text-[10px] opacity-60">{new Date(message.created_at).toLocaleString()}</time>
                        </article>
                      ))}
                      {!messages.length && <p className="text-sm text-slate-500">Loading the conversation…</p>}
                    </div>
                    <form onSubmit={reply} className="flex gap-2 border-t border-slate-100 p-3">
                      <textarea aria-label="Reply message" maxLength={2000} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Write to ${threadLabel(thread, role)}`} className="min-w-0 flex-1 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <button type="submit" disabled={busy || !draft.trim()} className="self-end rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Send'}</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!loading && !threads.length && (
          <p className="px-4 py-6 text-sm text-slate-500">
            {role === 'seller' ? 'Customer conversations will appear here.' : 'Your conversations with shops will appear here.'}
          </p>
        )}
      </div>
    </section>
  );
}
