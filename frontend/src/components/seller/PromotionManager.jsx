import { useEffect, useState } from 'react';
import { createSellerPromotion, deleteSellerPromotion, getSellerPromotions } from '../../api/dealApi';
import DashboardCard from '../DashboardCard';

const initialForm = () => ({
  productId: '',
  discount: '10',
  startsAt: new Date(Date.now() + 60_000).toISOString().slice(0, 16),
  endsAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString().slice(0, 16),
  featured: false,
});

function formatSchedule(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Schedule unavailable' : date.toLocaleString();
}

function promotionState(promotion) {
  const now = Date.now();
  if (new Date(promotion.starts_at).getTime() > now) return 'Scheduled';
  if (new Date(promotion.ends_at).getTime() > now) return 'Live';
  return 'Ended';
}

export default function PromotionManager({ products, onMessage }) {
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadPromotions = () => getSellerPromotions()
    .then((rows) => setPromotions(Array.isArray(rows) ? rows : []))
    .catch(() => onMessage('Could not load your promotions.'));

  useEffect(() => { loadPromotions(); }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createSellerPromotion({
        product_id: Number(form.productId),
        discount_percent: Number(form.discount),
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
        featured: form.featured,
      });
      setForm(initialForm());
      await loadPromotions();
      onMessage('Promotion scheduled. Active offers appear in the storefront deals strip.');
    } catch (error) {
      onMessage(error?.response?.data?.error || error?.error || 'Could not save that promotion.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteSellerPromotion(id);
      setPromotions((current) => current.filter((promotion) => promotion.id !== id));
      onMessage('Promotion removed.');
    } catch (error) {
      onMessage(error?.response?.data?.error || error?.error || 'Could not remove that promotion.');
    }
  };

  return <section className="space-y-5">
    <DashboardCard title="Schedule a promotion" detail="Set the offer window and discount for one of your products.">
      <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">Product
          <select required value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5">
            <option value="">Choose a product</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Discount (%)
          <input required type="number" min="1" max="90" value={form.discount} onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} className="h-4 w-4 accent-emerald-700" />Feature this deal</label>
        <label className="text-sm font-semibold text-slate-700">Starts
          <input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Ends
          <input required type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5" />
        </label>
        <button type="submit" disabled={saving || !products.length} className="self-end rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{saving ? 'Saving...' : 'Schedule offer'}</button>
      </form>
    </DashboardCard>

    <DashboardCard title="Your promotions" detail="Live offers feed the existing storefront countdown display.">
      <div className="mt-4 divide-y divide-slate-100">
        {promotions.map((promotion) => <article key={promotion.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-rose-50 text-sm font-bold text-rose-700">-{promotion.discount_percent}%</span>
            <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{promotion.product_name}</p><p className="mt-1 text-xs text-slate-500">{formatSchedule(promotion.starts_at)} to {formatSchedule(promotion.ends_at)}</p></div>
          </div>
          <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${promotionState(promotion) === 'Live' ? 'bg-emerald-50 text-emerald-800' : promotionState(promotion) === 'Scheduled' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{promotionState(promotion)}</span><button type="button" onClick={() => remove(promotion.id)} className="text-sm font-semibold text-rose-700 hover:text-rose-900">Remove</button></div>
        </article>)}
        {!promotions.length && <p className="py-5 text-sm text-slate-500">No promotions scheduled yet.</p>}
      </div>
    </DashboardCard>
  </section>;
}