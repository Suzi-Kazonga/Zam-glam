// The end of every sign-up form: the password typed again, and agreement to the terms.
//
// Shared by the shopper, shop and courier forms so all three ask for consent the same way.

import { Link } from 'react-router-dom';

const inputClass = 'w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-black';

export function FieldError({ message }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-sm text-rose-700">{message}</p>;
}

export default function SignupConsent({ form, setForm, errors }) {
  return (
    <>
      <div>
        <input
          className={inputClass}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          placeholder="Confirm password"
          type="password"
          aria-label="Confirm password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.agreeToTerms}
            onChange={(e) => setForm({ ...form, agreeToTerms: e.target.checked })}
            className="mt-1"
          />
          {/* Opens in a new tab so a half-filled form is not lost by reading the terms. */}
          <span>
            I agree to the{' '}
            <Link to="/policies#terms" target="_blank" className="font-semibold text-indigo-600 underline">Terms and Conditions</Link>
            {' '}and{' '}
            <Link to="/policies#privacy" target="_blank" className="font-semibold text-indigo-600 underline">Privacy Policy</Link>
          </span>
        </label>
        <FieldError message={errors.agreeToTerms} />
      </div>
    </>
  );
}
