const db = require("../config/db");

const getImages = async (req, res) => {
  try {
    // =========================
    // 🔐 GET USER FROM CLERK TOKEN
    // =========================
    // console.log("Request Auth:", req.auth()); Debug report

    // console.log("User ID:", req.auth().userId); Debug report

    const clerkId = req.auth().userId;

    // console.log("Clerk ID:", clerkId); Debug report

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // =========================
    // 🔍 CHECK USER IN DATABASE
    // =========================
    const [users] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (users.length === 0) {
      return res.status(403).json({
        message: "Intruder detected. User not found in database.",
      });
    }

    const user = users[0];

    // =========================
    // 🛡️ CHECK ADMIN ROLE
    // =========================
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    // =========================
    // 📸 FETCH IMAGES
    // =========================
    const [images] = await db.query(
      "SELECT id, image_url, created_at FROM images ORDER BY created_at DESC"
    );

    // =========================
    // ✅ RETURN RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });

  } catch (error) {
    console.error("❌ GET IMAGES ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { getImages };