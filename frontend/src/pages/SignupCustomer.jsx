// Sign-up form for a shopper.

import { useState } from 'react';
import * as authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import SignupConsent, { FieldError } from '../components/SignupConsent';
import { validateSignup } from '../utils/signupValidation';

const inputClass = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-black';

export default function SignupCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: '',
    location: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mistakes are shown beside their fields; nothing is sent until the form is right.
    const problems = validateSignup(form);
    setErrors(problems);
    if (Object.keys(problems).length) return;

    try {
      await authApi.register(form.name, form.email, form.password, 'customer', {
        address: form.address,
        phone: form.phone,
        location: form.location,
        acceptedTerms: form.agreeToTerms,
      });
      navigate('/login');
    } catch (error) {
      const message = error?.error || error?.message || 'Sign up failed';
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
      <h1 className="text-2xl font-bold mb-6">Create customer account</h1>
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
        <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" aria-label="Address" />
        <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City/Location (e.g., Lusaka)" aria-label="City" />
        <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" aria-label="Phone" />
        <SignupConsent form={form} setForm={setForm} errors={errors} />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">Sign Up</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <button type="button" onClick={() => navigate('/login', { state: { signupEmail: form.email } })} className="font-semibold text-indigo-600">Log in instead</button></p>
    </div>
  );
}
