const fs = require("fs");
const path = require("path");

function ensureUploadsFolder() {
    const uploadsPath = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log("Uploads folder created at root:", uploadsPath);
    } else {
        console.log("Uploads folder already exists:", uploadsPath);
    }
}

module.exports = ensureUploadsFolder;