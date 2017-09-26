/** @module middlewares */

const allowCrossDomain = require('./allowCrossDomain');
const authenticate = require('./authenticate');
const authorize = require('./authorize');
const validate = require('./validate');
const parse = require('./parse');


module.exports = {
  allowCrossDomain,
  authenticate,
  authorize,
  validate,
  parse,
};
