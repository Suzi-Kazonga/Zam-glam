import express from 'express';
import request from 'supertest';

// The limits are read from the environment when the middleware is built, so this suite
// sets its own small ones and imports the module fresh. The rest of the test run keeps
// the generous limits from tests/setup.js.
process.env.LOGIN_MAX_ATTEMPTS = '3';
process.env.LOGIN_WINDOW_MS = '60000';
process.env.SIGNUP_MAX = '2';
process.env.SIGNUP_WINDOW_MS = '60000';
process.env.API_MAX_PER_MINUTE = '5';

const { loginLimiter, signupLimiter, apiLimiter } = await import('../../src/middleware/rateLimit.js');

// A stand-in for the real handlers: this suite is about the limiter, not about signing in.
function appWith(limiter, handler = (req, res) => res.json({ ok: true })) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.post('/try', limiter, handler);
  app.get('/try', limiter, handler);
  return app;
}

const from = (app, address) => request(app).post('/try').set('X-Forwarded-For', address);

describe('Guarding sign-in against guessing', () => {
  test('wrong passwords are allowed a few times, then refused', async () => {
    const app = appWith(loginLimiter, (req, res) => res.status(401).json({ error: 'Invalid credentials' }));
    const address = '10.0.0.1';

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await from(app, address);
      expect(response.status).toBe(401);
    }

    const blocked = await from(app, address);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });

  test('signing in correctly is never counted against you', async () => {
    const app = appWith(loginLimiter);
    const address = '10.0.0.2';

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await from(app, address);
      expect(response.status).toBe(200);
    }
  });

  test('one address being blocked does not block anybody else', async () => {
    const app = appWith(loginLimiter, (req, res) => res.status(401).json({ error: 'Invalid credentials' }));

    for (let attempt = 1; attempt <= 4; attempt += 1) await from(app, '10.0.0.3');
    expect((await from(app, '10.0.0.3')).status).toBe(429);
    expect((await from(app, '10.0.0.4')).status).toBe(401);
  });

  test('the refusal says to wait rather than leaking whether the account exists', async () => {
    const app = appWith(loginLimiter, (req, res) => res.status(401).json({ error: 'Invalid credentials' }));
    for (let attempt = 1; attempt <= 4; attempt += 1) await from(app, '10.0.0.5');
    const blocked = await from(app, '10.0.0.5');
    expect(blocked.body.error).not.toMatch(/password|account|email/i);
  });
});

describe('Capping how many accounts one address can open', () => {
  test('a script cannot fill the accounts tables', async () => {
    const app = appWith(signupLimiter, (req, res) => res.status(201).json({ ok: true }));
    const address = '10.0.1.1';

    expect((await from(app, address)).status).toBe(201);
    expect((await from(app, address)).status).toBe(201);
    const blocked = await from(app, address);
    expect(blocked.status).toBe(429);
  });

  test('a successful sign-up still counts, unlike a successful sign-in', async () => {
    const app = appWith(signupLimiter, (req, res) => res.status(201).json({ ok: true }));
    await from(app, '10.0.1.2');
    await from(app, '10.0.1.2');
    expect((await from(app, '10.0.1.2')).status).toBe(429);
  });
});

describe('The ceiling on everything else', () => {
  test('ordinary traffic is let through until the ceiling', async () => {
    const app = appWith(apiLimiter);
    const address = '10.0.2.1';
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect((await from(app, address)).status).toBe(200);
    }
    expect((await from(app, address)).status).toBe(429);
  });

  test('the response says how long to wait', async () => {
    const app = appWith(apiLimiter);
    const address = '10.0.2.2';
    for (let attempt = 1; attempt <= 6; attempt += 1) await from(app, address);
    const blocked = await from(app, address);
    expect(blocked.headers['ratelimit']).toBeDefined();
  });
});
