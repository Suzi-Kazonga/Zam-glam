import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// Signing up, as a shopper would: the form checks itself before anything is sent, and an
// account is only asked for once the terms have been agreed to.

const register = jest.fn(() => Promise.resolve({}));
// Jest resolves a mocked path from its setup file rather than from here, so name it in full.
jest.unstable_mockModule(fileURLToPath(new URL('../api/authApi.js', import.meta.url)), () => ({
  register,
  login: jest.fn(),
  logout: jest.fn(),
}));

const { MemoryRouter } = await import('react-router-dom');
const { default: SignupCustomer } = await import('./SignupCustomer');
const { validateSignup } = await import('../utils/signupValidation');

const openForm = () => render(<MemoryRouter><SignupCustomer /></MemoryRouter>);

const fillIn = async ({ name = 'Chanda Banda', email = 'chanda@example.com', password = 'Secret123', confirm = 'Secret123', agree = true } = {}) => {
  if (name) await userEvent.type(screen.getByLabelText('Name'), name);
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
  if (confirm) await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
  if (agree) await userEvent.click(screen.getByRole('checkbox'));
  await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
};

beforeEach(() => register.mockClear());

describe('The sign-up checks', () => {
  test('a complete form has no problems', () => {
    expect(validateSignup({ name: 'Chanda', email: 'c@example.com', password: 'Secret123', confirmPassword: 'Secret123', agreeToTerms: true })).toEqual({});
  });

  test('each missing piece is named', () => {
    const errors = validateSignup({ name: '', email: 'not-an-email', password: '123', confirmPassword: '321', agreeToTerms: false });
    expect(Object.keys(errors).sort()).toEqual(['agreeToTerms', 'confirmPassword', 'email', 'name', 'password']);
  });
});

describe('Signing up as a shopper', () => {
  test('nothing is sent without agreeing to the terms', async () => {
    openForm();
    await fillIn({ agree: false });
    expect(await screen.findByText('You must agree to the terms and conditions')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('passwords that do not match are caught', async () => {
    openForm();
    await fillIn({ confirm: 'Different1' });
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('a correct form creates the account and says the terms were accepted', async () => {
    openForm();
    await fillIn();
    expect(register).toHaveBeenCalledTimes(1);
    const [, email, , role, profile] = register.mock.calls[0];
    expect(email).toBe('chanda@example.com');
    expect(role).toBe('customer');
    expect(profile.acceptedTerms).toBe(true);
  });

  test('the terms are one click away', () => {
    openForm();
    expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '/policies#terms');
  });
});
