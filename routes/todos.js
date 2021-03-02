// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');

// Router & constants
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('todos', {});
});

module.exports = router;
