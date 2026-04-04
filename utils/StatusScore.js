const fs = require("fs");
const path = require("path");

// Path to status.json
const statusFilePath = path.join(__dirname, "../status.json");
console.log("📁 Status file path:", statusFilePath);

// =========================
// 📝 SET STATUS (WRITE FILE)
// =========================
const setStatus = (newStatus) => {
  try {
    // Read current status first
    let currentStatus = {};

    if (fs.existsSync(statusFilePath)) {
      const fileData = fs.readFileSync(statusFilePath, "utf-8");
      currentStatus = JSON.parse(fileData);
    }

    // Merge new status
    const updatedStatus = {
      ...currentStatus,
      ...newStatus,
    };

    // Write back to file
    fs.writeFileSync(
      statusFilePath,
      JSON.stringify(updatedStatus, null, 2)
    );

  } catch (error) {
    console.error("❌ Error writing status:", error);
  }
};

// =========================
// 📡 GET STATUS (READ FILE)
// =========================
const getStatus = () => {
  try {
    if (!fs.existsSync(statusFilePath)) {
      return {
        status: "idle",
        progress: 0,
        message: "No upload started",
      };
    }

    const data = fs.readFileSync(statusFilePath, "utf-8");
    return JSON.parse(data);

  } catch (error) {
    console.error("❌ Error reading status:", error);

    return {
      status: "error",
      progress: 0,
      message: "Failed to read status",
    };
  }
};

module.exports = { setStatus, getStatus };