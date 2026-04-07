const express = require("express");
const router = express.Router();
const { updateActivity } = require("../controllers/students.controller");
const { requireAuth } = require("@clerk/express");

router.get("/api/activity", requireAuth(), updateActivity);

module.exports = router;