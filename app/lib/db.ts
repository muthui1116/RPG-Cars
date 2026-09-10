import pg from "pg";

// Create a connection pool (a group of reusable database connections)
const db = new pg.Pool({
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
  // port: Number(process.env.DB_PORT) || 5432,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Log any unexpected errors instead of crashing the app
db.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

export default db;
