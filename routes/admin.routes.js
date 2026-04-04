const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { getImages, uploadDissertation, multipleUploadHandler, getUploadedFiles, deleteFile, publishDissertations} = require("../controllers/admin.controller");
const { getUploadStatus } = require("../controllers/admin.controller")

const multer = require("multer");
const path = require("path");

// 📁 Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName =
      file.originalname.replace(/\s+/g, "_");
    //   Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// 📦 Multer instance
const upload = multer({ storage });

// 🔒 Protected route
router.get("/get-images", requireAuth(), getImages);

// 🔒 Protected route
router.post("/upload-dissertation", requireAuth(), upload.single("file"), uploadDissertation);

router.post("/multiple-upload",  requireAuth(),  upload.array("files", 20),  multipleUploadHandler); // 🔥 up to 20 PDFs

// 📥 Get uploaded files
router.get("/uploads", requireAuth(), getUploadedFiles);

// ❌ Delete file
router.delete("/uploads/:filename", requireAuth(), deleteFile);

router.post("/publish", requireAuth(), publishDissertations);

router.get("/upload-status", requireAuth(), getUploadStatus);

module.exports = router;