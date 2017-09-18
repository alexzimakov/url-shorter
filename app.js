/** @module app */

const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');
const services = require('./services');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/v1', api);
app.use('/services', services);
app.use('/', (req, res) => res.send('url-shorter api server'));


module.exports = app;
