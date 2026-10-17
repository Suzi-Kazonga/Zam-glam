// "Report a problem" — a message box addressed to the Zamglam administrators.
//
// Shown to shoppers, shops and couriers; never to an administrator, who is the one
// receiving these. What is written here lands in the administrators' customer service
// queue, tagged with the sender's role, and stays there until it is marked done.

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportProblem } from '../api/supportApi';

export default function ReportProblemButton({ className = '', label = 'Report a problem' }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Administrators handle these rather than filing them, and a signed-out visitor has no
  // account to file one against.
  if (!user || user.role === 'admin') return null;

  const close = () => {
    setOpen(false);
    setError('');
    setSent(false);
    setMessage('');
  };

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Describe the problem before sending.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await reportProblem(message.trim());
      setSent(true);
      setMessage('');
    } catch (problem) {
      setError(problem.response?.data?.error || 'That could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50'}
      >
        <span aria-hidden="true">⚑</span>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Report a problem to Zamglam">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Report a problem</h2>
            <p className="mt-1 text-sm text-slate-500">
              This goes straight to the Zamglam administrators, with your name and that you are a {user.role}.
            </p>

            {sent ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Sent. An administrator will see this in their customer service list.
                </p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setSent(false); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Report another
                  </button>
                  <button type="button" onClick={close} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={send} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  What went wrong?
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={6}
                    maxLength={2000}
                    autoFocus
                    placeholder="Tell us what you were doing and what happened."
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={sending} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
                    {sending ? 'Sending…' : 'Send to the administrators'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
