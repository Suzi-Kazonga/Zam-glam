// Sign-up form for a courier.
//
// A new rider cannot take any work until an administrator approves the account, because
// couriers carry other people’s parcels.

import { useState } from 'react';
import * as authApi from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import SignupConsent, { ConfirmPasswordField, FieldError } from '../components/SignupConsent';
import BackButton from '../components/BackButton';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import PhoneInput from '../components/PhoneInput';
import { validateSignup } from '../utils/signupValidation';
import { getInitials, saveProfileData } from '../utils/profileStorage';

const inputClass = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-black';

export default function SignupCourier() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    agreeToTerms: false,
    // Optional, and kept on this device only: what the profile icon shows.
    initials: '',
    profilePhoto: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mistakes are shown beside their fields; nothing is sent until the form is right.
    const problems = validateSignup(form, { nameLabel: 'Full name' });
    setErrors(problems);
    if (Object.keys(problems).length) return;

    try {
      await authApi.register(form.name, form.email, form.password, 'courier', {
        phone: form.phone,
        location: form.location,
        acceptedTerms: form.agreeToTerms,
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
      <p className="mb-6 text-sm text-slate-600">Deliver parcels for Zamglam shops. Once an administrator approves your account, go on duty to see parcels waiting for collection, ask the shop to hand one over, and mark it delivered when it arrives.</p>
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" aria-label="Full name" />
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
        <ConfirmPasswordField form={form} setForm={setForm} errors={errors} />
        <PhoneInput value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
        <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Base city (e.g., Lusaka)" aria-label="Base city" />
        <input className={inputClass} value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} placeholder="Initials (optional)" aria-label="Initials" maxLength={2} />
        <ProfilePhotoPicker value={form.profilePhoto} onChange={(profilePhoto) => setForm((current) => ({ ...current, profilePhoto }))} />
        <SignupConsent form={form} setForm={setForm} errors={errors} />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">Sign Up</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <button type="button" onClick={() => navigate('/login', { state: { signupEmail: form.email } })} className="font-semibold text-indigo-600">Log in instead</button></p>
    </div>
  );
}
