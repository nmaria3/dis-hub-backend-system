const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  uri: process.env.AIVEN_SERVICE_URL
});

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