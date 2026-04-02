const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { getImages, uploadDissertation, testExtract, localPdfTestExtract } = require("../controllers/admin.controller");

const multer = require("multer");

const storage = multer.memoryStorage(); // store in memory (for now)

const upload = multer({ storage });

// 🔒 Protected route
router.get("/get-images", requireAuth(), getImages);

// 🔒 Protected route
router.post("/upload-dissertation", requireAuth(), upload.single("file"), uploadDissertation);

const upload_test = multer({ dest: "uploads/" });

router.post("/test-extract", upload_test.single("file"), testExtract);

router.post("/local-pdf-test-extract", upload_test.single("file"), localPdfTestExtract);

module.exports = router;