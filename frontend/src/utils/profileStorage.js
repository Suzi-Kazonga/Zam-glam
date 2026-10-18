const STORAGE_PREFIX = 'zamglam_profile_';

export function emailKey(email) {
  return String(email || '').trim().toLowerCase();
}

export function getInitials(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function loadProfileData(email) {
  const safeEmail = emailKey(email);
  if (!safeEmail) return {};

  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${safeEmail}`);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProfileData({ email, initials, profilePhoto }) {
  const safeEmail = emailKey(email);
  if (!safeEmail) return;

  const next = loadProfileData(safeEmail);
  const sanitizedInitials = typeof initials === 'string' ? initials.trim().slice(0, 2).toUpperCase() : '';
  const sanitizedPhoto = typeof profilePhoto === 'string' ? profilePhoto : '';

  if (sanitizedInitials) next.initials = sanitizedInitials;
  else delete next.initials;

  if (sanitizedPhoto) next.profilePhoto = sanitizedPhoto;
  else delete next.profilePhoto;

  if (!next.initials && !next.profilePhoto) {
    localStorage.removeItem(`${STORAGE_PREFIX}${safeEmail}`);
    return;
  }

  localStorage.setItem(`${STORAGE_PREFIX}${safeEmail}`, JSON.stringify(next));
}

export function resolveUserMeta(user) {
  if (!user?.email) return { initials: getInitials(user?.name), profilePhoto: '' };
  const profile = loadProfileData(user.email);
  return {
    initials: profile.initials || getInitials(user.name || user.email),
    profilePhoto: profile.profilePhoto || '',
  };
}
