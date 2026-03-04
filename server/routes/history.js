const express = require("express");
const { getHistory } = require("../db");
const { parseDateParams } = require("../utils/time");

const router = express.Router();

router.get("/", (req, res) => {
  const { from, to } = parseDateParams(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const data = getHistory(from, to, page, limit);
  res.json(data);
});

module.exports = router;

