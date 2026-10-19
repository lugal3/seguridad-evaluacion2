const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/huellitas",
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL", err);
});

module.exports = { pool };
