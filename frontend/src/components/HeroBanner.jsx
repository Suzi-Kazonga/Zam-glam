import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { formatZmwPrice } from '../utils/currency';

// The banner advertises real stock from registered stores — never stock photography of
// items nobody can buy. If no products load, it falls back to a plain text banner rather
// than showing a picture of something that isn't for sale.
const MAX_SLIDES = 5;

export default function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiClient.get('/products')
      .then(({ data }) => {
        const products = (Array.isArray(data) ? data : [])
          .filter((product) => product.image_url || product.images?.[0])
          .slice(0, MAX_SLIDES)
          .map((product) => ({
            id: product.id,
            image: product.image_url || product.images[0],
            store: product.store_name || 'Zamglam store',
            name: product.name,
            price: product.price,
          }));
        setSlides(products);
      })
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <section className="relative min-h-[430px] overflow-hidden bg-slate-900 text-white">
      {slide && (
        <img src={slide.image} alt={slide.name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/35 to-transparent" />
      <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center px-6 py-16">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">
            {slide ? slide.store : 'Shop local'}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            {slide ? slide.name : 'Shop Local Zambian Fashion.'}
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-200">
            {slide
              ? `${formatZmwPrice(slide.price)} · in stock now at ${slide.store}`
              : 'Discover clothing and footwear from registered Zambian stores, delivered to your door.'}
          </p>
          <Link
            to={slide ? `/product/${slide.id}` : '/products'}
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            {slide ? 'Shop this item' : 'Shop Now'}
          </Link>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-6 flex gap-2 sm:left-auto sm:right-8">
          {slides.map((item, dot) => (
            <button
              key={item.id}
              aria-label={`Show ${item.name}`}
              onClick={() => setIndex(dot)}
              className={`h-2 rounded-full transition-all ${index === dot ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
