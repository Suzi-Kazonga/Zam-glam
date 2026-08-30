import { useState } from 'react';
import * as authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';

export default function SignupSeller() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    shop_name: '',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.register(form.name, form.email, form.password, 'seller', {
        shop_name: form.shop_name,
        phone: form.phone,
      });
      navigate('/login');
    } catch (error) {
      const message = error?.error || error?.message || 'Seller registration failed';
      const isDuplicate = /already exists|duplicate/i.test(message);

      if (isDuplicate) {
        navigate('/login', {
          state: {
            signupError: 'Account already exists. Please log in instead.',
            signupEmail: form.email,
          },
        });
        return;
      }

      alert(message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create seller account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="Shop Name" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
        <button className="w-full bg-black text-white p-2 rounded">Sign Up</button>
      </form>
    </div>
  );
}
