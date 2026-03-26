const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.AIVEN_SERVICE_URI);

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
})();

module.exports = pool;