# ApplyTrack — Job Application Tracker (MERN)

A full-stack web app for tracking your own job search: register, log in, and manage every
application through a hiring pipeline — **Applied → Phone Screen → Interview → Offer / Rejected** —
with a dashboard that shows counts per stage at a glance. Built with the MERN stack
(MongoDB, Express, React, Node.js) and JWT authentication.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, React Router v6, Axios, Context API |
| Backend  | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (local or Atlas) |
| Auth     | JWT (jsonwebtoken) + bcryptjs password hashing |

## Features

- **JWT auth** — register, log in, log out; passwords hashed with bcrypt; a `me` endpoint returns the signed-in profile.
- **Full CRUD for applications** — company, role, status, location, job URL, date applied, notes.
- **Pipeline dashboard** — Kanban-style board with one column per status; move a card between stages from a dropdown (optimistic UI update, rolled back if the API call fails).
- **Stats endpoint & cards** — `GET /api/applications/stats` aggregates counts by status with a MongoDB aggregation pipeline; the client renders total, per-stage counts, and a "% moved past Applied" card.
- **Search** — filter applications by company or role text.
- **Protected everything** — every application route requires a Bearer token on the API side, and React routes are wrapped in a `ProtectedRoute` component on the client side; a 401 from the API clears the stored token and redirects to login.
- **Per-user data isolation** — every query is scoped to the token's user id, so users only ever see their own applications.

## Setup

You need Node.js 18+ and a MongoDB connection (local `mongod` or a free MongoDB Atlas cluster).

### 1. Server (port 5000)

```bash
cd server
cp .env.example .env      # set MONGO_URI and a real JWT_SECRET
npm install
npm start                 # or: npm run dev  (restarts on file changes)
```

`.env` values:

| Variable | Example |
|----------|---------|
| `PORT` | `5000` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/applytrack` or your Atlas SRV string |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_ORIGIN` | `http://localhost:5173` |

Check it is up: `curl http://localhost:5000/api/health` → `{"status":"ok",...}`

**Smoke test (no local MongoDB needed):**

```bash
cd server
npm run smoke   # boots the app against an in-memory MongoDB and exercises
                # register -> login -> create -> list -> stats -> update -> delete
```

### 2. Client (port 5173)

```bash
cd client
npm install
npm run dev       # open http://localhost:5173
```

In dev, Vite proxies `/api` to `http://localhost:5000`, so no CORS config is needed.
For a production build (`npm run build`), set `VITE_API_URL` to the deployed API's base URL
(e.g. `https://your-api.example.com/api`).

### 3. Use it

Register an account → add your first application → drag it through the pipeline stages
as your real job search progresses.

## API summary

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/register` | – | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | – | Log in, returns `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current user's profile |
| GET | `/api/applications` | Bearer | My applications (`?status=`, `?q=` filters) |
| GET | `/api/applications/stats` | Bearer | `{ total, byStatus, inProgress, offers, responseRate }` |
| POST | `/api/applications` | Bearer | Create an application |
| GET | `/api/applications/:id` | Bearer | One application |
| PUT | `/api/applications/:id` | Bearer | Update fields / move pipeline stage |
| DELETE | `/api/applications/:id` | Bearer | Delete |

## Project structure

