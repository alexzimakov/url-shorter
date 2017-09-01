const express = require('express');

const app = express();


app.use('/', async (req, res) => {
  res.send('url-shorter api server');
});


module.exports = app;
