// Add/edit product modal, shared by the seller dashboard, the seller home page and the
// seller's own storefront. Drive it with the useProductEditor hook, which owns the state
// and the create/update calls.
const productCategories = [
  { value: 'clothes', label: 'Clothes' },
  { value: 'Shoes', label: 'Shoes' },
  { value: 'Casual wear', label: 'Casual wear' },
  { value: 'Formal wear', label: 'Formal wear' },
  { value: 'Shirts', label: 'Shirts & tops' },
  { value: 'Pants', label: 'Pants' },
  { value: 'Dresses', label: 'Dresses' },
  { value: 'Jackets', label: 'Jackets' },
  { value: 'Accessories', label: 'Accessories' },
];

export default function ProductForm({ form, setForm, message, onClose, onImages, onSubmit, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">{form.id ? 'Edit product' : 'Add product'}</h2>
        <p className="mt-1 text-sm text-slate-500">Customers will see this on your storefront.</p>
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-slate-600">Product name
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          </label>
          <label className="block text-sm font-medium text-slate-600">Description
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-600">Price (ZMW)
              <input required type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
            </label>
            <label className="block text-sm font-medium text-slate-600">Stock
              <input required type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-600">Expected restock date (optional)
            <input type="date" value={form.restock_expected_at} onChange={(event) => setForm({ ...form, restock_expected_at: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300" />
          </label>
          <label className="block text-sm font-medium text-slate-600">Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300">
              {!productCategories.some((category) => category.value.toLowerCase() === String(form.category).toLowerCase()) && (
                <option value={form.category}>{form.category}</option>
              )}
              {productCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600">Audience
            <select value={form.audience || 'unisex'} onChange={(event) => setForm({ ...form, audience: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300">
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
            </select>
          </label>
          <label className="block rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            {form.id ? 'Add more product photos (optional)' : 'Upload product photos (required)'}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={(event) => { onImages(event.target.files); event.target.value = ''; }} className="mt-2 w-full text-xs" />
            <span className="mt-1 block text-xs text-slate-400">Select several photos together (front, side, and back views). JPG, PNG, GIF, or WebP; up to 6 photos total, max 5MB each.</span>
          </label>
          {form.previews.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">{form.id && !form.imageFiles.length ? 'Current product photos' : 'Product photos · first photo is the main image'}</p>
              <div className="flex flex-wrap gap-2">
                {form.previews.map((src, index) => <div key={`${index}-${src}`} className="relative">
                  <img src={src} alt={`Product view ${index + 1}`} className="h-20 w-16 rounded object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-slate-900/70 px-1 text-[10px] font-semibold text-white">{index === 0 ? 'Main' : `View ${index + 1}`}</span>
                </div>)}
              </div>
            </div>
          )}
          {message && <p className="text-sm text-purple-800">{message}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button>
          <button disabled={saving} className="rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  );
}
