/** @module app */

const config = require('getconfig');
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const serveStatic = require('serve-static');
const middlewares = require('./middlewares');
const api = require('./api');
const services = require('./services');
const routes = require('./routes');

const app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

app.use(morgan(config.env === 'dev' ? 'dev' : 'short'));
app.use(middlewares.allowCrossDomain);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(serveStatic('public'));
app.use('/services', services);
app.use('/api/v1', api);
app.use(routes);
app.use('/', (req, res) => res.send('url-shorter api server'));


module.exports = app;
