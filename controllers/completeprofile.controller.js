const db = require("../config/db");

const completeProfile = async (req, res) => {
  try {
    console.log("COMPLETE PROFILE HIT");
    console.log("BODY:", req.body);

    const {
      clerkId,
      registration_number,
      campus_id,
      course_id,
      phone_number,
    } = req.body;

    // 🔴 Validate input
    if (
      !clerkId ||
      !registration_number ||
      !campus_id ||
      !course_id ||
      !phone_number
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 🔍 Check user exists
    const [users] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = users[0];

    // 🚫 Admin should not be here
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admins do not complete profile",
      });
    }

    // ✅ Update user profile
    await db.query(
      `UPDATE users 
       SET registration_number = ?, campus_id = ?, course_id = ?, phone_number = ?
       WHERE clerkid = ?`,
      [
        registration_number,
        campus_id,
        course_id,
        phone_number,
        clerkId,
      ]
    );

    console.log("✅ Profile updated");

    return res.status(200).json({
      message: "Profile completed successfully",
      role: user.role,
      profileCompleted: true,
      redirect: "/students/dashboard",
    });

  } catch (error) {
    console.error("❌ COMPLETE PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Server error while completing profile",
    });
  }
};

module.exports = { completeProfile };