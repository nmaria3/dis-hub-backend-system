const express = require("express");
const router = express.Router();
const { updateActivity, getStudentDownloads, getStudentBookmarks } = require("../controllers/students.controller");
const { getAllDissertations, getDissertationById, getDissertationStats, trackView, trackDownload,toggleBookmark, getBookmarkStatus } = require("../controllers/dissertations.controller")
const { requireAuth } = require("@clerk/express");

router.get("/api/activity", requireAuth(), updateActivity);

router.get("/get-dissertations",  getAllDissertations); // Must be a public endpoint

router.get("/dissertation/:id", requireAuth(), getDissertationById);

router.get("/dissertation/:id/stats", requireAuth(), getDissertationStats);

router.post("/track/view", requireAuth(), trackView);

router.post("/track/download", requireAuth(), trackDownload);

router.post("/track/bookmark", requireAuth(), toggleBookmark);

router.get("/bookmark/:file_id", requireAuth(), getBookmarkStatus);

router.get("/downloads", requireAuth(), getStudentDownloads);

router.get("/bookmarks", requireAuth(), getStudentBookmarks);

module.exports = router;