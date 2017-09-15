/** @module users */
/* eslint newline-per-chained-call: 0 */

const { check } = require('express-validator/check');
const {
  isPasswordsMatch,
  isValueExists,
} = require('../../lib/validators');
const { sprintf } = require('sprintf-js');
const {
  EMPTY,
  MIN_LENTGH,
  NICKNAME,
  EMAIL,
  PASSWORD_AGAIN,
} = require('./errorMessages');


module.exports = [
  /** Validate username. */
  check('username')
    .not().isEmpty().withMessage(EMPTY)
    .isLength({ min: 3 }).withMessage(sprintf(MIN_LENTGH, 3))
    .matches({ pattern: /^[A-Za-z0-9_-]{3,16}$/ }).withMessage(NICKNAME)
    .custom(isValueExists('users', 'username')).withMessage('Пользователь с таким именем уже существует.'),

  /** Validate email. */
  check('email')
    .not().isEmpty().withMessage(EMPTY)
    .isEmail().withMessage(EMAIL)
    .custom(isValueExists('users', 'email')).withMessage('Пользователь с таким email адресом уже существует.'),

  /** Validate password */
  check('password')
    .not().isEmpty().withMessage(EMPTY)
    .isLength({ min: 8 }).withMessage(sprintf(MIN_LENTGH, 8)),

  /** Password confirmation. */
  check('passwordAgain')
    .not().isEmpty().withMessage(EMPTY)
    .custom(isPasswordsMatch).withMessage(PASSWORD_AGAIN),
];
