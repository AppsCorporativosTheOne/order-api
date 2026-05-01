create table if not exists stock_entries (
  id uuid primary key,
  product_id uuid not null references products(id),
  quantity numeric(12, 3) not null check (quantity > 0),
  manufacturing_date date,
  expiration_date date,
  unit_value numeric(12, 2) not null check (unit_value >= 0),
  cost numeric(12, 2) not null check (cost >= 0),
  final_value numeric(12, 2) generated always as (round(quantity * unit_value, 2)) stored,
  created_at timestamptz not null default now(),
  check (
    manufacturing_date is null
    or expiration_date is null
    or expiration_date >= manufacturing_date
  )
);

create index if not exists stock_entries_product_id_idx on stock_entries (product_id);
create index if not exists stock_entries_expiration_date_idx on stock_entries (expiration_date);
