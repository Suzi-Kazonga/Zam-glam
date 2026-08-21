import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import apiClient from '../api/axios';

const fallbackImage = '/images/products/mud-shirt.jpg';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  useEffect(() => { apiClient.get(`/products/${id}`).then(({ data }) => { setProduct(data); setImage(data.image_url || fallbackImage); }).catch(() => setProduct(false)); }, [id]);
  if (product === null) return <div className="mx-auto max-w-7xl px-4 py-20 text-center">Loading product...</div>;
  if (!product) return <div className="mx-auto max-w-7xl px-4 py-20 text-center">Product not found.</div>;
  return <main className="mx-auto max-w-7xl px-4 py-12"><div className="grid gap-10 lg:grid-cols-2"><div><div className="overflow-hidden rounded-lg bg-slate-100"><img src={image} alt={product.name} className="h-[520px] w-full object-cover transition duration-300 hover:scale-105" /></div><div className="mt-4 flex gap-3"><button onClick={() => setImage(product.image_url || fallbackImage)} className="h-20 w-16 overflow-hidden rounded border-2 border-indigo-600"><img src={product.image_url || fallbackImage} alt="" className="h-full w-full object-cover" /></button><button onClick={() => setImage(fallbackImage)} className="h-20 w-16 overflow-hidden rounded border border-slate-200"><img src={fallbackImage} alt="" className="h-full w-full object-cover" /></button></div></div><div className="py-4"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Zamglam edit</p><h1 className="mt-3 text-4xl font-bold text-slate-900">{product.name}</h1><p className="mt-4 text-2xl font-bold text-indigo-700">K{Number(product.price).toFixed(2)}</p><p className="mt-6 leading-7 text-slate-600">{product.description || 'A versatile Zamglam piece made for everyday styling.'}</p><div className="mt-8"><p className="mb-3 text-sm font-semibold text-slate-700">Size</p><div className="flex gap-2">{['S', 'M', 'L', 'XL'].map((option) => <button key={option} onClick={() => setSize(option)} className={`rounded-lg border px-4 py-2 ${size === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200'}`}>{option}</button>)}</div></div><div className="mt-6"><p className="mb-3 text-sm font-semibold text-slate-700">Color: {color}</p><div className="flex gap-3"><button onClick={() => setColor('Black')} aria-label="Black" className="h-8 w-8 rounded-full border-2 border-indigo-600 bg-slate-900" /><button onClick={() => setColor('Stone')} aria-label="Stone" className="h-8 w-8 rounded-full border-2 border-white bg-stone-300 shadow" /></div></div><button onClick={() => addToCart({ ...product, selectedSize: size, selectedColor: color })} className="mt-10 w-full rounded-lg bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-700">Add to cart</button><section className="mt-10 border-t border-slate-200 pt-8"><h2 className="text-xl font-bold">Reviews</h2><p className="mt-3 text-amber-500">★★★★★ <span className="ml-2 text-sm text-slate-500">4.8 · Loved by Zamglam shoppers</span></p><p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">“Great fit and arrived quickly. The fabric feels much more premium than expected.”</p></section></div></div></main>;
}
