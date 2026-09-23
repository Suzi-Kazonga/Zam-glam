// The administrator’s complaints queue: who has complaints against them, worst first, and
// the buttons to suspend or reinstate.

import { useEffect, useState } from 'react';
import { getReportSummary, getReportsAgainst, setAccountStatus } from '../api/reportApi';
import { isLocalDemoSession } from '../utils/localSession';

// Parties with open complaints, worst first. Anything at three or more is flagged — that
// is the point at which an admin is asked to decide whether to suspend.
const THRESHOLD = 3;

export default function ReportsQueue() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState([]);
  const [reasons, setReasons] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);

  const load = () => {
    if (isLocalDemoSession()) {
      setMessage('Sign in as the seeded admin (admin@zamglam.local / ADMIN123456) to moderate reports.');
      return;
    }
    getReportSummary().then(setRows).catch((e) => setMessage(e?.error || 'Could not load reports.'));
  };

  useEffect(load, []);

  const openDetail = async (row) => {
    const key = `${row.reported_role}:${row.reported_id}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    try {
      setDetail(await getReportsAgainst(row.reported_role, row.reported_id));
    } catch {
      setDetail([]);
    }
  };

  const decide = async (row, status) => {
    const key = `${row.reported_role}:${row.reported_id}`;
    setBusy(key);
    setMessage('');
    try {
      await setAccountStatus(row.reported_role, row.reported_id, status, reasons[key]);
      setMessage(`${row.name} ${status === 'suspended' ? 'suspended' : 'reinstated'}.`);
      load();
    } catch (error) {
      setMessage(error?.error || 'Could not update that account.');
    } finally {
      setBusy(null);
    }
  };

  const flagged = rows.filter((r) => r.report_count >= THRESHOLD);

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}

      <p className="text-sm text-slate-500">
        {rows.length} part{rows.length === 1 ? 'y' : 'ies'} with open complaints
        {flagged.length > 0 && <span className="font-semibold text-rose-600"> · {flagged.length} at {THRESHOLD}+ reports</span>}
      </p>

      {rows.length ? rows.map((row) => {
        const key = `${row.reported_role}:${row.reported_id}`;
        const isFlagged = row.report_count >= THRESHOLD;
        return (
          <article key={key} className={`rounded-lg border p-4 ${isFlagged ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {row.name}
                  <span className="ml-2 text-xs font-normal capitalize text-slate-500">{row.reported_role}</span>
                  {row.account_status === 'suspended' && (
                    <span className="ml-2 rounded-full bg-rose-700 px-2 py-0.5 text-xs font-bold uppercase text-white">Suspended</span>
                  )}
                </p>
                <p className="text-sm text-slate-500">{row.email || '—'}</p>
                <p className="mt-1 text-xs text-slate-500">Reasons given: {row.reasons}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isFlagged ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {row.report_count} report{row.report_count === 1 ? '' : 's'}
              </span>
            </div>

            <button type="button" onClick={() => openDetail(row)} className="mt-3 text-xs font-semibold text-slate-700 hover:underline">
              {expanded === key ? 'Hide reports' : 'See each report'}
            </button>

            {expanded === key && (
              <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {detail.map((d) => (
                  <li key={d.id} className="text-xs text-slate-600">
                    <span className="font-semibold capitalize">{d.reporter_role}</span> · order #{d.order_id} · {d.reason}
                    {d.details && <span className="text-slate-500"> — “{d.details}”</span>}
                    <span className="ml-1 text-slate-400">({new Date(d.created_at).toLocaleDateString()})</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {row.account_status !== 'suspended' ? (
                <>
                  <input
                    value={reasons[key] || ''}
                    onChange={(e) => setReasons((c) => ({ ...c, [key]: e.target.value }))}
                    placeholder="Reason shown to them (optional)"
                    className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button type="button" disabled={busy === key} onClick={() => decide(row, 'suspended')} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
                    Suspend
                  </button>
                </>
              ) : (
                <button type="button" disabled={busy === key} onClick={() => decide(row, 'active')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  Reinstate
                </button>
              )}
            </div>
          </article>
        );
      }) : !message && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">No complaints have been filed.</p>}
    </div>
  );
}
