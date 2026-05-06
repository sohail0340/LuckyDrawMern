#!/usr/bin/env node
// Simple local integration test for auth endpoints.
// Usage: node ./scripts/run-local-auth-test.mjs
// Ensure backend is running (PORT from backend/.env, default 5000).

import crypto from "crypto";

const BACKEND = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 5000}`;

function log(...args) { console.log(...args); }

async function request(path, method = 'POST', body) {
  const url = `${BACKEND}/api${path}`;
  log('> Request', method, url, body ? JSON.stringify(body) : '');
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  log('< Response', res.status, data);
  return { status: res.status, data };
}

async function run() {
  log('Running local auth test against', BACKEND);

  // random identifier to avoid conflicts
  const id = `testuser+${crypto.randomBytes(4).toString('hex')}@example.com`;
  const password = 'Testpass123!';

  // 1) Register
  const registerPayload = { identifier: id, name: 'Integration Test', password };
  const reg = await request('/auth/register', 'POST', registerPayload);

  if (reg.status === 201) {
    log('Register succeeded. Token present:', Boolean(reg.data.token));
  } else {
    log('Register did not succeed. Status:', reg.status);
  }

  // 2) Login (if registration succeeded or if the account already exists)
  const loginPayload = { identifier: id, password };
  const login = await request('/auth/login', 'POST', loginPayload);

  if (login.status === 200) {
    log('Login succeeded. Token present:', Boolean(login.data.token));
  } else {
    log('Login failed. Status:', login.status);
  }

  // 3) Attempt duplicate register to verify 409
  const dup = await request('/auth/register', 'POST', registerPayload);
  if (dup.status === 409) {
    log('Duplicate register correctly returned 409');
  } else {
    log('Duplicate register returned', dup.status);
  }

  log('Local auth test completed.');
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
