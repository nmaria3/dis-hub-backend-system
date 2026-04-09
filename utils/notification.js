const db = require("../config/db");

const createNotification = async (category, payload) => {
  try {
    let title = "";
    let message = "";
    let type = "";

    // =========================
    // 🎯 CATEGORY LOGIC
    // =========================
    switch (category) {

      case "dissertation":
        type = payload.action; // created | updated

        title = "Dissertation " + payload.action;

        message = `A dissertation titled "${payload.title}" was ${payload.action} by ${payload.author}`;

        break;

      case "user":
        type = payload.action; // registered | deleted

        title = "User " + payload.action;

        message = `User ${payload.full_name} has ${payload.action}`;

        break;

      case "system":
        type = payload.action;

        title = "System Alert";

        message = payload.message;

        break;

      default:
        title = "Notification";
        message = "New activity detected";
    }

    // =========================
    // 💾 SAVE TO DB
    // =========================
    await db.query(
      `INSERT INTO notifications (category, type, title, message, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [category, type, title, message, JSON.stringify(payload)]
    );

    console.log("🔔 Notification created");

  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = { createNotification };