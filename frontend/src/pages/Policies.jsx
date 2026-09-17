// Zamglam's policies: the terms every account agrees to at sign-up, shipping, returns and
// privacy.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Policies() {
  const { hash } = useLocation();

  // The sign-up forms link straight to #terms and #privacy. The page is drawn after the
  // browser has already looked for the anchor, so scroll to it once it exists.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">The details</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">Policies</h1>
      <div className="mt-10 space-y-8">
        <section id="terms">
          <h2 className="text-xl font-bold">Terms and Conditions</h2>
          <p className="mt-2 leading-7 text-slate-600">Creating an account means agreeing to these terms. Give true details: an order is delivered to the address and phone number you enter, and a shop or courier account is checked by an administrator before it is trusted.</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-600">
            <li><strong>Shoppers</strong> pay the price and delivery fee shown at checkout, and are charged for delivery separately for each shop in an order.</li>
            <li><strong>Shops</strong> list only goods they have in stock, hand each parcel to the courier who collects it, and confirm or deny every pickup request honestly.</li>
            <li><strong>Couriers</strong> collect only parcels they have been handed, deliver them to the address given, and mark them delivered only once they have been.</li>
            <li>Anyone can report another party on an order. Accounts reported repeatedly are reviewed and may be suspended, and a suspended account cannot trade.</li>
            <li>An administrator may delete an account that breaks these terms. A deleted account can be restored for 30 days, after which it is removed for good.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold">Shipping</h2>
          <p className="mt-2 leading-7 text-slate-600">Orders are dispatched by our seller partners. Delivery timing and pricing are shown at checkout based on your location.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Returns</h2>
          <p className="mt-2 leading-7 text-slate-600">Request a return within 14 days of delivery. Items must be unworn, unused, and returned with original tags and packaging.</p>
        </section>
        <section id="privacy">
          <h2 className="text-xl font-bold">Privacy</h2>
          <p className="mt-2 leading-7 text-slate-600">We use your account details to process orders, provide support, and improve Zamglam. We do not sell your personal information.</p>
        </section>
      </div>
    </main>
  );
}
