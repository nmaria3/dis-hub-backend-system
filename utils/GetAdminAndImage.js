const db = require("../config/db");

const getAdminAndRandomImage = async () => {
  try {
    // =========================
    // 1. GET ADMIN
    // =========================
    const [adminRows] = await db.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminRows.length === 0) {
      console.log("❌ No admin found");
      return;
    }

    const adminId = adminRows[0].id;

    // =========================
    // 2. GET RANDOM IMAGE
    // =========================
    const [imageRows] = await db.query(
      "SELECT image_url FROM images ORDER BY RAND() LIMIT 1"
    );

    if (imageRows.length === 0) {
      console.log("❌ No images found");
      return;
    }

    const imageUrl = imageRows[0].image_url;

    // =========================
    // 3. DISPLAY
    // =========================
    // console.log("\n👤 ADMIN ID:", adminId);
    // console.log("🖼️ RANDOM IMAGE:", imageUrl);

    return {
      adminId,
      imageUrl,
    };

  } catch (error) {
    console.error("❌ Error fetching admin/image:", error);
  }
};

module.exports = { getAdminAndRandomImage };