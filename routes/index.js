const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: "Supabase (PostgreSQL) conected",
  });
});

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);

router.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: `route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /health",
      "POST /auth/register",
      "POST /auth/login",
      "GET /auth/me",
      "PUT /auth/profile",
      "GET /posts",
      "GET /posts/:id",
      "POST /posts",
      "PUT /posts/:id",
      "DELETE /posts/:id",
      "GET /posts/stats",
    ],
  });
});

module.exports = router;
