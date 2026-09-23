// Single source of truth for per-role colours. The login page, the site header, the
// dashboard topbar and the sidebar all read from here, so each account type keeps
// the same colour used by the role selector on the first page.
//
// Tailwind scans source files for literal class names, so these must stay written out
// in full — never build them by string interpolation.
export const ROLE_THEMES = {
  customer: {
    label: 'Customer',
    bar: 'bg-indigo-600',
    barHover: 'hover:bg-indigo-700',
    barLink: 'text-indigo-100 hover:text-white',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    accentText: 'text-indigo-700',
    avatar: 'bg-indigo-100 text-indigo-700',
    sidebarActive: 'bg-indigo-100 text-indigo-700',
    softBg: 'bg-indigo-100',
    border: 'border-indigo-600',
  },
  seller: {
    label: 'Seller',
    bar: 'bg-purple-700',
    barHover: 'hover:bg-purple-800',
    barLink: 'text-purple-100 hover:text-white',
    button: 'bg-purple-700 hover:bg-purple-800',
    accentText: 'text-purple-700',
    avatar: 'bg-purple-100 text-purple-700',
    sidebarActive: 'bg-purple-100 text-purple-700',
    softBg: 'bg-purple-100',
    border: 'border-purple-700',
  },
  courier: {
    label: 'Courier',
    bar: 'bg-emerald-700',
    barHover: 'hover:bg-emerald-800',
    barLink: 'text-emerald-100 hover:text-white',
    button: 'bg-emerald-700 hover:bg-emerald-800',
    accentText: 'text-emerald-700',
    avatar: 'bg-emerald-100 text-emerald-700',
    sidebarActive: 'bg-emerald-100 text-emerald-700',
    softBg: 'bg-emerald-100',
    border: 'border-emerald-700',
  },
  admin: {
    label: 'Admin',
    bar: 'bg-slate-900',
    barHover: 'hover:bg-slate-800',
    barLink: 'text-slate-300 hover:text-white',
    button: 'bg-slate-900 hover:bg-slate-800',
    accentText: 'text-slate-900',
    avatar: 'bg-slate-200 text-slate-900',
    sidebarActive: 'bg-slate-100 text-slate-900',
    softBg: 'bg-slate-100',
    border: 'border-slate-900',
  },
};

export function themeForRole(role) {
  return ROLE_THEMES[role] || ROLE_THEMES.customer;
}
