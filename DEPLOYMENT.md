# Deploying Dealer OS (Vercel — frontend + backend)

Both the frontend and backend deploy to Vercel as **two separate projects**
from the same GitHub repo (one pointed at `/frontend`, one at `/backend`).
Database stays on Supabase (already set up).

> **Trade-off to know:** Vercel runs the backend as serverless functions —
> each request spins up independently rather than one process staying alive
> all the time. Everything works normally (dealers, sales, inventory,
> payments, reports, etc.) **except real-time notifications** (the live bell
> icon updates) — those need a persistent Socket.IO connection, which
> serverless doesn't support. The rest of the app is unaffected; new
> notifications still get created, you just won't see them pop up live
> without a page refresh.

## 1. Push to GitHub

If you haven't already:

```bash
cd dms
git remote add origin https://github.com/<your-username>/dealer-os.git
git branch -M main
git push -u origin main
```

## 2. Deploy the backend on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New...** → **Project** → import your `dealer-os` repo.
3. On the configuration screen:
   - **Root Directory** → click **Edit** → select `backend`
   - **Framework Preset** → leave as **Other** (it's a plain Node/Express app,
     not a framework Vercel needs to special-case)
4. Expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role (or `secret`) key |
   | `JWT_SECRET` | any long random string you make up |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `*` for now — you'll set this properly in step 4 |

5. Click **Deploy**. Wait for it to finish, then copy the URL Vercel gives
   you, e.g. `https://dealer-os-backend.vercel.app`.
6. Test it: open `https://dealer-os-backend.vercel.app/api/health` in your
   browser. You should see `{"status":"ok",...}`.

## 3. Deploy the frontend on Vercel

1. Back on the Vercel dashboard: **Add New...** → **Project** → import the
   **same** `dealer-os` repo again (Vercel lets you import a repo more than
   once, as separate projects).
2. On the configuration screen:
   - **Root Directory** → **Edit** → select `frontend`
   - **Framework Preset** → should auto-detect as **Vite**
3. Expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | your backend URL + `/api`, e.g. `https://dealer-os-backend.vercel.app/api` |

4. Click **Deploy**. When it finishes you'll get a URL like
   `https://dealer-os.vercel.app` — that's your live app.

## 4. Connect the two (CORS)

1. Go back to the **backend** project on Vercel → **Settings** →
   **Environment Variables**.
2. Edit `CLIENT_URL`, replace `*` with your actual frontend URL, e.g.
   `https://dealer-os.vercel.app`.
3. Go to **Deployments** tab → click the **⋮** on the latest deployment →
   **Redeploy** (env var changes need a redeploy to take effect).

## 5. First login

Open your frontend URL (`https://dealer-os.vercel.app`), click **Create an
account**, fill in your company name and your details. That becomes your
first `super_admin` login.

## Updating later

Every `git push` to `main` auto-redeploys **both** Vercel projects — nothing
manual needed after this first setup.

## If you want real-time notifications too

That needs a host that keeps a process alive (Railway, Render, Fly.io, or a
VPS) instead of serverless. The same `backend` folder works as-is on any of
those — just point them at `src/server.js` (via `npm start`) instead of the
`api/` folder Vercel uses. You'd then only need to swap which service the
frontend's `VITE_API_URL` points to.
