// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');
const axios = require('axios');

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

router.post('/complete/:id', (req, res, next) => {
  common.authorizationCheck(req, res).then((authorized) => {
    if (!authorized) {
      res.sendStatus(403); 
      return;
    }

    const idToUpdate = parseInt(req.params.id);
    common.completeTodo(idToUpdate);

    /*
    const wuphTokens = {}
    axios.post('https://api.wuphf.com/send', {}, { headers: { 
          auth: { 'bearer': wuphfTokens.accessToken, 'refresh': wuphfTokens.refreshToken }
        }
      }).then((response) => {
        // check for status, log if not 200
      } 
    );  
    */

    const todos = common.getTodos();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(todos));
  }).catch((err) => {
    console.log(err);
  });
});

module.exports = router;
