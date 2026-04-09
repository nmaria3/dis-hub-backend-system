const express = require("express");
const router = express.Router();
const { updateActivity } = require("../controllers/students.controller");
const { getAllDissertations } = require("../controllers/dissertations.controller")
const { requireAuth } = require("@clerk/express");

router.get("/api/activity", requireAuth(), updateActivity);

router.get("/get-dissertations",  getAllDissertations);

module.exports = router;