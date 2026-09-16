import pg from "pg";

const db = new pg.Pool({
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
  // port: Number(process.env.DB_PORT) || 5432,
  connectionString: process.env.DATABASE_URL,
});

db.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

export default db;
