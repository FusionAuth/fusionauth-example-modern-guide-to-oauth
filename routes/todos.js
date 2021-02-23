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

authorizationCheck = async (req, res) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  try {
    let jwt = await common.parseJWT(accessToken);
    return true;
  } catch (err) { 
    if (err.name === "TokenExpiredError") {
      const refreshedTokens = await common.refreshJWTs(refreshToken);

      const newAccessToken = refreshedTokens.accessToken;
      const newIdToken = refreshedTokens.idToken;
  
      // update our cookies
      console.log("updating our cookies");
      res.cookie('access_token', newAccessToken, {httpOnly: true, secure: true});
      res.cookie('id_token', newIdToken); // Not httpOnly or secure
     
      // subsequent parts of processing this request may pull from cookies, so if we refreshed, update them
      req.cookies.access_token = newAccessToken;
      req.cookies.id_token = newIdToken;

      try {
        let newJwt = await common.parseJWT(newAccessToken);
        return true;
      } catch (err2) {
        console.log(err2);
        return false;
      }
    } else {
      console.log(err);
    }
    return false;
  }
}

router.get('/', (req, res, next) => {
  authorizationCheck(req, res).then((authorized) => {
    if (!authorized) {
      res.redirect(302,"/"); // Start over
      return;
    }
    const todos = getTodos();
    const idToken = req.cookies.id_token;
    user = common.parseJWT(idToken).then((user) => {
      res.render('todos', {title: 'Todos', todos: todos, user: user});
    }).catch((err) => {
      console.log(err);
    });
  });
});

router.get('/api', (req, res, next) => {
  authorizationCheck(req, res).then((authorized) => {
    if (!authorized) {
      res.sendStatus(403); 
      return;
    }

    const todos = getTodos();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(todos));
  }).catch((err) => {
    console.log(err);
  });
});

module.exports = router;
