import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  // import.meta.env is Vite's; outside a Vite build (the tests) there is no such object.
  baseURL: import.meta.env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A stored token stops working for ordinary reasons: it expires after seven days, and it
// stops verifying if the server's signing secret is changed. Showing the raw "Invalid
// token" left the browser looking signed in while every request failed, with no way out
// but clearing site data by hand. Treat it for what it is — the session has ended — and
// send the user to sign in again.
export const SESSION_ENDED = 'Your session has ended. Please sign in again.';

export function handleResponseError(error) {
  const status = error.response?.status;
  const hadToken = Boolean(localStorage.getItem('token'));

  if (status === 401 && hadToken) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Let the app tidy its own state, then move to the sign-in page. Nothing happens on
    // the sign-in page itself, so a failed sign-in still shows its own message.
    window.dispatchEvent(new CustomEvent('zamglam:session-ended'));
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign(`/login?reason=${encodeURIComponent(SESSION_ENDED)}`);
    }

    return Promise.reject({ error: SESSION_ENDED, sessionEnded: true });
  }

  return Promise.reject(error);
}

apiClient.interceptors.response.use((response) => response, handleResponseError);

export default apiClient;
