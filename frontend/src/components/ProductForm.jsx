// Add/edit product modal, shared by the seller dashboard, the seller home page and the
// seller's own storefront. Drive it with the useProductEditor hook, which owns the state
// and the create/update calls.
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
          <label className="block text-sm font-medium text-slate-600">Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-300">
              <option value="clothes">Clothes</option>
              <option value="shoes">Shoes</option>
            </select>
          </label>
          <label className="block rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            {form.id ? 'Replace product images (optional)' : 'Upload product images (required)'}
            <input type="file" accept="image/*" multiple onChange={(event) => onImages(event.target.files)} className="mt-2 w-full text-xs" />
            <span className="mt-1 block text-xs text-slate-400">Up to 6 photos, max 5MB each. The first is used as the main image.</span>
          </label>
          {form.previews.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">{form.imageFiles.length ? 'New photos' : 'Current photos'}</p>
              <div className="flex flex-wrap gap-2">
                {form.previews.map((src) => <img key={src} src={src} alt="" className="h-20 w-16 rounded object-cover" />)}
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
