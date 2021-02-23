// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');

// Router & constants
const router = express.Router();

getTodos = () => {
  // pull from the database
  todos = [];
  todos.push({'task': 'Get milk', 'done' : true});
  todos.push({'task': 'Read OAuth guide', 'done' : false});
  return todos;
}

authorizationCheck = (req,failure) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  common.parseJWT(accessToken, refreshToken, (jwt) => { 
    if (!jwt) {
      failure();
    }
  });
}

router.get('/', (req, res, next) => {
  authorizationCheck(req, () => {
    res.redirect(302,"/"); // Start over
    return;
  });
  const todos = getTodos();
  const idToken = req.cookies.id_token;
  const refreshToken = req.cookies.refresh_token;
  common.parseJWT(idToken, refreshToken, (user) => { 
    if (!user) {
      console.log('token is bad');
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

  const todos = getTodos();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(todos));
});

module.exports = router;
