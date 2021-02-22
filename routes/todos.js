// Dependencies
const express = require('express');

// Router
const router = express.Router();

router.get('/', (req, res, next) => {
  todos = [];
  todos.push({'task': 'Get milk', 'done' : true});
  todos.push({'task': 'Read OAuth book', 'done' : false});
  res.render('index', {title: 'Todos', todos: todos});
});

module.exports = router;
