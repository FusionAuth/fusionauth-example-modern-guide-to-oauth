// Dependencies
const express = require('express');

// Router
const router = express.Router();

getTodos = () => {
  todos = [];
  todos.push({'task': 'Get milk', 'done' : true});
  todos.push({'task': 'Read OAuth book', 'done' : false});
  return todos;
}

router.get('/', (req, res, next) => {
  todos = getTodos();
  res.render('index', {title: 'Todos', todos: todos});
});

router.get('/api', (req, res, next) => {
  todos = getTodos();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(todos));
});



module.exports = router;
