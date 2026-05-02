import type { Pool } from "pg";

/** UUIDs fixos para localizar dados apos o seed (Swagger / testes manuais). */
export const DEV_SEED_IDS = {
  operators: {
    maria: "a0000001-0000-4000-8000-000000000001",
    joao: "a0000002-0000-4000-8000-000000000002",
    carlos: "a0000003-0000-4000-8000-000000000003",
  },
  products: {
    cafe: "b0000001-0000-4000-8000-000000000001",
    pao: "b0000002-0000-4000-8000-000000000002",
    suco: "b0000003-0000-4000-8000-000000000003",
  },
  diningTables: {
    mesa01: "e0000001-0000-4000-8000-000000000001",
    mesa02: "e0000002-0000-4000-8000-000000000002",
  },
  cashDay: {
    yesterday: "c0000001-0000-4000-8000-000000000001",
    today: "c0000002-0000-4000-8000-000000000002",
  },
  operatorSessions: {
    carlosYesterday: "d0000001-0000-4000-8000-000000000001",
    mariaToday: "d0000002-0000-4000-8000-000000000002",
    joaoToday: "d0000003-0000-4000-8000-000000000003",
  },
  cashOrders: {
    mariaClosed: "f0000001-0000-4000-8000-000000000001",
    mariaOpen: "f0000002-0000-4000-8000-000000000002",
  },
} as const;

function localBusinessDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localBusinessDate(d);
}

/**
 * Apaga dados operacionais (nao toca em schema_migrations) e reinsere cenario de demonstracao.
 * Destrutivo: use somente em desenvolvimento com `npm run dev:usedata`.
 */
