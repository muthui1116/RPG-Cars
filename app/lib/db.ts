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
    max: 10,                        // max clients in the pool at once
    idleTimeoutMillis: 10000,       // close idle clients after 10s
                                     // (shorter than Neon's own idle cutoff,
                                     // so pg closes them gracefully first
                                     // instead of Neon killing them abruptly)
    connectionTimeoutMillis: 10000, // fail fast if a new connection can't
                                     // be established within 10s, instead
                                     // of hanging
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


