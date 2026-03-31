const dotenv = require("dotenv").config()
const express = require('express');
const cors = require('cors');
const app = express();
const db = require("./config/db");
const { clerkMiddleware,  clerkClient, requireAuth, getAuth, verifyToken } = require('@clerk/express');
const loggerMiddleware = require('./middleware/logger.middleware');

// Routes
const authRoutes = require("./routes/auth.routes");


// Middleware
// app.use(
//     cors({
//         origin: ["http://localhost:3000"], // only your frontend
//         methods: ["GET", "POST", "PUT", "DELETE"],
//         credentials: true,
//     })
// );
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use(loggerMiddleware);

// Test route
app.get('/', (req, res) => {
    res.send('Server is running 🚀');
});

// Example API route
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to your backend API'
    });
});

app.use("/auth", authRoutes);

app.post("/delete-user", requireAuth(), async (req, res) => {
  try {
    const userId = req.body.userId;

    console.log("Deleting Clerk user:", userId);

    await clerkClient.users.deleteUser(userId);

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// app.get('/protected', requireAuth({ signInUrl: process.env.CLERK_SIGN_IN_URL , authorizedParties: [process.env.CLERK_FRONTEND_API] }), async (req, res) => {
// //   console.log("AUTH OBJECT:", req.auth());

//   const { userId } = getAuth(req);

//   console.log("USER ID:", userId);

//   const user = await clerkClient.users.getUser(userId);

//   return res.json({ user });
// });

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});