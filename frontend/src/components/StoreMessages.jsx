import { useEffect, useMemo, useState } from 'react';
import { getMessageThreads, getThreadMessages, sendThreadMessage } from '../api/messageApi';

function threadLabel(thread, role) {
  return role === 'seller' ? thread.customer_name || 'Customer' : thread.store_name || 'Shop';
}

function threadKey(thread, role) {
  return `${thread.store_id}:${role === 'seller' ? thread.customer_id : 'customer'}`;
}

export default function StoreMessages({ role, stores = [] }) {
  const [threads, setThreads] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadThreads = () => getMessageThreads()
    .then((rows) => {
      setThreads(rows);
      setSelectedKey((current) => current || (rows[0] ? threadKey(rows[0], role) : ''));
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

  const activeThread = useMemo(() => threads.find((thread) => threadKey(thread, role) === selectedKey) || null, [threads, role, selectedKey]);
  const activeStoreId = activeThread?.store_id || (role === 'customer' ? Number(selectedKey.split(':')[0]) || null : null);
  const activeCustomerId = role === 'seller' ? activeThread?.customer_id : null;

  useEffect(() => {
    if (!activeStoreId) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    const loadMessages = () => getThreadMessages(activeStoreId, activeCustomerId)
      .then((rows) => { if (!cancelled) setMessages(rows); })
      .catch(() => { if (!cancelled) setError('Could not load messages for this conversation.'); });
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeStoreId, activeCustomerId]);

  const startThread = async (event) => {
    event.preventDefault();
    if (!newStoreId || !draft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const message = await sendThreadMessage(Number(newStoreId), draft.trim());
      const store = stores.find((item) => Number(item.id) === Number(newStoreId));
      const started = { store_id: Number(newStoreId), store_name: store?.name || 'Shop', last_message: message.body, last_sender_role: role };
      setThreads((current) => [started, ...current.filter((thread) => Number(thread.store_id) !== Number(newStoreId))]);
      setSelectedKey(threadKey(started, role));
      setMessages([message]);
      setDraft('');
      setNewStoreId('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  const reply = async (event) => {
    event.preventDefault();
    if (!activeStoreId || !draft.trim()) return;
    setBusy(true);
    setError('');
    try {
      const message = await sendThreadMessage(activeStoreId, draft.trim(), activeCustomerId);
      setMessages((current) => [...current, message]);
      setThreads((current) => current.map((thread) => threadKey(thread, role) === selectedKey
        ? { ...thread, last_message: message.body, last_sender_role: role, updated_at: message.created_at }
        : thread));
      setDraft('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  const activeLabel = activeThread ? threadLabel(activeThread, role) : stores.find((store) => Number(store.id) === activeStoreId)?.name;

  return <section className="grid gap-4 md:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.6fr)]">
    <aside className="rounded-md border border-slate-200 bg-white p-3">
      <h2 className="px-2 py-1 text-sm font-semibold text-slate-900">Conversations</h2>
      {role === 'customer' && <form onSubmit={startThread} className="mt-3 space-y-2 border-b border-slate-100 px-2 pb-4">
        <label htmlFor="message-store" className="text-xs font-semibold text-slate-600">Message a shop</label>
        <select id="message-store" required value={newStoreId} onChange={(event) => setNewStoreId(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
          <option value="">Choose store</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        <textarea aria-label="New message" maxLength={2000} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about a product or order" className="w-full resize-y rounded-md border border-slate-300 px-2 py-2 text-sm" />
        <button type="submit" disabled={busy || !newStoreId || !draft.trim()} className="w-full rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Start conversation'}</button>
      </form>}
      <div className="mt-2 space-y-1">
        {threads.map((thread) => {
          const key = threadKey(thread, role);
          return <button key={key} type="button" onClick={() => setSelectedKey(key)} aria-current={selectedKey === key ? 'true' : undefined} className={`block w-full rounded-md px-3 py-2 text-left ${selectedKey === key ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
            <span className="block truncate text-sm font-semibold text-slate-900">{threadLabel(thread, role)}</span>
            <span className="mt-1 block truncate text-xs text-slate-500">{thread.last_message || 'No messages yet'}</span>
            {role === 'seller' && thread.last_sender_role === 'customer' && <span className="mt-1 block text-[11px] font-semibold text-amber-800">Customer replied</span>}
          </button>;
        })}
        {!loading && !threads.length && role === 'seller' && <p className="px-2 py-4 text-sm text-slate-500">Customer conversations will appear here.</p>}
      </div>
    </aside>

    <div className="flex min-h-80 flex-col rounded-md border border-slate-200 bg-white">
      {error && <p role="alert" className="m-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {activeStoreId ? <>
        <header className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold text-slate-900">{activeLabel || 'Conversation'}</h2><p className="text-xs text-slate-500">Messages update every five seconds.</p></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.map((message) => <article key={message.id} className={`max-w-[90%] rounded-md px-3 py-2 text-sm ${message.sender_role === role ? 'ml-auto bg-emerald-50 text-emerald-950' : 'bg-slate-100 text-slate-800'}`}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <time className="mt-1 block text-[10px] opacity-60">{new Date(message.created_at).toLocaleString()}</time>
          </article>)}
          {!messages.length && <p className="text-sm text-slate-500">Start the conversation with a message.</p>}
        </div>
        <form onSubmit={reply} className="flex gap-2 border-t border-slate-100 p-3">
          <textarea aria-label="Reply message" maxLength={2000} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !draft.trim()} className="self-end rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Send'}</button>
        </form>
      </> : <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">Select a conversation or choose a shop to start one.</div>}
    </div>
  </section>;
}