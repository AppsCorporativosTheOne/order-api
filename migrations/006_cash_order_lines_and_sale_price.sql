alter table products
  add column if not exists sale_price numeric(14, 2) check (sale_price is null or sale_price >= 0);

alter table cash_orders
  add column if not exists consumed_total numeric(14, 2) check (consumed_total is null or consumed_total >= 0);

create table if not exists cash_order_lines (
  id uuid primary key,
  cash_order_id uuid not null references cash_orders (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  line_total numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cash_order_lines_order_idx on cash_order_lines (cash_order_id);
create index if not exists cash_order_lines_product_idx on cash_order_lines (product_id);
