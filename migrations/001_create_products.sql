create table if not exists products (
  id uuid primary key,
  brand varchar(120),
  name varchar(160) not null,
  category varchar(120) not null,
  department varchar(120) not null,
  sell_without_stock varchar(3) not null check (sell_without_stock in ('YES', 'NO')),
  created_at timestamptz not null default now()
);

create unique index if not exists products_name_unique_idx on products (lower(name));
create index if not exists products_category_idx on products (category);
create index if not exists products_department_idx on products (department);
