// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { startRoon, getImage, isConnected, historyPoller } = require("./roon");
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

// Debug: view raw Browse API diagnostic output
app.get("/api/debug/browse", (req, res) => {
  res.json({
    connected: isConnected(),
    diagnosticEntries: historyPoller.getDiagnosticLog(),
  });
});

// Debug: trigger a fresh diagnostic poll
app.post("/api/debug/browse", (req, res) => {
  if (!isConnected()) {
    return res.status(503).json({ error: "Not connected to Roon core" });
  }
  historyPoller.triggerDiagnostic();
  res.json({ message: "Diagnostic poll triggered. GET /api/debug/browse in a few seconds to see results." });
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
  historyPoller.cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  flushAll();
  historyPoller.cleanup();
  process.exit(0);
});

