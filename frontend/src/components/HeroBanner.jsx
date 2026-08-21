import { useEffect, useState } from 'react';

const slides = [
  { eyebrow: 'Shop local', title: 'Shop Local Zambian Fashion.', copy: 'Discover Mud, Jets, Bata, and more in one considered edit.', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85' },
  { eyebrow: 'Weekend wardrobe', title: 'Up to 30% off selected styles.', copy: 'Build a wardrobe that works harder, without the hard price tag.', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=85' },
  { eyebrow: 'Zamglam essentials', title: 'Small details. Big energy.', copy: 'Accessories and finishing touches for your next chapter.', image: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1600&q=85' },
];

export default function HeroBanner() {
  const [index, setIndex] = useState(0);
  useEffect(() => { const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 5000); return () => clearInterval(timer); }, []);
  const slide = slides[index];
  return <section className="relative min-h-[430px] overflow-hidden bg-slate-900 text-white"><img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/35 to-transparent" /><div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center px-6 py-16"><div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">{slide.eyebrow}</p><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{slide.title}</h1><p className="mt-5 max-w-md text-lg text-slate-200">{slide.copy}</p><a href="/products" className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Shop the edit</a></div></div><div className="absolute bottom-6 left-6 flex gap-2 sm:left-auto sm:right-8">{slides.map((item, dot) => <button key={item.title} aria-label={`Show slide ${dot + 1}`} onClick={() => setIndex(dot)} className={`h-2 rounded-full transition-all ${index === dot ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} />)}</div></section>;
}