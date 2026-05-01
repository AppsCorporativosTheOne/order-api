import type { Pool, PoolClient } from "pg";

export async function withTransaction<T>(
  pool: Pool,
  handler: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = await handler(client);
    await client.query("commit");

    return result;
  } catch (error) {
    await client.query("rollback");

    throw error;
  } finally {
    client.release();
  }
}
