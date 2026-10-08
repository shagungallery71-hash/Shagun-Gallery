import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Debug: Log the database URL (sanitized)
const dbUrl = process.env.DATABASE_URL;
console.log('📊 Database URL check:', dbUrl ? `${dbUrl.substring(0, 30)}...` : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => console.log("✅ Database connected successfully"));
pool.on("error", (err) => console.error("❌ Unexpected DB error", err));

export default pool;
