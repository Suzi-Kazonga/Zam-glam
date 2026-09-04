import { useEffect, useState } from 'react';
import { getDocuments, uploadDocuments } from '../api/storeApi';
import { isLocalDemoSession } from '../utils/localSession';

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'business_license', label: 'Business licence' },
  { value: 'tax_id', label: 'Tax ID (TPIN)' },
  { value: 'bank_statement', label: 'Bank statement' },
];

export const VERIFICATION_LABELS = {
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'Pending review', className: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-800' },
};

// Lets a seller submit the paperwork that proves their shop is real, and see where that
// submission has got to. The proposal's first stated problem is that shoppers cannot tell
// a checked seller from an unchecked one.
export default function VerificationPanel() {
  const [state, setState] = useState({ verification_status: 'pending', documents: [] });
  const [type, setType] = useState('national_id');
  const [docNumber, setDocNumber] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (isLocalDemoSession()) return;
    getDocuments().then(setState).catch(() => {});
  };

  useEffect(load, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!file) {
      setMessage('Choose a file to upload.');
      return;
    }
    setBusy(true);
    try {
      await uploadDocuments(file, type, docNumber);
      setFile(null);
      setDocNumber('');
      setMessage('Document submitted. An admin will review it shortly.');
      load();
    } catch (error) {
      setMessage(error?.error || error?.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const badge = VERIFICATION_LABELS[state.verification_status] || VERIFICATION_LABELS.pending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge.className}`}>{badge.label}</span>
        {state.verification_status === 'verified'
          ? <p className="text-sm text-slate-500">Shoppers see a verified badge on your shop and products.</p>
          : <p className="text-sm text-slate-500">Submit your documents so shoppers can see your shop has been checked.</p>}
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-600">Document type
          <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {DOC_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-600">Document number (optional)
          <input value={docNumber} onChange={(event) => setDocNumber(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-600 sm:col-span-2">Upload file
          <input type="file" accept="image/*,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 w-full text-sm" />
          <span className="mt-1 block text-xs text-slate-400">Image or PDF, max 5MB.</span>
        </label>
        {message && <p className="text-sm text-purple-800 sm:col-span-2">{message}</p>}
        <div className="sm:col-span-2">
          <button disabled={busy} className="rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 disabled:opacity-60">
            {busy ? 'Uploading…' : 'Submit document'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-semibold text-slate-900">Submitted documents</h3>
        {state.documents?.length ? (
          <ul className="mt-3 space-y-2">
            {state.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                <span className="font-medium capitalize text-slate-700">{String(doc.type).replace(/_/g, ' ')}</span>
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline">View file</a>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : doc.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                  {doc.status}
                </span>
                {doc.review_note && <span className="w-full text-xs text-slate-500">Admin note: {doc.review_note}</span>}
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-500">Nothing submitted yet.</p>}
      </div>
    </div>
  );
}
