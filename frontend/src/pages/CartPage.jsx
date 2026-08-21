import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const [delivery, setDelivery] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  const requestQuote = async () => {
    setQuoteError('');
    try {
      const { data } = await apiClient.post('/delivery/quote', {
        pickup: { lat: -15.4167, lng: 28.2833 },
        dropoff: { lat: -15.39, lng: 28.32 },
      });
      setDelivery(data);
    } catch (error) {
      setQuoteError(error.response?.data?.error || 'Delivery quote unavailable');
    }
  };

  if (!cart.length) return <section className="mx-auto max-w-3xl px-6 py-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Your bag is empty</h1><p className="mt-3 text-slate-500">Find something that feels like you.</p><Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white">Start shopping</Link></section>;

  return <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_360px]">
    <div><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Your selection</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Shopping bag</h1></div>
      <div className="space-y-4">{cart.map((item) => <article key={item.id} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><img src={item.image_url || item.image || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=240&q=80'} alt="" className="h-28 w-24 rounded object-cover" /><div className="flex flex-1 justify-between"><div><h2 className="font-semibold text-slate-900">{item.name || item.title}</h2><p className="mt-2 text-indigo-700">K{Number(item.price).toFixed(2)}</p></div><div className="flex items-start gap-3"><input aria-label="Quantity" type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, Number(e.target.value))} className="w-16 rounded border px-2 py-1" /><button onClick={() => removeFromCart(item.id)} className="text-sm text-rose-600">Remove</button></div></div></article>)}</div>
    </div>
    <aside className="h-fit rounded-lg bg-slate-900 p-6 text-white"><h2 className="text-xl font-bold">Checkout</h2><div className="mt-6 flex justify-between border-b border-slate-700 pb-4"><span>Items</span><strong>K{getTotalPrice().toFixed(2)}</strong></div><button onClick={requestQuote} className="mt-5 w-full rounded-lg border border-slate-600 px-4 py-3 text-left hover:border-indigo-400">{delivery ? `Delivery: K${Number(delivery.total_price || delivery.price).toFixed(2)} · ${delivery.eta || '30-45 min'}` : 'Get delivery estimate'}</button>{quoteError && <p className="mt-2 text-sm text-rose-300">{quoteError}</p>}<div className="mt-5 flex justify-between text-lg"><span>Total</span><strong>K{(getTotalPrice() + Number(delivery?.total_price || 0)).toFixed(2)}</strong></div><button className="mt-6 w-full rounded-lg bg-indigo-500 py-3 font-semibold hover:bg-indigo-400">Confirm order</button></aside>
  </section>;
}
