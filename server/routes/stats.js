const express = require("express");
const { getTopArtists, getTopTracks, getPlayTime } = require("../db");
const { parseDateParams } = require("../utils/time");

const router = express.Router();

router.get("/playtime", (req, res) => {
  const { from, to } = parseDateParams(req.query);
  const data = getPlayTime(from, to);
  res.json(data);
});

router.get("/top-artists", (req, res) => {
  const { from, to } = parseDateParams(req.query);
  const limit = parseInt(req.query.limit) || 50;
  const data = getTopArtists(from, to, limit);
  res.json(data);
});

router.get("/top-tracks", (req, res) => {
  const { from, to } = parseDateParams(req.query);
  const limit = parseInt(req.query.limit) || 50;
  const data = getTopTracks(from, to, limit);
  res.json(data);
});

module.exports = router;

