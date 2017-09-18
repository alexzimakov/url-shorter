/** @module services */

const { check } = require('express-validator/check');
const { EMPTY } = require('./errors');

exports.login = [
  // Validate username.
  check('username').not().isEmpty().withMessage(EMPTY),

  // Validate password.
  check('password').not().isEmpty().withMessage(EMPTY),
];
