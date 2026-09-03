import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

const cols = await pool.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema='public' AND data_type IN ('text','character varying','jsonb','json')
`);
console.log(`Sweeping ${cols.rows.length} columns for '/uploads/image/product/' ...`);
let hits = [];
for (const c of cols.rows) {
  try {
    const r = await pool.query(
      `SELECT count(*) AS n FROM "${c.table_name}" WHERE "${c.column_name}"::text ILIKE '%/uploads/image/product/%'`
    );
    const n = parseInt(r.rows[0].n, 10);
    if (n > 0) hits.push({ table: c.table_name, col: c.column_name, n });
  } catch (e) {}
}
console.log('Hits:', JSON.stringify(hits, null, 2));
await pool.end();
