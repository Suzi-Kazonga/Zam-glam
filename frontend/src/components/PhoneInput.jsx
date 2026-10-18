import { useState } from 'react';

const COUNTRY_CODES = [
  { label: '🇿🇲 Zambia (+260)', value: '+260' },
  { label: '🇿🇦 South Africa (+27)', value: '+27' },
  { label: '🇲🇼 Malawi (+265)', value: '+265' },
  { label: '🇿🇼 Zimbabwe (+263)', value: '+263' },
  { label: '🇹🇿 Tanzania (+255)', value: '+255' },
  { label: '🇰🇪 Kenya (+254)', value: '+254' },
  { label: '🇬🇧 United Kingdom (+44)', value: '+44' },
];

export default function PhoneInput({ value, onChange }) {
  const [countryCode, setCountryCode] = useState('+260');
  const localNumber = String(value || '').replace(/^\+\d+\s*/, '');

  const updateNumber = (nextNumber) => {
    onChange(nextNumber ? `${countryCode} ${nextNumber}` : '');
  };

  const updateCountryCode = (nextCode) => {
    setCountryCode(nextCode);
    onChange(localNumber ? `${nextCode} ${localNumber}` : '');
  };

  return (
    <label className="block">
      <span className="sr-only">Phone number</span>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(event) => updateCountryCode(event.target.value)}
          aria-label="Country phone code"
          className="w-[9.5rem] rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {COUNTRY_CODES.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
        </select>
        <input
          className="min-w-0 flex-1 rounded border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={localNumber}
          onChange={(event) => updateNumber(event.target.value.replace(/[^0-9\s()-]/g, ''))}
          placeholder="Phone number"
          type="tel"
          inputMode="tel"
          required
        />
      </div>
    </label>
  );
}
