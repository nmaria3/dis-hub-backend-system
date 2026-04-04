const fs = require("fs");
const path = require("path");

const statusFilePath = path.join(__dirname, "../status.json");

// Initialize file if it doesn't exist
if (!fs.existsSync(statusFilePath)) {
  fs.writeFileSync(
    statusFilePath,
    JSON.stringify({
      status: "idle",
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      message: "",
    }, null, 2)
  );
}

// Write status
const setStatus = (data) => {
  fs.writeFileSync(statusFilePath, JSON.stringify(data, null, 2));
};

// Read status
const getStatus = () => {
  const raw = fs.readFileSync(statusFilePath);
  return JSON.parse(raw);
};

module.exports = { setStatus, getStatus };