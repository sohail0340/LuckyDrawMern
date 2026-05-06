# Signup Debugging Report

Date: 2026-05-05

Summary
- Root cause: During local development the frontend used `BASE = '/api'` but Vite had no proxy configured (or was configured to a different backend port). Client requests to `/api/auth/register` were not reaching the backend (or returned non-JSON responses), causing the frontend to show a generic "Request failed" message.
- Fixes: Added Vite dev proxy, improved client and server logging, added JSON 404 and global error handler, and created a local test script to validate signup/login.

Files changed
- `frontend/vite.config.ts` — added `/api` proxy (defaults to backend port 5000; override via `BACKEND_URL`).
- `frontend/src/lib/api.ts` — added debug logging for outgoing requests and warnings for non-JSON responses.
- `backend/src/routes/auth.ts` — added structured `logger` calls for register/login and replaced `console.error` with `logger.error`.
- `backend/src/app.ts` — tightened CORS (respects `CLIENT_URL`), added JSON 404 handler for `/api`, and a global error handler that logs and returns JSON.
- `backend/scripts/run-local-auth-test.mjs` — new: integration test script that performs register/login and duplicate register checks against local server.
- `backend/package.json` — added `test:auth` script to run the local auth test.

Validation steps performed / instructions
1) Start backend (default port 5000)
   - `cd backend`
   - `pnpm install`
   - `pnpm build`
   - `PORT=5000 node --enable-source-maps ./dist/index.mjs`
2) Start frontend
   - `cd frontend`
   - `pnpm install`
   - `pnpm dev`
3) Run local auth test (alternative: open UI and sign up)
   - `cd backend`
   - `pnpm run test:auth`

What the test script does
- Registers a random test email (so it doesn't collide with existing users).
- Attempts to log in with the newly created account.
- Attempts a duplicate register to confirm 409 conflict handling.
- Logs request/response for each step to the console so you can correlate with server logs.

If you still see "Request failed"
- Collect the browser console `api.request` debug output (request path, payload), the network response (status + body), and backend logs (the `Register attempt` / `Register error` entries). Paste them here and I will diagnose further.

Notes & next improvements
- Consider returning structured validation errors from backend (zod or express validation) so the client can show helpful messages instead of the generic one.
- Add CI integration tests that run the `test:auth` script against a test MongoDB (or a Dockerized ephemeral instance).

End of report.
