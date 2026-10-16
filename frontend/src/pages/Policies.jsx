// Zamglam's policies: the terms every account agrees to at sign-up, shipping, returns and
// privacy.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const guideSteps = [
  'Browse products or shops and choose the item you want.',
  'Review the product details, size, delivery cost, and seller rating before checkout.',
  'Complete payment, then track the order from your dashboard as the seller prepares it.',
  'Receive delivery updates and confirm delivery once your parcel arrives safely.',
  'If an item is wrong, damaged, or not as described, open a return request in the order page.',
];

export default function Policies() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The details</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">Policies & shopping guide</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="space-y-8">
          <section id="terms">
            <h2 className="text-xl font-bold text-slate-900">Terms and Conditions</h2>
            <p className="mt-2 leading-7 text-slate-600">Creating an account means agreeing to these terms. Give true details: an order is delivered to the address and phone number you enter, and a shop or courier account is checked by an administrator before it is trusted.</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-600">
              <li><strong>Shoppers</strong> pay the price and delivery fee shown at checkout, and are charged for delivery separately for each shop in an order.</li>
              <li><strong>Shops</strong> list only goods they have in stock, hand each parcel to the courier who collects it, and confirm or deny every pickup request honestly.</li>
              <li><strong>Couriers</strong> collect only parcels they have been handed, deliver them to the address given, and mark them delivered only once they have been.</li>
              <li>Anyone can report another party on an order. Accounts reported repeatedly are reviewed and may be suspended, and a suspended account cannot trade.</li>
              <li>An administrator may delete an account that breaks these terms. A deleted account can be restored for 30 days, after which it is removed for good.</li>
            </ul>
          </section>

          <section id="shipping">
            <h2 className="text-xl font-bold text-slate-900">Shipping Info</h2>
            <p className="mt-2 leading-7 text-slate-600">Orders are dispatched by our seller partners. Delivery timing and pricing are shown at checkout based on your location, the size of the parcel and the chosen courier route.</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-600">
              <li>Standard delivery generally arrives within 2–5 business days in Lusaka and nearby towns.</li>
              <li>Delivery fees are shown clearly before payment is completed.</li>
              <li>Couriers may update the route and delivery window while the parcel is in transit.</li>
            </ul>
          </section>

          <section id="returns">
            <h2 className="text-xl font-bold text-slate-900">Returns</h2>
            <p className="mt-2 leading-7 text-slate-600">Request a return within 14 days of delivery. Items must be unworn, unused, and returned with original tags and packaging.</p>
          </section>

          <section id="refunds">
            <h2 className="text-xl font-bold text-slate-900">Refunds</h2>
            <p className="mt-2 leading-7 text-slate-600">Approved refunds are credited back to the original payment method after the returned item is inspected. Refunds are generally processed within 5–10 business days.</p>
          </section>

          <section id="payment">
            <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
            <p className="mt-2 leading-7 text-slate-600">Zamglam supports secure payment flows through the app, selecting the payment method available at checkout. Payment is confirmed before a store starts preparing the order.</p>
          </section>

          <section id="privacy">
            <h2 className="text-xl font-bold text-slate-900">Privacy & Cookie Policy</h2>
            <p className="mt-2 leading-7 text-slate-600">We use your account details to process orders, provide support, and improve Zamglam. We do not sell your personal information, and we only keep the data needed to fulfil orders and support your account.</p>
          </section>

          <section id="guide">
            <h2 className="text-xl font-bold text-slate-900">How to order</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-6 leading-7 text-slate-600">
              {guideSteps.map((step, index) => (
                <li key={step}><strong className="text-slate-900">Step {index + 1}:</strong> {step}</li>
              ))}
            </ol>
          </section>

          <section id="accessibility">
            <h2 className="text-xl font-bold text-slate-900">Accessibility</h2>
            <p className="mt-2 leading-7 text-slate-600">Use the app with keyboard focus, larger text, and clear contrast. If a popup, message, or order status is difficult to read, open the settings menu or contact Zamglam support.</p>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Quick help</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Need support?</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Check your order status in your dashboard.</li>
              <li>• Contact a seller or courier from the order page.</li>
              <li>• Review shipping and refund guidance before requesting a return.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Best practice</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">Use the correct delivery address, keep your phone available for courier updates, and report damaged or missing parcels as soon as you can.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
