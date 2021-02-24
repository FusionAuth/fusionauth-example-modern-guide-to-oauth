// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');

// Router & constants
const router = express.Router();

router.get('/', (req, res, next) => {
  common.authorizationCheck(req, res).then((authorized) => {
    if (!authorized) {
      res.sendStatus(403); 
      return;
    }

    const todos = common.getTodos();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(todos));
  }).catch((err) => {
    console.log(err);
  });
});

module.exports = router;
