/** @module app */

const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');
const services = require('./services');
const routes = require('./routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/services', services);
app.use('/api/v1', api);
app.use(routes);
app.use('/', (req, res) => res.send('url-shorter api server'));


module.exports = app;
