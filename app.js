/** @module app */

const express = require('express');
const bodyParser = require('body-parser');
const middlewares = require('./middlewares');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(middlewares.paging);
app.use('/', (req, res) => res.send('url-shorter api server'));


module.exports = app;
