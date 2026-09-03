import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orderApi';
import { isLocalDemoSession, LOCAL_DEMO_ORDER_MESSAGE } from '../utils/localSession';

const payments = [
  { id: 'Airtel Money', detail: 'Pay with your Airtel number' },
  { id: 'MTN MoMo', detail: 'Pay with MTN Mobile Money' },
  { id: 'Card', detail: 'Visa or Mastercard' },
];

const detectPaymentMethod = (phone) => {
  // Detect payment based on phone number (third digit after first 0)
  // 0976... or 097... → Airtel (digit at index 3 is 7)
  // 0966... or 096... → MTN (digit at index 3 is 6)
  if (!phone) return 'Airtel Money';
  const cleanPhone = String(phone).replace(/\D/g, '');
  const firstZero = cleanPhone.indexOf('0');
  if (firstZero >= 0 && cleanPhone.length > firstZero + 3) {
    const thirdDigitAfterZero = cleanPhone[firstZero + 3];
    if (thirdDigitAfterZero === '7') return 'Airtel Money';
    if (thirdDigitAfterZero === '6') return 'MTN MoMo';
  }
  return 'Airtel Money';
};

export default function CartPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [step, setStep] = useState('bag');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [checkout, setCheckout] = useState({
    address: user?.address || '',
    phone: user?.phone || '',
    location: user?.location || user?.city || '',
    paymentMethod: detectPaymentMethod(user?.phone),
  });

  useEffect(() => {
    // Update payment method if phone changes
    setCheckout((prev) => ({
      ...prev,
      paymentMethod: detectPaymentMethod(prev.phone),
    }));
  }, [checkout.phone]);

  const placeOrder = async (event) => {
    event.preventDefault();
    setPlaceError('');

    if (!user) {
      setPlaceError('Please sign in to place an order.');
      return;
    }
    if (isLocalDemoSession()) {
      setPlaceError(LOCAL_DEMO_ORDER_MESSAGE);
      return;
    }

    setPlacing(true);
    try {
      const order = await createOrder({
        items: cart,
        address: checkout.address,
        location: checkout.location,
        phone: checkout.phone,
        paymentMethod: checkout.paymentMethod,
      });
      clearCart();
      setPlacedOrder(order);
      setStep('placed');
    } catch (error) {
      setPlaceError(error.response?.data?.error || error.message || 'Could not place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (step === 'placed' && placedOrder) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Order placed</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Your order is on its way</h1>
        <p className="mt-3 text-slate-500">Order #{placedOrder.id} is confirmed. Tracking starts as soon as the shop begins packing.</p>
        <div className="mt-8 space-y-3 rounded-lg border border-slate-200 bg-white p-6">
          <p><span className="text-slate-500">Deliver to</span> · {placedOrder.address}</p>
          <p><span className="text-slate-500">Location</span> · {placedOrder.location}</p>
          <p><span className="text-slate-500">Phone</span> · {placedOrder.phone}</p>
          <p><span className="text-slate-500">Payment</span> · {placedOrder.paymentMethod}</p>
          <p><span className="text-slate-500">Total</span> · K{Number(placedOrder.total).toFixed(2)}</p>
          <p className="capitalize"><span className="text-slate-500">Status</span> · {placedOrder.status}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`/orders/${placedOrder.id}`} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Track order</Link>
          <Link to="/products" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700">Keep shopping</Link>
        </div>
      </section>
    );
  }

  if (!cart.length) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Your bag is empty</h1>
        <p className="mt-3 text-slate-500">Find something that feels like you.</p>
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white">Start shopping</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{step === 'checkout' ? 'Checkout' : 'Your selection'}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{step === 'checkout' ? 'Delivery and payment' : 'Shopping bag'}</h1>
        </div>

        {step === 'bag' && (
          <div className="space-y-4">
            {cart.map((item) => {
              const key = item.lineId || item.id;
              return (
                <article key={key} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <img src={item.image_url || '/images/products/mud-denim.jpg'} alt="" className="h-28 w-24 rounded object-cover" />
                  <div className="flex flex-1 justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-slate-900">{item.name || item.title}</h2>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{item.store_name || item.sellerName || 'Zamglam'}</p>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="mt-1 text-sm text-slate-500">{[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}</p>
                      )}
                      <p className="mt-2 text-indigo-700">K{Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button type="button" onClick={() => updateQuantity(key, item.quantity - 1)} className="px-3 py-1 text-lg">-</button>
                        <input aria-label="Quantity" type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(key, Number(event.target.value))} className="w-12 border-x px-2 py-1 text-center" />
                        <button type="button" onClick={() => updateQuantity(key, item.quantity + 1)} className="px-3 py-1 text-lg">+</button>
                      </div>
                      <button onClick={() => removeFromCart(key)} className="text-sm text-rose-600">Remove</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {step === 'checkout' && (
          <form id="checkout-form" onSubmit={placeOrder} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
            {!user && (
              <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                <Link to="/login" state={{ from: location }} className="font-semibold underline">Sign in</Link> to place this order — an account is required so we can save it and let you track delivery.
              </p>
            )}
            {placeError && (
              <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{placeError}</p>
            )}
            <label className="block text-sm font-medium text-slate-700">Delivery address
              <input required value={checkout.address} onChange={(event) => setCheckout({ ...checkout, address: event.target.value })} placeholder="House number, street, city" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Location/City
              <input required value={checkout.location} onChange={(event) => setCheckout({ ...checkout, location: event.target.value })} placeholder="e.g., Lusaka, Kitwe, Ndola" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Phone
              <input required value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} placeholder="+260 ..." className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-300" />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Payment method</legend>
              <div className="mt-3 space-y-2">
                {payments.map((method) => (
                  <label key={method.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checkout.paymentMethod === method.id ? method.id === 'Airtel Money' ? 'border-red-600 bg-red-50' : method.id === 'MTN MoMo' ? 'border-yellow-500 bg-yellow-50' : 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}>
                    <input type="radio" name="payment" checked={checkout.paymentMethod === method.id} onChange={() => setCheckout({ ...checkout, paymentMethod: method.id })} className="mt-1" />
                    <span>
                      <span className={`block font-semibold ${method.id === 'Airtel Money' ? 'text-red-700' : method.id === 'MTN MoMo' ? 'text-yellow-700' : 'text-slate-900'}`}>{method.id}</span>
                      <span className="text-sm text-slate-500">{method.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        )}
      </div>

      <aside className="h-fit rounded-lg bg-slate-900 p-6 text-white">
        <h2 className="text-xl font-bold">{step === 'checkout' ? 'Place order' : 'Checkout'}</h2>
        <div className="mt-6 flex justify-between border-b border-slate-700 pb-4">
          <span>Items</span>
          <strong>K{getTotalPrice().toFixed(2)}</strong>
        </div>
        <p className="mt-5 text-sm text-slate-300">
          {step === 'checkout' ? 'Confirm delivery and payment to place the order. You can rate the seller after you receive it.' : 'Review your bag, then add delivery and payment.'}
        </p>
        <div className="mt-5 flex justify-between text-lg">
          <span>Total</span>
          <strong>K{getTotalPrice().toFixed(2)}</strong>
        </div>
        {step === 'bag' ? (
          <button onClick={() => setStep('checkout')} className="mt-6 w-full rounded-lg bg-indigo-500 py-3 font-semibold hover:bg-indigo-400">Continue to checkout</button>
        ) : (
          <div className="mt-6 space-y-3">
            <button form="checkout-form" type="submit" disabled={placing} className="w-full rounded-lg bg-indigo-500 py-3 font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">{placing ? 'Placing order…' : 'Place order'}</button>
            <button type="button" onClick={() => setStep('bag')} className="w-full rounded-lg border border-slate-600 py-3 font-semibold text-slate-200 hover:border-slate-400">Back to bag</button>
          </div>
        )}
      </aside>
    </section>
  );
}
