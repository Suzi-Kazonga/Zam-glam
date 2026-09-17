// The checks every sign-up form makes before anything is sent.
//
// Adapted from the original CustomerSignUp and SellerSignUp forms, so the rules are the
// same whichever kind of account is being made. The server repeats the ones that matter
// (required fields, terms accepted); these exist so a mistake is shown next to the field
// instead of after a round trip.
//
// Returns an object of field -> message. An empty object means the form can be sent.
export function validateSignup(form, { nameLabel = 'Name' } = {}) {
  const errors = {};

  if (!form.name?.trim()) errors.name = `${nameLabel} is required`;
  else if (form.name.trim().length < 2) errors.name = `${nameLabel} must be at least 2 characters`;

  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Please enter a valid email address';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';

  // Typed twice, because a typo here locks somebody out of the account they just made.
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (!form.agreeToTerms) errors.agreeToTerms = 'You must agree to the terms and conditions';

  return errors;
}
