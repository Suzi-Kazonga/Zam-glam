import { useState } from 'react';
import * as authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import PhoneInput from '../components/PhoneInput';
import { getInitials, saveProfileData } from '../utils/profileStorage';

export default function SignupCourier() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    initials: '',
    profilePhoto: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.register(form.name, form.email, form.password, 'courier', {
        phone: form.phone,
        location: form.location,
      });
      saveProfileData({
        email: form.email,
        initials: form.initials || getInitials(form.name),
        profilePhoto: form.profilePhoto,
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
      <div className="mb-4">
        <BackButton to="/signup" label="Back" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Create courier account</h1>
      <p className="mb-6 text-sm text-slate-600">Deliver parcels for Zamglam shops. Parcels are assigned to you at checkout, and you confirm each delivery.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" />
        <PhoneInput value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Base city (e.g., Lusaka)" />
        <input className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-black" value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} placeholder="Initials (optional)" maxLength={2} />
        <ProfilePhotoPicker value={form.profilePhoto} onChange={(profilePhoto) => setForm((current) => ({ ...current, profilePhoto }))} />
        <button className="w-full bg-black text-white p-2 rounded">Sign Up</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <button type="button" onClick={() => navigate('/login', { state: { signupEmail: form.email } })} className="font-semibold text-indigo-600">Log in instead</button></p>
    </div>
  );
}
