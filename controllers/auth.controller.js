// controllers/auth.controller.js
const db = require("../config/db");

const signUp = async (req, res) => {
  try {
    console.log("SIGN-UP HIT");
    console.log("BODY:", req.body);

    const { clerkId, email } = req.body;

    let role;
    if (email === "maria.admin.umu@gmail.com") {
      role = "admin";
    } else if (email.endsWith("@stud.umu.ac.ug")) {
      role = "student";
    } else {
      return res.status(403).json({ message: "Unauthorized email" });
    }

    const [results] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    // =========================
    // USER EXISTS
    // =========================
    if (results.length > 0) {
      const user = results[0];

      // ✅ CHECK IF PROFILE IS COMPLETE
      const isProfileComplete = Boolean(user.registration_number) && Boolean(user.phone_number) && Boolean(user.campus_id) && Boolean(user.course_id)

      // 🔥 ADMIN
      if (role === "admin") {
        return res.status(200).json({
          message: "Admin already registered",
          redirect: "/admin/dashboard",
        });
      }

      console.log("Is Profile Complete?", isProfileComplete);
      // 🔥 STUDENT
      if (role === "student") {
        if (isProfileComplete) {
          return res.status(200).json({
            message: "Profile complete",
            redirect: "/students/dashboard",
          });
        } else {
          return res.status(200).json({
            message: "Complete your profile",
            redirect: "/complete-profile",
          });
        }
      }
    }

    // =========================
    // NEW USER
    // =========================
    const [insertResult] = await db.query(
      "INSERT INTO users (clerkid, role) VALUES (?, ?)",
      [clerkId, role]
    );

    return res.status(201).json({
      message: "Signup successful. Please complete your profile",
      role,
      redirect:
        role === "admin"
          ? "/admin/dashboard"
          : "/complete-profile",
    });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const signIn = async (req, res) => {
  try {
    console.log("SIGN-IN HIT");
    console.log("BODY:", req.body);

    const { clerkId, email } = req.body;

    // 🔴 Validate input
    if (!clerkId || !email) {
      return res.status(400).json({
        message: "Clerk ID and email are required",
      });
    }

    // 🔐 Detect role
    let role;

    if (email === "maria.admin.umu@gmail.com") {
      role = "admin";
    } else if (email.endsWith("@stud.umu.ac.ug")) {
      role = "student";
    } else {
      return res.status(403).json({
        message: "Unauthorized email",
      });
    }

    // ======================
    // 🟣 ADMIN FLOW
    // ======================
    if (role === "admin") {
      return res.status(200).json({
        message: "Admin login successful",
        role,
        redirect: "/admin/dashboard",
      });
    }

    // ======================
    // 🟡 STUDENT FLOW
    // ======================

    // 🔍 Check if user exists
    const [users] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found. Please sign up first.",
        redirect: "/auth/sign-up",
      });
    }

    const user = users[0];

    // ✅ Check if profile is complete
    const isProfileComplete =
      user.registration_number &&
      user.campus_id &&
      user.course_id &&
      user.phone_number;

    // 🧠 If profile NOT complete
    if (!isProfileComplete) {
      return res.status(200).json({
        message: "Please complete your profile",
        role,
        profileCompleted: false,
        redirect: "/complete-profile",
      });
    }

    // 🟢 If profile is complete
    return res.status(200).json({
      message: "Login successful",
      role,
      profileCompleted: true,
      redirect: "/students/dashboard",
    });

  } catch (error) {
    console.error("❌ SIGN-IN ERROR:", error);
    return res.status(500).json({
      message: "Server error during sign-in",
    });
  }
};

// controllers/auth.controller.js
const checkProfile = async (req, res) => {
  try {
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ message: "clerkId is required" });
    }

    const [results] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        message: "User not found",
        redirect: "/sign-up",
      });
    }

    const user = results[0];

    // ✅ CHECK NULL FIELDS
    const isProfileComplete =
      user.registration_number != null &&
      user.phone_number != null &&
      user.campus_id != null &&
      user.course_id != null;

    if (!isProfileComplete) {
      return res.status(200).json({
        message: "Profile incomplete",
        complete: false,
        redirect: "/complete-profile",
      });
    }

    return res.status(200).json({
      message: "Profile complete",
      complete: true,
      redirect: "/student/dashboard",
    });

  } catch (error) {
    console.error("CHECK PROFILE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { signUp, signIn,  checkProfile  };