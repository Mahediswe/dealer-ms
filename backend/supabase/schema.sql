-- ============================================================
-- Dealer Management System (DMS) — Supabase / PostgreSQL Schema
-- Covers V1 core modules. Monetary values stored as INTEGER
-- minor units (paisa) to avoid floating point rounding errors.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- ENUM TYPES ----------
create type user_role as enum ('super_admin','admin','manager','accountant','salesman','warehouse_staff','cashier','dealer');
create type dealer_type as enum ('retailer','wholesaler','sub_dealer','distributor');
create type payment_method as enum ('cash','bank','bkash','nagad','card','other');
create type sale_status as enum ('quotation','order','invoiced','paid','partial','cancelled');
create type stock_move_type as enum ('in','out','transfer','adjustment','damaged','expired');
create type return_reason as enum ('damaged','wrong_product','expired','excess_quantity','customer_return','other');

-- ---------- COMPANY / BRANCH (multi-tenant ready) ----------
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  currency text default 'BDT',
  tax_percent numeric(5,2) default 0,
  fiscal_year_start date,
  created_at timestamptz default now()
);

create table branches (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  address text,
  is_head_office boolean default false,
  created_at timestamptz default now()
);

-- ---------- USERS / RBAC ----------
create table users (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id),
  name text not null,
  email text unique not null,
  phone text,
  password_hash text not null,
  role user_role not null default 'salesman',
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table permissions (
  id uuid primary key default uuid_generate_v4(),
  role user_role not null,
  module text not null,
  can_view boolean default false,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  can_approve boolean default false,
  can_export boolean default false,
  unique(role, module)
);

-- ---------- TERRITORY ----------
create table territories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  parent_id uuid references territories(id),
  level text check (level in ('division','district','area')) default 'area'
);

-- ---------- DEALERS / CUSTOMERS ----------
create table dealer_groups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null
);

create table dealers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id),
  dealer_code text unique not null,
  name text not null,
  business_name text,
  phone text not null,
  email text,
  address text,
  territory_id uuid references territories(id),
  dealer_type dealer_type default 'retailer',
  group_id uuid references dealer_groups(id),
  nid_or_trade_license text,
  credit_limit_minor bigint default 0,
  opening_balance_minor bigint default 0,
  current_balance_minor bigint default 0,
  payment_terms text,
  assigned_salesman uuid references users(id),
  status text default 'active',
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table dealer_documents (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  doc_type text,
  file_url text,
  uploaded_at timestamptz default now()
);

-- ---------- PRODUCTS / CATEGORIES / BRANDS / UNITS ----------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null
);

create table brands (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null
);

create table units (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  base_unit_id uuid references units(id),
  conversion_factor numeric(12,4) default 1
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  sku text unique not null,
  barcode text,
  name text not null,
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  unit_id uuid references units(id),
  purchase_price_minor bigint default 0,
  selling_price_minor bigint default 0,
  wholesale_price_minor bigint default 0,
  dealer_price_minor bigint default 0,
  tax_percent numeric(5,2) default 0,
  discount_percent numeric(5,2) default 0,
  min_stock numeric(12,2) default 0,
  max_stock numeric(12,2) default 0,
  has_variants boolean default false,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  variant_name text not null,
  sku text unique,
  extra_price_minor bigint default 0
);

create table product_batches (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  batch_no text,
  expiry_date date,
  quantity numeric(12,2) default 0
);

-- ---------- WAREHOUSES / STOCK ----------
create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id),
  name text not null,
  address text,
  responsible_staff uuid references users(id)
);

create table stock (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete cascade,
  quantity numeric(12,2) default 0,
  damaged_qty numeric(12,2) default 0,
  unique(product_id, warehouse_id)
);

create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  warehouse_id uuid references warehouses(id),
  target_warehouse_id uuid references warehouses(id),
  move_type stock_move_type not null,
  quantity numeric(12,2) not null,
  qty_before numeric(12,2),
  qty_after numeric(12,2),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ---------- SUPPLIERS / PURCHASES ----------
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  payment_terms text,
  current_balance_minor bigint default 0,
  created_at timestamptz default now()
);

