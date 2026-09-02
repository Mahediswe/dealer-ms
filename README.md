# Dealer OS — Dealer Management System

A full-stack Dealer Management System built with the MERN pattern (Node/Express +
React) using **Supabase (PostgreSQL)** as the database instead of MongoDB, per the
provided SRS. Modern, high-class UI with Tailwind CSS, Framer Motion animation,
Recharts data visualization, and Lucide icons.

## What's included (V1 core modules)

- **Auth & RBAC** — JWT login/register, role-based permissions (super_admin, admin,
  manager, accountant, salesman, warehouse_staff, cashier)
- **Dealer Management** — CRUD, dealer 360° view (profile + sales + payments + ledger),
  credit limit enforcement, dealer codes
- **Product Catalogue** — categories, brands, units, batches/expiry, variants
- **Inventory** — multi-warehouse stock, stock in/out/transfer/adjustment with full
  movement history, low-stock detection
- **Sales** — invoice creation with live stock validation, automatic stock deduction,
  dealer ledger posting, credit-limit check, cancellation with stock/ledger reversal
- **Purchases** — purchase orders, stock receiving with automatic inventory increment
  and supplier ledger posting
- **Payments** — receive from dealers / pay suppliers, allocation against invoices,
  automatic balance + ledger updates
- **Accounts & Ledger** — cash/bank/MFS accounts, manual entries, transfers, full
  ledger trail per dealer/supplier/account
- **Dashboard** — live KPIs, sales trend chart, top products chart, recent activity
- **Reports** — sales report, inventory valuation, financial summary
- **Sales Team** — salesman list, performance/targets endpoint
- **Settings** — company profile, team/user management, warehouses, permissions
- **Sales & Purchase Returns** — return against any invoice/purchase with automatic
  restock and dealer/supplier ledger reversal
- **Invoice detail & print view** — clean printable invoice layout, launch returns
  directly from the invoice
- **Global search (⌘K)** — live search across dealers, products, and invoices from
  the top bar
- **Mobile-responsive shell** — collapsible desktop sidebar + slide-in mobile drawer,
  fully usable on phones
- **Pagination** — dealer list is paginated server-side (pattern reusable for any
  other list)
- **Loading skeletons** — dashboard and sales list show skeleton placeholders instead
  of blank/"Loading…" states
- **Dashboard growth indicator** — today's sales shown with day-over-day % change
- **Server-side pagination** — now on Dealers, Products, Sales, Purchases, and
  Payments lists
- **Filters** — supplier + status filter on Purchases, direction filter on
  Payments, status filter on Sales
- **Product photo upload** — Supabase Storage-backed image upload with preview,
  shown in the product list
- **Real-time notifications** — Socket.IO pushes a live toast + updates the bell
  badge instantly when stock drops low or a dealer payment is received, no refresh
  needed
- **Barcode / SKU scanning on New Sale** — scan or type a barcode and press Enter
  to add it to the invoice (works with any USB/Bluetooth barcode scanner, since
  those act as a keyboard)
- **Purchase Order approval workflow** — create a PO, an admin/manager approves or
  rejects it, and only approved POs can be received into stock
- **Dealer credit-limit alerts** — a live notification fires the moment a dealer
  crosses 80% of their credit limit on a new sale
- **Salesman visit tracking** — log a dealer visit (with device geolocation if
  permitted) and browse the visit history
- **Multi-branch settings** — add and list branches under Settings, on top of the
  auto-created Head Office
- **CSV export** — download the full Sales Report or Inventory Valuation report as
  a CSV file
- **Dashboard date-range picker** — switch the sales trend chart between 7/14/30/90
  days

> The uploaded SRS describes a large 20-module system. This build focuses on a
> production-quality, fully wired **V1 core** (the modules above). The database schema
> and permission system are structured so the remaining modules (loyalty, advanced
> AI/BI, POS hardware integration, subscription billing, DMS mobile app, etc.) can be
> layered on without rearchitecting anything.

## Tech stack

- **Backend:** Node.js, Express, Supabase JS client (service-role key), JWT auth,
  bcrypt, Socket.IO (ready for real-time notifications)
- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts,
  Lucide React, Axios, React Hot Toast, Zustand (available for future state needs)
- **Database:** Supabase / PostgreSQL (schema in `backend/supabase/schema.sql`)

## Updating an existing Supabase project

If you already ran `schema.sql` before this update, run this one-liner in the
Supabase SQL Editor to pick up the new Purchase Order approval column:

