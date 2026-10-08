import pool from './config/dbconfig.js';

async function checkCoupons() {
  try {
    const res = await pool.query('SELECT * FROM coupons');
    console.log("Coupons in DB:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCoupons();