create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  po_number text unique not null,
  supplier_id uuid references suppliers(id),
  warehouse_id uuid references warehouses(id),
  status text default 'pending',
  rejection_reason text,
  total_amount_minor bigint default 0,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,2) not null,
  unit_cost_minor bigint not null,
  received_qty numeric(12,2) default 0
);

create table purchases (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  purchase_no text unique not null,
  purchase_order_id uuid references purchase_orders(id),
  supplier_id uuid references suppliers(id),
  warehouse_id uuid references warehouses(id),
  subtotal_minor bigint default 0,
  tax_minor bigint default 0,
  total_minor bigint default 0,
  paid_minor bigint default 0,
  status text default 'unpaid',
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table purchase_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,2) not null,
  unit_cost_minor bigint not null,
  line_total_minor bigint not null
);

-- ---------- SALES ----------
create table sales (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id),
  invoice_no text unique not null,
  dealer_id uuid references dealers(id),
  warehouse_id uuid references warehouses(id),
  salesman_id uuid references users(id),
  sale_type text default 'credit',
  subtotal_minor bigint default 0,
  discount_minor bigint default 0,
  tax_minor bigint default 0,
  total_minor bigint default 0,
  paid_minor bigint default 0,
  status sale_status default 'invoiced',
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,2) not null,
  unit_price_minor bigint not null,
  discount_minor bigint default 0,
  tax_minor bigint default 0,
  line_total_minor bigint not null
);

create table sales_returns (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id),
  product_id uuid references products(id),
  quantity numeric(12,2) not null,
  reason return_reason default 'other',
  amount_minor bigint default 0,
  created_at timestamptz default now()
);

create table purchase_returns (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid references purchases(id),
  product_id uuid references products(id),
  quantity numeric(12,2) not null,
  reason return_reason default 'other',
  amount_minor bigint default 0,
  created_at timestamptz default now()
);

-- ---------- PAYMENTS / ACCOUNTS / LEDGER ----------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  receipt_no text unique not null,
  party_type text check (party_type in ('dealer','supplier')) not null,
  dealer_id uuid references dealers(id),
  supplier_id uuid references suppliers(id),
  direction text check (direction in ('in','out')) not null,
  amount_minor bigint not null,
  method payment_method default 'cash',
  reference text,
  note text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references payments(id) on delete cascade,
  sale_id uuid references sales(id),
  purchase_id uuid references purchases(id),
  amount_minor bigint not null
);

create table accounts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  account_type text check (account_type in ('cash','bank','mfs','income','expense')) not null,
  balance_minor bigint default 0
);

create table ledger_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  party_type text check (party_type in ('dealer','supplier','account')) not null,
  party_id uuid not null,
  entry_type text check (entry_type in ('debit','credit')) not null,
  amount_minor bigint not null,
  balance_after_minor bigint,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz default now()
);

-- ---------- SALESMAN / TARGETS ----------
create table targets (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  salesman_id uuid references users(id),
  period_start date,
  period_end date,
  target_amount_minor bigint default 0,
  achieved_amount_minor bigint default 0,
  commission_percent numeric(5,2) default 0
);

create table visit_logs (
  id uuid primary key default uuid_generate_v4(),
  salesman_id uuid references users(id),
  dealer_id uuid references dealers(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  checked_in_at timestamptz default now(),
  note text
);

-- ---------- NOTIFICATIONS ----------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references users(id),
  type text not null,
  title text not null,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ---------- AUDIT LOG ----------
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references users(id),
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ---------- INDEXES ----------
create index idx_dealers_company on dealers(company_id);
create index idx_products_company on products(company_id);
create index idx_sales_company on sales(company_id);
create index idx_sales_dealer on sales(dealer_id);
create index idx_stock_product on stock(product_id);
create index idx_ledger_party on ledger_entries(party_type, party_id);
create index idx_purchases_supplier on purchases(supplier_id);

-- ---------- ROW LEVEL SECURITY (enable; policies added by app layer / service role) ----------
alter table dealers enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table purchases enable row level security;
-- Service role (used by the Express backend) bypasses RLS by default in Supabase.
-- Add company_id-scoped policies here if you expose Supabase directly to clients.