export async function runDevSeed(pool: Pool): Promise<void> {
  const today = localBusinessDate(new Date());
  const yesterday = yesterdayDateString();
  const {
    operators: op,
    products: pr,
    diningTables: dt,
    cashDay: cd,
    operatorSessions: os,
    cashOrders: co,
  } = DEV_SEED_IDS;

  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query(`
      truncate table
        cash_orders,
        cash_principal_movements,
        cash_movements,
        cash_operator_sessions,
        cash_day_sessions,
        dining_tables,
        stock_entries,
        products,
        operators
      restart identity cascade
    `);

    await client.query(
      `insert into operators (id, name, code, active) values
        ($1::uuid, 'Maria Silva', 'MS01', true),
        ($2::uuid, 'Joao Santos', 'JS02', true),
        ($3::uuid, 'Carlos Expediente', 'CE03', true)`,
      [op.maria, op.joao, op.carlos],
    );

    await client.query(
      `insert into products (id, brand, name, category, department, sell_without_stock) values
        ($1::uuid, 'Casa', 'Cafe Americano', 'Bebidas quentes', 'Cozinha', 'NO'),
        ($2::uuid, 'Casa', 'Pao de Queijo', 'Lanches', 'Cozinha', 'NO'),
        ($3::uuid, 'Natural', 'Suco Laranja 300ml', 'Bebidas', 'Bar', 'YES')`,
      [pr.cafe, pr.pao, pr.suco],
    );

    await client.query(
      `insert into stock_entries (id, product_id, quantity, manufacturing_date, expiration_date, unit_value, cost) values
        ($1::uuid, $2::uuid, 50, '2026-01-01', '2026-12-31', 3.5, 2.8),
        ($3::uuid, $4::uuid, 120, '2026-01-01', '2026-06-30', 2.0, 1.2),
        ($5::uuid, $6::uuid, 80, null, null, 4.0, 2.5)`,
      [
        "b1000001-0000-4000-8000-000000000001",
        pr.cafe,
        "b1000002-0000-4000-8000-000000000002",
        pr.pao,
        "b1000003-0000-4000-8000-000000000003",
        pr.suco,
      ],
    );

    await client.query(
      `insert into dining_tables (id, name, active, sort_order) values
        ($1::uuid, 'Mesa 01', true, 1),
        ($2::uuid, 'Mesa 02', true, 2)`,
      [dt.mesa01, dt.mesa02],
    );

    await client.query(
      `insert into cash_day_sessions (
        id, business_date, status, notes, opened_at, closed_at,
        principal_opening_balance,
        principal_expected_cash_balance, principal_counted_cash_balance, principal_cash_difference, principal_close_notes
      ) values (
        $1::uuid, $2::date, 'CLOSED', 'SEED: dia encerrado (ontem)', now() - interval '2 day', now() - interval '1 day',
        100.00,
        220.00, 220.00, 0.00, 'SEED conferencia principal'
      )`,
      [cd.yesterday, yesterday],
    );

    await client.query(
      `insert into cash_operator_sessions (
        id, cash_day_session_id, operator_id, opening_balance, status, notes,
        opened_at, closed_at,
        expected_cash_balance, counted_cash_balance, cash_difference
      ) values (
        $1::uuid, $2::uuid, $3::uuid, 0, 'CLOSED', 'SEED Carlos (ontem)',
        now() - interval '2 day', now() - interval '1 day',
        120.00, 120.00, 0.00
      )`,
      [os.carlosYesterday, cd.yesterday, op.carlos],
    );

    await client.query(
      `insert into cash_movements (
        id, cash_operator_session_id, kind, amount, cash_effect, description, occurred_at
      ) values (
        $1::uuid, $2::uuid, 'PAYMENT_RECEIVED', 120.00, 'IN', 'SEED vendas', now() - interval '2 day'
      )`,
      ["a1000001-0000-4000-8000-000000000001", os.carlosYesterday],
    );

    await client.query(
      `insert into cash_principal_movements (
        id, cash_day_session_id, cash_operator_session_id, kind, amount, cash_effect, description,
        reference_type, reference_id, occurred_at
      ) values (
        $1::uuid, $2::uuid, $3::uuid, 'OPERATOR_CLOSE_CONTRIBUTION', 120.00, 'IN', 'SEED incorporacao operador',
        'CASH_OPERATOR_SESSION', $3::uuid, now() - interval '1 day'
      )`,
      ["a1000002-0000-4000-8000-000000000001", cd.yesterday, os.carlosYesterday],
    );

    await client.query(
      `insert into cash_day_sessions (
        id, business_date, status, notes, opened_at, closed_at, principal_opening_balance
      ) values (
        $1::uuid, $2::date, 'OPEN', 'SEED: dia atual em operacao', now() - interval '4 hour', null, 300.00
      )`,
      [cd.today, today],
    );

    await client.query(
      `insert into cash_operator_sessions (
        id, cash_day_session_id, operator_id, opening_balance, status, notes, opened_at, closed_at,
        expected_cash_balance, counted_cash_balance, cash_difference
      ) values
        ($1::uuid, $2::uuid, $3::uuid, 40.00, 'OPEN', 'SEED Maria (caixa aberto)', now() - interval '3 hour', null,
          null, null, null),
        ($4::uuid, $5::uuid, $6::uuid, 20.00, 'CLOSED', 'SEED Joao (ja conferido)', now() - interval '3 hour', now() - interval '2 hour',
          50.00, 50.00, 0.00)`,
      [os.mariaToday, cd.today, op.maria, os.joaoToday, cd.today, op.joao],
    );

    await client.query(
      `insert into cash_movements (
        id, cash_operator_session_id, kind, amount, cash_effect, description, occurred_at
      ) values
        ($1::uuid, $2::uuid, 'PAYMENT_RECEIVED', 80.00, 'IN', 'SEED Maria vendas', now() - interval '2 hour'),
        ($3::uuid, $4::uuid, 'PAYMENT_RECEIVED', 30.00, 'IN', 'SEED Joao vendas', now() - interval '2 hour')`,
      [
        "a1000003-0000-4000-8000-000000000001",
        os.mariaToday,
        "a1000004-0000-4000-8000-000000000001",
        os.joaoToday,
      ],
    );

    await client.query(
      `insert into cash_principal_movements (
        id, cash_day_session_id, cash_operator_session_id, kind, amount, cash_effect, description,
        reference_type, reference_id, occurred_at
      ) values (
        $1::uuid, $2::uuid, $3::uuid, 'OPERATOR_CLOSE_CONTRIBUTION', 50.00, 'IN', 'SEED incorporacao Joao',
        'CASH_OPERATOR_SESSION', $3::uuid, now() - interval '2 hour'
      )`,
      ["a1000005-0000-4000-8000-000000000001", cd.today, os.joaoToday],
    );

    await client.query(
      `insert into cash_principal_movements (
        id, cash_day_session_id, cash_operator_session_id, kind, amount, cash_effect, description, occurred_at
      ) values (
        $1::uuid, $2::uuid, null, 'PRINCIPAL_SUPPLY', 25.00, 'IN', 'SEED suprimento troco', now() - interval '1 hour'
      )`,
      ["a1000006-0000-4000-8000-000000000001", cd.today],
    );

    await client.query(
      `insert into cash_orders (
        id, cash_day_session_id, cash_operator_session_id, dining_table_id, status, notes, opened_at, closed_at
      ) values
        ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'CLOSED', 'SEED pedido encerrado', now() - interval '2 hour', now() - interval '1 hour'),
        ($5::uuid, $6::uuid, $7::uuid, $8::uuid, 'OPEN', 'SEED pedido em andamento', now() - interval '30 minute', null)`,
      [
        co.mariaClosed,
        cd.today,
        os.mariaToday,
        dt.mesa01,
        co.mariaOpen,
        cd.today,
        os.mariaToday,
        dt.mesa02,
      ],
    );

    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }

  console.info(
    [
      "[USE_DEV_SEED] Base repovoada com dados de demonstracao.",
      `  Data negocio hoje: ${today} | caixa: ${cd.today}`,
      `  Ontem (encerrado): ${yesterday} | caixa: ${cd.yesterday}`,
      `  Operadores: Maria=${op.maria} | Joao=${op.joao} | Carlos=${op.carlos}`,
      `  Sessao Maria (aberta): ${os.mariaToday} | Joao (fechada): ${os.joaoToday}`,
      `  Pedidos Maria: fechado=${co.mariaClosed} | aberto=${co.mariaOpen}`,
      "  Fluxo sugerido: PATCH fechar pedido aberto -> PATCH fechar sessao Maria -> GET overview (principal) -> PATCH fechar dia.",
    ].join("\n"),
  );
}
