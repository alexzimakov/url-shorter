/** @module links */
/* eslint newline-per-chained-call: 0 */

const _ = require('lodash');
const { check } = require('express-validator/check');
const { isArray, isValidTags } = require('../../lib/validators');
const { sprintf } = require('sprintf-js');
const {
  EMPTY,
  URL,
  MAX_LENTGH,
} = require('./errors');

const OPTIONAL_VALIDATORS = [
  // Validates description.
  check('description').optional()
    .isLength({ max: 256 }).withMessage(sprintf(MAX_LENTGH, 256)),

  // Validates tags.
  check('tags').optional()
    .custom(isArray).withMessage('Список тегов должен быть массивом.')
    .custom(isValidTags),
];

exports.create = _.concat([
  // Validates url.
  check('url')
    .not().isEmpty().withMessage(EMPTY)
    .isURL().withMessage(URL),
], OPTIONAL_VALIDATORS);


exports.update = _.concat([
  // Validates url.
  check('url').optional()
    .isURL().withMessage(URL),
], OPTIONAL_VALIDATORS);
