const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { getImages, uploadDissertation, multipleUploadHandler, getUploadedFiles, deleteFile, publishDissertations, getStudentActivity, deleteUser, getNotifications, markAllNotificationsRead, getUnreadNotificationsCount } = require("../controllers/admin.controller");
const { getUploadStatus } = require("../controllers/admin.controller")
const { getAllDissertations, deleteDissertation, getDissertationById, updateDissertation } = require("../controllers/dissertations.controller");

const multer = require("multer");

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

const storage_upload = multer.memoryStorage();

const upload_dissertation = multer({ storage_upload });

// 🔒 Protected route
router.post("/upload-dissertation", requireAuth(), upload_dissertation.single("file"), uploadDissertation);

router.post("/multiple-upload",  requireAuth(),  upload.array("files", 20),  multipleUploadHandler); // 🔥 up to 20 PDFs

// 📥 Get uploaded files
router.get("/uploads", requireAuth(), getUploadedFiles);

// ❌ Delete file
router.delete("/uploads/:filename", requireAuth(), deleteFile);

router.post("/publish", requireAuth(), publishDissertations);

router.get("/upload-status", requireAuth(), getUploadStatus);

router.get("/get-dissertations", requireAuth(), getAllDissertations);

// DELETE dissertations.
router.delete("/delete-dissertation/:id", requireAuth(), deleteDissertation);

router.get("/dissertations/:id", requireAuth(), getDissertationById);

router.put("/dissertations/:id", requireAuth(), updateDissertation);

router.get("/get-student/activity", requireAuth(),  getStudentActivity);

router.delete("/delete-user", requireAuth(), deleteUser);

router.get(
  "/notifications",
  requireAuth(),
  getNotifications
);

router.put(
  "/notifications/read-all",
  requireAuth(),
  markAllNotificationsRead
);
router.get(
  "/notifications/unread-count",
  requireAuth(),
  getUnreadNotificationsCount
);

module.exports = router;