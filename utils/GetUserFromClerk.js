// utils/getUserFromClerk.js
const db = require("../config/db")

const getUserFromClerk = async (clerkId) => {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE clerkid = ?",
    [clerkId]
  );

  return rows[0]; // undefined if not found
};

module.exports = { getUserFromClerk };