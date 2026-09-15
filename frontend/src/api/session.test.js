import { jest } from '@jest/globals';
import { handleResponseError, SESSION_ENDED } from './axios';

// A stored token stops verifying when it expires, or when the server's signing secret is
// changed. The app used to keep looking signed in while every request failed with a raw
// "Invalid token", and there was no way out but clearing site data by hand.

describe('When the server rejects a stored token', () => {
  const rejection = (status) => ({ response: { status, data: { error: 'Invalid token' } } });

  // jsdom's location cannot be spied on, so stand a plain object in its place.
  const realLocation = window.location;
  let assign;

  beforeEach(() => {
    localStorage.clear();
    assign = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/admin/dashboard', assign },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });
    jest.restoreAllMocks();
  });

  test('the dead token and user are thrown away', async () => {
    localStorage.setItem('token', 'signed-with-the-old-secret');
    localStorage.setItem('user', '{"role":"admin"}');

    await expect(handleResponseError(rejection(401))).rejects.toMatchObject({ sessionEnded: true });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('the app is told, so the header stops offering a dashboard', async () => {
    localStorage.setItem('token', 'dead');
    const listener = jest.fn();
    window.addEventListener('zamglam:session-ended', listener);

    await expect(handleResponseError(rejection(401))).rejects.toBeDefined();
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('zamglam:session-ended', listener);
  });

  test('the user is sent to sign in, with the reason', async () => {
    localStorage.setItem('token', 'dead');
    await expect(handleResponseError(rejection(401))).rejects.toBeDefined();

    expect(assign).toHaveBeenCalledWith(`/login?reason=${encodeURIComponent(SESSION_ENDED)}`);
  });

  test('the message explains itself rather than saying "Invalid token"', async () => {
    localStorage.setItem('token', 'dead');
    await expect(handleResponseError(rejection(401))).rejects.toMatchObject({ error: SESSION_ENDED });
  });

  test('a failed sign-in keeps its own message, and nobody is redirected', async () => {
    // No stored token: this is somebody typing the wrong password, not a dead session.
    const original = rejection(401);
    await expect(handleResponseError(original)).rejects.toBe(original);
    expect(assign).not.toHaveBeenCalled();
  });

  test('other failures are passed through untouched', async () => {
    localStorage.setItem('token', 'good');
    const forbidden = rejection(403);
    await expect(handleResponseError(forbidden)).rejects.toBe(forbidden);

    const serverError = rejection(500);
    await expect(handleResponseError(serverError)).rejects.toBe(serverError);
    expect(localStorage.getItem('token')).toBe('good');
  });
});
