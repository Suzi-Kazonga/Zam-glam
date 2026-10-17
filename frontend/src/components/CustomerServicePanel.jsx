// Customer service: every problem reported by the people using Zamglam.
//
// For an administrator this is the queue — who reported what, and from which kind of
// account — and each one stays until it is marked done, which drops the count by one.
// For everybody else it is simply what they themselves have reported.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProblems, getMyProblems, markProblemDone } from '../api/supportApi';
import ReportProblemButton from './ReportProblemButton';

const ROLE_BADGE = {
  customer: 'bg-indigo-100 text-indigo-800',
  seller: 'bg-purple-100 text-purple-800',
  courier: 'bg-emerald-100 text-emerald-800',
};

const when = (value) => (value ? new Date(value).toLocaleString() : '');

export default function CustomerServicePanel({ onCountChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [reports, setReports] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const request = isAdmin ? getProblems(showDone ? 'all' : 'open') : getMyProblems();
    return request
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.reports || [];
        setReports(rows);
        if (isAdmin && typeof data.open === 'number') onCountChange?.(data.open);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [isAdmin, showDone, onCountChange]);

  useEffect(() => {
    load();
    // New problems arrive while the list is open, so keep it current.
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, [load]);

  const clearReport = async (report) => {
    setBusyId(report.id);
    try {
      const result = await markProblemDone(report.id);
      if (typeof result.open === 'number') onCountChange?.(result.open);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const open = reports.filter((report) => report.status === 'open');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer service</h2>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? `${open.length} problem${open.length === 1 ? '' : 's'} waiting to be dealt with`
              : 'Problems you have reported to the Zamglam administrators'}
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setShowDone((current) => !current)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {showDone ? 'Show only what is waiting' : 'Show the ones already done'}
          </button>
        ) : (
          <ReportProblemButton className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" />
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && reports.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {isAdmin ? 'Nothing reported. The queue is clear.' : 'You have not reported anything.'}
        </p>
      )}

      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className={`rounded-xl border p-4 ${report.status === 'done' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${ROLE_BADGE[report.reporter_role] || 'bg-slate-100 text-slate-700'}`}>
                    {report.reporter_role}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{report.reporter_name}</span>
                  {report.reporter_email && <span className="text-xs text-slate-500">{report.reporter_email}</span>}
                </>
              )}
              {report.status === 'done' ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Done</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Waiting</span>
              )}
              <span className="ml-auto text-xs text-slate-400">{when(report.created_at)}</span>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{report.message}</p>

            {isAdmin && report.status === 'open' && (
              <div className="mt-4">
                <button
                  type="button"
                  disabled={busyId === report.id}
                  onClick={() => clearReport(report)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busyId === report.id ? 'Marking…' : 'Mark done'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