```sql
alter table purchase_orders add column if not exists rejection_reason text;
```

## Getting started

> **Deploying instead of running locally?** See [`DEPLOYMENT.md`](./DEPLOYMENT.md)
> for step-by-step GitHub + Vercel (frontend and backend) instructions.

### 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run the entire contents of
   `backend/supabase/schema.sql` to create all tables, enums, and indexes.
3. Go to **Project Settings → API** and copy your **Project URL** and
   **service_role key** (not the anon key — the backend needs the service role
   to bypass Row Level Security).

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: paste your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a random JWT_SECRET
npm install
npm run dev
```

The API starts on `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API runs on a different URL
npm install
npm run dev
```

The app starts on `http://localhost:5173`.

### 4. Enable product photo uploads (optional)

In your Supabase dashboard, go to **Storage → New bucket**, name it `dms-uploads`,
and mark it **Public**. That's it — the "Add photo" control on the Products page
will start working immediately.

### 5. First login

Open the app, click **Create an account**, and fill in your company name, your
name, email, and password. This creates your company, a Head Office branch, and
your user as `super_admin` — from there you can add team members, warehouses,
products, and dealers from the Settings and respective pages.

## Project structure

```
dms/
├── backend/
│   ├── src/
│   │   ├── config/        # Supabase client
│   │   ├── middleware/     # JWT auth, RBAC permission checks
│   │   ├── routes/         # One file per module (dealers, products, sales…)
│   │   ├── utils/          # Helpers, generic CRUD router factory
│   │   └── server.js       # Express app entry point
│   ├── supabase/
│   │   └── schema.sql      # Full Postgres schema — run this in Supabase SQL Editor
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/     # Sidebar, Topbar, AppLayout
    │   │   ├── ui/         # Card, Button, Badge, Modal, DataTable, Input, StatCard
    │   │   └── charts/     # Recharts wrappers
    │   ├── context/        # AuthContext
    │   ├── lib/             # Axios client, formatters
    │   ├── pages/           # One page per module
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js  # Custom navy/teal/gold design tokens
    └── package.json
```

## Design system

- **Colors:** deep navy sidebar/headings, teal accent for primary actions and
  charts, gold for highlight metrics, standard semantic red/amber/green for
  status.
- **Typography:** Sora for headings/display, Plus Jakarta Sans for body text.
- **Motion & micro-interactions:**
  - Animated count-up numbers on every stat card and the dealer balance
  - 3D tilt-on-hover stat cards with a soft ambient glow and shimmer sweep
  - Gradient-bordered modals with an animated glow ring and spring pop-in
  - Buttons with a light-sweep shine on hover and spring press feedback
  - Pulsing badges for low-stock/urgent states
  - Animated gradient-mesh backgrounds on the Login/Register screens
  - Custom chart tooltips, gradient fills, and glowing active dots on the
    dashboard charts
  - Shimmer-sweep loading skeletons instead of flat pulses
  - Spring-based sidebar active-item pill and floating glowing logo
  - Staggered row entrance and hover lift on every data table
- **Money handling:** all amounts are stored as integer minor units (paisa) in
  the database to avoid floating-point rounding errors, and converted for
  display with `lib/format.js`.

## Extending to the remaining SRS modules

The schema and route patterns (see `utils/crudRouter.js` for the generic
CRUD factory, and any of the `*.routes.js` files for a fuller example) are
built to extend cleanly. To add a new module:

1. Add the table(s) to `supabase/schema.sql` and run the migration in Supabase.
2. Add a `<module>.routes.js` in the backend, mount it in `server.js`.
3. Add the module key to the `permissions` table so RBAC can govern it.
4. Add a page + nav entry in the frontend, following the pattern in
   `pages/Dealers.jsx` or `pages/Inventory.jsx`.

## Notes on production hardening

- Multi-step operations (sale creation, purchase receiving) are written as
  sequential Supabase calls for clarity. For strict ACID guarantees under
  concurrent load, move these into a Postgres function called via
  `supabase.rpc(...)`.
- Row Level Security is enabled on core tables but no policies are defined,
  since the Express backend uses the service-role key (which bypasses RLS).
  If you ever expose Supabase directly to the frontend, add company-scoped
  RLS policies before doing so.
- File/image uploads (product photos, dealer documents) aren't wired yet —
  add Supabase Storage buckets and a small upload route when needed.
