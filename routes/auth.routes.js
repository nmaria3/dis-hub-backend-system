// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { signUp, signIn, checkProfile } = require("../controllers/auth.controller");
const { getCompleteProfileData } = require("../controllers/getprofile.controller");
const { completeProfile } = require("../controllers/completeprofile.controller");

// POST /auth/sign-up
router.post("/sign-up", signUp);

// POST /auth/sign-in
router.post("/sign-in", signIn);

// GET /auth/check-profile
router.post("/check-profile", checkProfile);

// GET /auth/profile-data
router.get("/complete-profile-data", getCompleteProfileData);

// POST /auth/complete-profile
router.post("/complete-profile", completeProfile);

module.exports = router;