// Sign-up form for a shop.
//
// A new shop can sign in and list immediately, but shows as unverified until it uploads
// its registration documents and an administrator checks them.

import { useState } from 'react';
import * as authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import SignupConsent, { FieldError } from '../components/SignupConsent';
import { validateSignup } from '../utils/signupValidation';

const inputClass = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-black';

export default function SignupSeller() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    shop_name: '',
    phone: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mistakes are shown beside their fields; nothing is sent until the form is right.
    const problems = validateSignup(form);
    if (!form.shop_name.trim()) problems.shop_name = 'Shop name is required';
    setErrors(problems);
    if (Object.keys(problems).length) return;

    try {
      await authApi.register(form.name, form.email, form.password, 'seller', {
        shop_name: form.shop_name,
        phone: form.phone,
        acceptedTerms: form.agreeToTerms,
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
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" aria-label="Name" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" aria-label="Email" />
          <FieldError message={errors.email} />
        </div>
        <div>
          <input className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" aria-label="Password" />
          <FieldError message={errors.password} />
        </div>
        <div>
          <input className={inputClass} value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="Shop Name" aria-label="Shop name" />
          <FieldError message={errors.shop_name} />
        </div>
        <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" aria-label="Phone" />
        <SignupConsent form={form} setForm={setForm} errors={errors} />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">Sign Up</button>
      </form>
    </div>
  );
}