```
applytrack-mern/
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── index.js              # loads .env, connects DB, listens on PORT (5000)
│   ├── app.js                # createApp(): CORS, JSON, routes, error handler (exported for tests)
│   ├── config/db.js          # Mongoose connection helper
│   ├── models/
│   │   ├── User.js           # name/email/password, bcrypt pre-save hook, toJSON strips the hash
│   │   └── Application.js    # company/role/status enum/date/notes + STATUSES export
│   ├── middleware/auth.js    # verifies "Authorization: Bearer <jwt>", sets req.user.id
│   ├── routes/
│   │   ├── auth.js           # register / login / me
│   │   └── applications.js   # CRUD + /stats (declared before /:id)
│   └── scripts/smoke-test.js # end-to-end test on mongodb-memory-server
└── client/
    ├── package.json
    ├── vite.config.js        # React plugin + /api dev proxy to :5000
    ├── index.html
    └── src/
        ├── main.jsx          # BrowserRouter + AuthProvider wiring
        ├── App.jsx           # routes (dashboard is behind ProtectedRoute)
        ├── index.css
        ├── constants.js      # STATUSES + colours (mirror of the server enum)
        ├── api/axios.js      # shared Axios instance: token request interceptor, 401 response interceptor
        ├── context/AuthContext.jsx  # user/token state, login/register/logout, localStorage persistence
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── StatsCards.jsx
        │   ├── ApplicationForm.jsx  # shared add/edit form
        │   └── PipelineBoard.jsx    # status columns, groups the flat list client-side
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Dashboard.jsx  # loads list + stats in parallel, optimistic status moves
```

## Resume bullets (use only after you have run it yourself)

- Built ApplyTrack, a MERN job-application tracker (React, Node.js/Express, MongoDB): JWT authentication with bcrypt-hashed passwords, protected REST APIs, and full CRUD over a five-stage hiring-pipeline data model.
- Implemented a MongoDB aggregation-powered stats endpoint and a React dashboard with per-stage counts and optimistic UI updates, using Axios interceptors to attach JWTs and handle expired sessions.

## Interview questions about this project

**1. How does your JWT middleware work, and where do you check the token?**
Every protected route runs the `auth` middleware in `server/middleware/auth.js` before the handler. It reads the `Authorization` header, requires the `Bearer <token>` format, and calls `jwt.verify()` with the server's `JWT_SECRET`. If verification succeeds it stores the payload's user id on `req.user` and calls `next()`; anything missing, malformed or expired gets a 401 immediately. Route handlers then scope every query to `req.user.id`, which is what stops one user from reading another's applications.

**2. How did you design the Mongoose schemas?**
Two models. `User` has a unique, lower-cased, regex-validated email and a password field with `select: false`, so hashes never come back in query results unless explicitly requested at login; a `pre('save')` hook bcrypt-hashes the password only when it changed, and `toJSON` strips it from responses. `Application` references the owner with an ObjectId `ref: 'User'`, constrains `status` to an enum of the five pipeline stages, defaults `appliedOn` to now, and adds a compound index on `{ user, appliedOn: -1 }` because the dashboard always lists one user's applications newest-first.

**3. How does the React frontend keep the pipeline board in sync with the backend?**
The dashboard fetches the flat application list and the stats in parallel with `Promise.all`. The board component groups the flat list by status client-side — one column per stage — so a single source of truth (`applications` state in `Dashboard`) drives every column. Moving a card does an optimistic update: the state changes instantly, then the `PUT` fires; if the API rejects it, the previous state is restored and an error shows. Stats are refetched after a successful move so the cards never drift from the board.

**4. How did you handle CORS?**
On the API, the `cors` package is configured with an explicit `origin` (the client origin from an env variable, `http://localhost:5173` in dev) instead of a wildcard, with credentials enabled. In local development there's a second layer of protection: the browser never calls the API cross-origin at all, because Vite's dev server proxies `/api` to port 5000. For a production build the client uses `VITE_API_URL` and the API's `CLIENT_ORIGIN` is set to the deployed frontend origin.

**5. How are routes protected on the client vs. the server — and which one actually matters for security?**
On the client, a `ProtectedRoute` component checks the auth context and redirects to `/login` (remembering the intended page) when there's no token; tokens live in `localStorage`, are attached by an Axios request interceptor, and a response interceptor clears them and redirects on a 401. But that's only UX — the real security boundary is the server: every application route sits behind the JWT middleware and every query is filtered by the token's user id, so a hand-crafted request without a valid token gets a 401 regardless of what the UI shows.
