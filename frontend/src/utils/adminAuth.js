export const ADMIN_CREDENTIALS = {
  email: 'admin@zamglam.local',
  password: 'Admin123!',
};

const ADMIN_USER = {
  id: 'admin-1',
  name: 'Zamglam Admin',
  email: ADMIN_CREDENTIALS.email,
  role: 'admin',
};

export function loginAsLocalAdmin(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_CREDENTIALS.email) return null;

  // Fall through to the real backend login so a real account on this email still works.
  if (password !== ADMIN_CREDENTIALS.password) return null;

  const token = 'admin-local-session';
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(ADMIN_USER));
  return { user: ADMIN_USER, token };
}
