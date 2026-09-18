// lib/db.ts
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: pg.Pool | undefined;
}

function createPool() {
  const pool = new pg.Pool({
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_NAME,
    // password: process.env.DB_PASSWORD,
    // port: Number(process.env.DB_PORT) || 5432,
    connectionString: process.env.DATABASE_URL,
  });

  pool.on("error", (err) => {
    console.error("Unexpected Postgres pool error:", err);
  });

  return pool;
}

const db = globalThis._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = db;
}

export default db;


