const express = require("express");
const router = express.Router();
const { getZones, control, browse, load, isConnected } = require("../roon");

router.get("/zones", (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: "Roon not connected" });
  
  getZones((err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

router.post("/control/:zone_id", (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: "Roon not connected" });
  
  const { zone_id } = req.params;
  const { command } = req.body; // play, pause, playpause, next, previous, stop
  
  control(zone_id, command, (err) => {
    if (err && typeof err === 'object') return res.status(500).json({ error: err.message || "Control failed" });
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, command, zone_id });
  });
});

router.post("/browse", (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: "Roon not connected" });
  
  const opts = req.body || {};
  browse(opts, (err, payload) => {
    if (err) return res.status(500).json({ error: err.message || "Browse failed" });
    res.json(payload);
  });
});

router.post("/load", (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: "Roon not connected" });
  
  const opts = req.body || {};
  load(opts, (err, payload) => {
    if (err) return res.status(500).json({ error: err.message || "Load failed" });
    res.json(payload);
  });
});

module.exports = router;