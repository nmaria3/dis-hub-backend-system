const fs = require("fs");
const path = require("path");

const clearUploadsFolder = () => {
  try {
    const uploadFolder = path.join(__dirname, "../uploads");

    // 🔍 Check if folder exists
    if (!fs.existsSync(uploadFolder)) {
      console.log("⚠️ Uploads folder does not exist.");
      return;
    }

    // 📂 Read files
    const files = fs.readdirSync(uploadFolder);

    // ❌ If empty
    if (files.length === 0) {
      console.log("📂 No files to delete.");
      return;
    }

    // 🧹 Delete each file
    for (const file of files) {
      const filePath = path.join(uploadFolder, file);

      fs.unlinkSync(filePath); // delete file
      console.log(`🗑️ Deleted: ${file}`);
    }

    console.log("✅ All files deleted successfully.");

  } catch (error) {
    console.error("❌ Error deleting files:", error);
  }
};

module.exports = { clearUploadsFolder };