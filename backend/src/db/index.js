const { Pool } = require('pg');

// Load dotenv only if DATABASE_URL is not already set
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

const dbUrl = process.env.DATABASE_URL?.trim();

const pool = dbUrl
  ? new Pool({ 
      connectionString: dbUrl, 
      ssl: { rejectUnauthorized: false } 
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: String(process.env.DB_PASSWORD),
      port: Number(process.env.DB_PORT),
    });

module.exports = pool;