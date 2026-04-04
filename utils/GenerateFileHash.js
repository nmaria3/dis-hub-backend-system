const crypto = require("crypto");

function generateFileHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

module.exports = { generateFileHash };