create table if not exists operators (
  id uuid primary key,
  name text not null,
  code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists operators_lower_name_uidx on operators (lower(name));

create table if not exists cash_day_sessions (
  id uuid primary key,
  business_date date not null unique,
  status text not null check (status in ('OPEN', 'CLOSED')),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint cash_day_sessions_closed_has_closed_at check (status <> 'CLOSED' or closed_at is not null)
);

create table if not exists cash_operator_sessions (
  id uuid primary key,
  cash_day_session_id uuid not null references cash_day_sessions(id),
  operator_id uuid not null references operators(id),
  opening_balance numeric(14, 2) not null default 0 check (opening_balance >= 0),
  status text not null check (status in ('OPEN', 'CLOSED')),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  expected_cash_balance numeric(14, 2),
  counted_cash_balance numeric(14, 2),
  cash_difference numeric(14, 2),
  constraint cash_operator_unique_per_day unique (cash_day_session_id, operator_id),
  constraint cash_operator_closed_has_values check (
    status <> 'CLOSED'
    or (
      closed_at is not null
      and counted_cash_balance is not null
      and expected_cash_balance is not null
      and cash_difference is not null
    )
  )
);

create index if not exists cash_operator_sessions_day_idx on cash_operator_sessions (cash_day_session_id);
create index if not exists cash_operator_sessions_operator_idx on cash_operator_sessions (operator_id);

create table if not exists cash_movements (
  id uuid primary key,
  cash_operator_session_id uuid not null references cash_operator_sessions(id),
  kind text not null check (
    kind in (
      'PAYMENT_RECEIVED',
      'CHANGE_DELIVERED',
      'CASH_SUPPLY',
      'CASH_WITHDRAWAL',
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

create index if not exists cash_movements_operator_session_idx on cash_movements (cash_operator_session_id);
create index if not exists cash_movements_occurred_at_idx on cash_movements (occurred_at);
