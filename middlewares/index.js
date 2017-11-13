/** @module middlewares */

const allowCrossDomain = require('./allow-cross-domain');
const handleErrors = require('./handle-errors');
const authenticate = require('./authenticate');
const authorize = require('./authorize');
const parseQuery = require('./parse-query');


module.exports = {
  allowCrossDomain,
  handleErrors,
  authenticate,
  authorize,
  parseQuery,
};
