const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const { getImages } = require("../controllers/admin.controller");

// 🔒 Protected route
router.get("/get-images", requireAuth(), getImages);

module.exports = router;