const fs = require("fs");
const path = require("path");

// Path to logs.json
const logsPath = path.join(__dirname, "../logs/logs.json");

/**
 * Append a log entry to logs.json
 * @param {string} logMessage - The log string
 */
const saveLog = (logMessage) => {
  try {
    // Read existing logs
    let logs = [];
    if (fs.existsSync(logsPath)) {
      const data = fs.readFileSync(logsPath, "utf8");
      logs = data ? JSON.parse(data) : [];
    }

    // Add new log
    logs.push({ timestamp: new Date().toISOString(), message: logMessage });

    // Write back to file
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save log:", err);
  }
};

module.exports = { saveLog };