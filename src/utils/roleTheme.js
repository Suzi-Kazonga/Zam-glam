// Single source of truth for per-role colours. The login page, the site header, the
// dashboard topbar and the sidebar all read from here, so a role looks the same
// everywhere: customer = indigo, seller = purple, courier = emerald, admin = slate.
//
// Tailwind scans source files for literal class names, so these must stay written out
// in full — never build them by string interpolation.
export const ROLE_THEMES = {
  customer: {
    label: 'Customer',
    bar: 'bg-stone-700',
    barHover: 'hover:bg-stone-800',
    barLink: 'text-stone-100 hover:text-white',
    button: 'bg-stone-700 hover:bg-stone-800',
    accentText: 'text-stone-700',
    avatar: 'bg-stone-100 text-stone-700',
    sidebarActive: 'bg-stone-100 text-stone-700',
    softBg: 'bg-stone-100',
    border: 'border-stone-700',
  },
  seller: {
    label: 'Seller',
    bar: 'bg-neutral-700',
    barHover: 'hover:bg-neutral-800',
    barLink: 'text-neutral-100 hover:text-white',
    button: 'bg-neutral-700 hover:bg-neutral-800',
    accentText: 'text-neutral-700',
    avatar: 'bg-neutral-100 text-neutral-700',
    sidebarActive: 'bg-neutral-100 text-neutral-700',
    softBg: 'bg-neutral-100',
    border: 'border-neutral-700',
  },
  courier: {
    label: 'Courier',
    bar: 'bg-zinc-700',
    barHover: 'hover:bg-zinc-800',
    barLink: 'text-zinc-100 hover:text-white',
    button: 'bg-zinc-700 hover:bg-zinc-800',
    accentText: 'text-zinc-700',
    avatar: 'bg-zinc-100 text-zinc-700',
    sidebarActive: 'bg-zinc-100 text-zinc-700',
    softBg: 'bg-zinc-100',
    border: 'border-zinc-700',
  },
  admin: {
    label: 'Admin',
    bar: 'bg-zinc-900',
    barHover: 'hover:bg-zinc-800',
    barLink: 'text-zinc-300 hover:text-white',
    button: 'bg-zinc-900 hover:bg-zinc-800',
    accentText: 'text-zinc-900',
    avatar: 'bg-zinc-200 text-zinc-900',
    sidebarActive: 'bg-zinc-100 text-zinc-900',
    softBg: 'bg-zinc-100',
    border: 'border-zinc-900',
  },
};

export function themeForRole(role) {
  return ROLE_THEMES[role] || ROLE_THEMES.customer;
}
