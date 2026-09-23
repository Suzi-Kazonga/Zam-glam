// Where a shopper scores a shop after a delivery.

import { useState } from 'react';
import StarRating from './StarRating';
import { rateSeller } from '../api/reviewApi';

// Ratings are saved server-side against the delivered order, so every shopper sees the
// same score. The backend refuses a rating from someone who did not buy from this shop,
// or whose parcel has not been delivered yet.
export default function SellerRatingForm({ order, sellerId, sellerName, existing, onSaved }) {
  const [stars, setStars] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [saved, setSaved] = useState(Boolean(existing));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!stars) return;
    setBusy(true);
    setError('');
    try {
      await rateSeller({ sellerId, orderId: order.id, rating: stars, comment });
      setSaved(true);
      onSaved?.();
    } catch (submitError) {
      setError(submitError?.error || submitError?.message || 'Could not save your rating.');
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm font-semibold text-slate-700">You rated {sellerName}</p>
        <StarRating value={stars} readOnly size="sm" />
        {comment && <p className="mt-2 text-sm text-slate-600">“{comment}”</p>}
        <button type="button" onClick={() => setSaved(false)} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
          Change my rating
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800">Rate {sellerName}</p>
      <p className="mt-1 text-xs text-slate-500">Order #{order.id}</p>
      <div className="mt-3"><StarRating value={stars} onChange={setStars} /></div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="How was the seller and the item?"
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        rows={3}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <button disabled={!stars || busy} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
        {busy ? 'Saving…' : 'Submit rating'}
      </button>
    </form>
  );
}
