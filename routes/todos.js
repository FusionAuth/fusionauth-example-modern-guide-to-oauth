// Dependencies
const express = require('express');
const common = require('./common');
const config = require('./config');

// Router & constants
const router = express.Router();

router.get('/', (req, res, next) => {
  common.authorizationCheck(req, res).then((authorized) => {
    if (!authorized) {
      res.redirect(302,"/"); // Start over
      return;
    }
    const todos = common.getTodos();
    const idToken = req.cookies.id_token;
    const accessToken = req.cookies.access_token;

    // either parse the idToken and pull out the claims, or call the userinfo endpoint
    //common.parseJWT(idToken) 
    common.retrieveUser(accessToken)
      .then((user) => {
        res.render('todos', {title: 'Todos', todos: todos, user: user});
    }).catch((err) => {
      console.log(err);
    });
  });
});

module.exports = router;
