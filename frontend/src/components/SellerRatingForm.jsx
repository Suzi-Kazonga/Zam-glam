import { useState } from 'react';
import StarRating from './StarRating';
import { findRating, saveRating } from '../utils/ratingStore';

export default function SellerRatingForm({ order, sellerName, productName, customerEmail, customerName, onSaved }) {
  const existing = findRating(order.id, sellerName, customerEmail);
  const [stars, setStars] = useState(existing?.stars || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [saved, setSaved] = useState(Boolean(existing));

  const submit = (event) => {
    event.preventDefault();
    if (!stars) return;
    saveRating({
      orderId: order.id,
      sellerName,
      customerEmail,
      customerName,
      stars,
      comment,
      productName,
    });
    setSaved(true);
    onSaved?.();
  };

  if (saved) {
    return (
      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm font-semibold text-slate-700">You rated {sellerName}</p>
        <StarRating value={stars} readOnly size="sm" />
        {comment && <p className="mt-2 text-sm text-slate-600">“{comment}”</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800">Rate {sellerName}</p>
      <p className="mt-1 text-xs text-slate-500">After your purchase of {productName}</p>
      <div className="mt-3"><StarRating value={stars} onChange={setStars} /></div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="How was the seller and the item?"
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        rows={3}
      />
      <button disabled={!stars} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
        Submit rating
      </button>
    </form>
  );
}
