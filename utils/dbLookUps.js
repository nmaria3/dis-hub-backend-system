const db = require("../config/db");

// =========================
// 📥 GET ALL LOOKUPS
// =========================
const getAllLookups = async () => {
  try {
    const [campuses] = await db.query("SELECT * FROM campuses");
    const [faculties] = await db.query("SELECT * FROM faculties");
    const [courses] = await db.query("SELECT * FROM courses");

    return { campuses, faculties, courses };

  } catch (err) {
    console.error("❌ Lookup fetch error:", err);
    throw err;
  }
};

module.exports = { getAllLookups };