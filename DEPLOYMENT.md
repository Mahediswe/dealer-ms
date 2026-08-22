# Deploying Dealer OS

This project has two parts that deploy separately:

- **Frontend** (`/frontend`) — static React build → **Cloudflare Pages**
- **Backend** (`/backend`) — Node/Express API → **Railway**, **Render**, or **Fly.io**
  (Cloudflare Pages only serves static files / edge Workers, it cannot run a
  plain Express server, so the API needs a normal Node host)
- **Database** — Supabase (already covered in the main README)

## 1. Push this project to GitHub

The project is already a git repo with one commit. From the project root:

```bash
# Create a new empty repo on GitHub first (github.com/new), then:
git remote add origin https://github.com/<your-username>/dealer-os.git
git branch -M main
git push -u origin main
```

If you use SSH instead of HTTPS, use `git@github.com:<your-username>/dealer-os.git`.

## 2. Deploy the backend first (Railway — easiest)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
   → pick your `dealer-os` repo.
2. When it asks for the root directory, set it to **`backend`**.
3. Railway auto-detects Node. Set these environment variables in the Railway
   dashboard (same values as your local `backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = your Cloudflare Pages URL (add this **after** step 3, e.g.
     `https://dealer-os.pages.dev`)
   - `NODE_ENV` = `production`
4. Railway gives you a public URL like `https://dealer-os-backend.up.railway.app`.
   Keep this — the frontend needs it.

(Render.com works the same way: New → Web Service → connect repo → root
directory `backend` → build command `npm install` → start command `npm start`.)

## 3. Deploy the frontend to Cloudflare Pages

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers &
   Pages** → **Create** → **Pages** → **Connect to Git** → pick your `dealer-os`
   repo.
2. Set the build configuration:
   - **Framework preset:** Vite
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Add an environment variable:
   - `VITE_API_URL` = `https://dealer-os-backend.up.railway.app/api`
     (your Railway URL from step 2, with `/api` at the end)
4. Click **Save and Deploy**. Cloudflare gives you a URL like
   `https://dealer-os.pages.dev`.
5. Go back to Railway and set `CLIENT_URL` to that exact Pages URL (so CORS
   allows it), then redeploy the backend.

## 4. First login

Open your `*.pages.dev` URL, click **Create an account**, and set up your
company. From there everything works exactly like it did locally.

## Custom domain (optional)

In Cloudflare Pages → your project → **Custom domains**, add your domain (it
must already be on Cloudflare DNS). Do the same for the backend on Railway/
Render under their custom domain settings if you want `api.yourdomain.com`
instead of the default subdomain.

## Notes

- Every `git push` to `main` auto-redeploys both Cloudflare Pages and Railway/
  Render — no manual redeploy needed after the first setup.
- Don't commit `.env` files — they're already git-ignored. Set secrets only in
  the Railway/Cloudflare dashboards.
- If you'd rather run the backend on Cloudflare too, it needs to be rewritten
  against the Workers runtime (e.g. with Hono instead of Express, and
  Supabase's edge-compatible client) — that's a real rewrite, not a config
  change, so Railway/Render is the fast path.
