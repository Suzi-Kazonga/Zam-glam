function isNew(product) {
  const created = new Date(product.created_at).getTime();
  const age = Date.now() - created;
  return Number.isFinite(created) && age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
}

function liveOrScheduledPromotion(promotions, productId) {
  const now = Date.now();
  return promotions.find((promotion) => {
    if (Number(promotion.product_id) !== Number(productId)) return false;
    const startsAt = new Date(promotion.starts_at).getTime();
    const endsAt = new Date(promotion.ends_at).getTime();
    return startsAt > now || endsAt > now;
  });
}

function formatDate(value) {
  const dateString = String(value || '');
  const calendarDate = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (calendarDate) {
    return new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3])).toLocaleDateString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

function StockBadge({ stock }) {
  const quantity = Number(stock) || 0;
  const style = quantity === 0
    ? 'bg-rose-50 text-rose-700'
    : quantity < 5
      ? 'bg-amber-50 text-amber-800'
      : 'bg-emerald-50 text-emerald-800';
  const label = quantity === 0 ? 'Out of stock' : quantity < 5 ? `Low stock · ${quantity}` : `In stock · ${quantity}`;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

export default function SellerProductGrid({ products, promotions = [], soldUnits = {}, onAdd, onEdit, onPromote }) {
  return (
    <section aria-label="Store inventory">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clothes and products</h2>
          <p className="mt-1 text-sm text-slate-500">Update stock, edit listings, or put an item on sale.</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          Add clothes
        </button>
      </div>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => {
            const promotion = liveOrScheduledPromotion(promotions, product.id);
            const quantitySold = Number(soldUnits[product.name]) || 0;
            return (
              <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/5] bg-slate-100">
                  <img src={product.image_url || product.images?.[0] || '/images/products/mud-denim.jpg'} alt={product.name} className="h-full w-full object-cover" />
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                    {promotion && <span className="rounded-full bg-rose-600 px-2 py-1 text-xs font-bold text-white">-{promotion.discount_percent}% {new Date(promotion.starts_at).getTime() > Date.now() ? 'Scheduled' : 'Sale'}</span>}
                    {!promotion && isNew(product) && <span className="rounded-full bg-indigo-700 px-2 py-1 text-xs font-bold text-white">New</span>}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900" title={product.name}>{product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-800">K{Number(product.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StockBadge stock={product.stock} />
                    {quantitySold > 0 && <span className="text-xs font-semibold text-slate-500">{quantitySold} sold</span>}
                  </div>
                  {Number(product.stock) === 0 && product.restock_expected_at && (
                    <p className="text-xs text-slate-600">Restock expected {formatDate(product.restock_expected_at)}</p>
                  )}
                  <div className="flex gap-2 border-t border-slate-100 pt-2">
                    <button type="button" onClick={() => onEdit(product)} className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit stock</button>
                    <button type="button" onClick={() => onPromote(product)} className="flex-1 rounded-md bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">Promote</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">Your store is ready for its first listing.</p>
          <p className="mt-1 text-sm text-slate-500">Add a photo, price, and stock quantity to put clothes up for sale.</p>
          <button type="button" onClick={onAdd} className="mt-4 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Add your first product</button>
        </div>
      )}
    </section>
  );
}
