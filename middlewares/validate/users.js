/** @module users */
/* eslint newline-per-chained-call: 0 */

const _ = require('lodash');
const { check } = require('express-validator/check');
const {
  isPasswordsMatch,
  isValueExists,
  isLettersOnly,
} = require('../../lib/validators');
const { sprintf } = require('sprintf-js');
const {
  EMPTY,
  MIN_LENTGH,
  NICKNAME,
  EMAIL,
  PASSWORD_AGAIN,
  LETTERS_ONLY,
} = require('./errors');


const OPTIONAL_VALIDATORS = [
  // Validate first name.
  check('firstName').optional()
    .custom(isLettersOnly).withMessage(LETTERS_ONLY),

  // Validate last name.
  check('lastName').optional()
    .custom(isLettersOnly).withMessage(LETTERS_ONLY),

  // Validate gender.
  check('gender').optional()
    .isIn(['male', 'female']).withMessage('Допустимые значения: male или female.'),

  // Validate birth date.
  check('birthDate').optional()
    .isBefore().withMessage('Значение должно быть датой и предшествовать текущей дате.'),
];


exports.create = _.concat([
  // Validate username.
  check('username')
    .not().isEmpty().withMessage(EMPTY)
    .isLength({ min: 3 }).withMessage(sprintf(MIN_LENTGH, 3))
    .matches(/^[A-Za-z0-9_-]{3,16}$/).withMessage(NICKNAME)
    .custom(isValueExists('users', 'username')).withMessage('Пользователь с таким логином уже существует.'),

  // Validate email.
  check('email')
    .not().isEmpty().withMessage(EMPTY)
    .isEmail().withMessage(EMAIL)
    .custom(isValueExists('users', 'email')).withMessage('Пользователь с таким email адресом уже существует.'),

  // Validate password.
  check('password')
    .not().isEmpty().withMessage(EMPTY)
    .isLength({ min: 8 }).withMessage(sprintf(MIN_LENTGH, 8)),

  // Password confirmation.
  check('passwordAgain')
    .not().isEmpty().withMessage(EMPTY)
    .custom(isPasswordsMatch).withMessage(PASSWORD_AGAIN),
], OPTIONAL_VALIDATORS);


exports.update = _.concat([
  // Validate username.
  check('username').optional()
    .isLength({ min: 3 }).withMessage(sprintf(MIN_LENTGH, 3))
    .matches(/^[A-Za-z0-9_-]{3,16}$/).withMessage(NICKNAME)
    .custom(isValueExists('users', 'username')).withMessage('Пользователь с таким логином уже существует.'),

  // Validate email.
  check('email').optional()
    .isEmail().withMessage(EMAIL)
    .custom(isValueExists('users', 'email')).withMessage('Пользователь с таким email адресом уже существует.'),

  // Validate password.
  check('password').optional()
    .isLength({ min: 8 }).withMessage(sprintf(MIN_LENTGH, 8)),
], OPTIONAL_VALIDATORS);
