const express = require("express");
const { getRecap } = require("../db");
const { parseDateParams } = require("../utils/time");

const router = express.Router();

router.get("/", (req, res) => {
  const { from, to } = parseDateParams(req.query);
  const data = getRecap(from, to);
  res.json(data);
});

module.exports = router;

