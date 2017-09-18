/** @module middlewares */

const authenticate = require('./authenticate');
const authorize = require('./authorize');
const validate = require('./validate');
const parse = require('./parse');


module.exports = {
  authenticate,
  authorize,
  validate,
  parse,
};
