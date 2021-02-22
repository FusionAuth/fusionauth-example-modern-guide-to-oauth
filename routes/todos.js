// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');

// Router & constants
const router = express.Router();
const aud = config.clientId;
const iss = 'https://local.fusionauth.io';

getTodos = () => {
  todos = [];
  todos.push({'task': 'Get milk', 'done' : true});
  todos.push({'task': 'Read OAuth book', 'done' : false});
  return todos;
}

authorizationCheck = (req,failure) => {
  const accessToken = req.cookies.access_token;
  common.parseJWT(accessToken, (jwt) => { 
    if (jwt.iss !== iss || jwt.aud !== aud) {
      failure();
    }
  });
}

router.get('/', (req, res, next) => {
  authorizationCheck(req, () => {
    console.log('claims did not match expected values');
    res.redirect(302,"/"); // Start over
    return;
  });
  todos = getTodos();
  idToken = req.cookies.id_token;
  common.parseJWT(idToken, (user) => { 
    if (!user) {
      console.log('Nonce is bad. It should be ' + nonce + ' but was ' + idToken.nonce);
      res.redirect(302,"/"); // Start over
      return;
    }
    res.render('todos', {title: 'Todos', todos: todos, user: user});
  });
});

router.get('/api', (req, res, next) => {
  authorizationCheck(req, () => {
    console.log('claims did not match expected values');
    res.redirect(302,"/"); // Start over
    return;
  });

  todos = getTodos();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(todos));
});



module.exports = router;
