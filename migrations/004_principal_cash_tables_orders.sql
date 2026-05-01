alter table cash_day_sessions
  add column if not exists principal_opening_balance numeric(14, 2) not null default 0 check (principal_opening_balance >= 0);

alter table cash_day_sessions
  add column if not exists principal_expected_cash_balance numeric(14, 2);

alter table cash_day_sessions
  add column if not exists principal_counted_cash_balance numeric(14, 2);

alter table cash_day_sessions
  add column if not exists principal_cash_difference numeric(14, 2);

alter table cash_day_sessions
  add column if not exists principal_close_notes text;

update cash_day_sessions
set
  principal_expected_cash_balance = coalesce(principal_expected_cash_balance, 0),
  principal_counted_cash_balance = coalesce(principal_counted_cash_balance, 0),
  principal_cash_difference = coalesce(principal_cash_difference, 0)
where
  status = 'CLOSED';

alter table cash_day_sessions drop constraint if exists cash_day_sessions_principal_close_has_values;

alter table cash_day_sessions
  add constraint cash_day_sessions_principal_close_has_values check (
    status <> 'CLOSED'
    or (
      principal_expected_cash_balance is not null
      and principal_counted_cash_balance is not null
      and principal_cash_difference is not null
    )
  );

create table if not exists cash_principal_movements (
  id uuid primary key,
  cash_day_session_id uuid not null references cash_day_sessions(id),
  cash_operator_session_id uuid references cash_operator_sessions(id),
  kind text not null check (
    kind in (
      'OPERATOR_CLOSE_CONTRIBUTION',
      'PRINCIPAL_SUPPLY',
      'PRINCIPAL_WITHDRAWAL',
      'OTHER_IN',
      'OTHER_OUT'
    )
  ),
  amount numeric(14, 2) not null check (amount > 0),
  cash_effect text not null check (cash_effect in ('IN', 'OUT')),
  description text,
  reference_type text,
  reference_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists cash_principal_movements_day_idx on cash_principal_movements (cash_day_session_id);

create unique index if not exists cash_principal_one_contribution_per_operator_uidx on cash_principal_movements (cash_operator_session_id)
where
  kind = 'OPERATOR_CLOSE_CONTRIBUTION';

create table if not exists dining_tables (
  id uuid primary key,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists dining_tables_lower_name_uidx on dining_tables (lower(name));

create table if not exists cash_orders (
  id uuid primary key,
  cash_day_session_id uuid not null references cash_day_sessions(id),
  cash_operator_session_id uuid not null references cash_operator_sessions(id),
  dining_table_id uuid references dining_tables(id),
  status text not null check (status in ('OPEN', 'CLOSED')),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint cash_orders_closed_has_closed_at check (
    status <> 'CLOSED'
    or closed_at is not null
  )
);

create index if not exists cash_orders_day_idx on cash_orders (cash_day_session_id);
create index if not exists cash_orders_operator_session_idx on cash_orders (cash_operator_session_id);
create index if not exists cash_orders_status_idx on cash_orders (status);
