// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { startRoon, getImage, isConnected } = require("./roon");
const { getNowPlaying, flushAll } = require("./tracker");
const statsRoutes = require("./routes/stats");
const historyRoutes = require("./routes/history");
const recapRoutes = require("./routes/recap");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/stats", statsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/recap", recapRoutes);

// Now Playing
app.get("/api/now-playing", (req, res) => {
  res.json({
    connected: isConnected(),
    zones: getNowPlaying(),
  });
});

// Status
app.get("/api/status", (req, res) => {
  res.json({ connected: isConnected() });
});

// Image proxy
app.get("/api/image/:image_key", (req, res) => {
  const opts = {
    scale: req.query.scale || "fit",
    width: parseInt(req.query.width) || 300,
    height: parseInt(req.query.height) || 300,
    format: "image/jpeg",
  };
  getImage(req.params.image_key, opts, (err, contentType, body) => {
    if (err) {
      return res.status(502).json({ error: "Failed to load image" });
    }
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(body);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] API running on http://localhost:${PORT}`);
  startRoon();
});

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...");
  flushAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  flushAll();
  process.exit(0);
});

