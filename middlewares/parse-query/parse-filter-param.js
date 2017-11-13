/** @module parseFilterParam */

const sanitize = require('mongo-sanitize');
const escapeStringRegexp = require('escape-string-regexp');
const { ApiError } = require('../../lib/error-classes');


/**
 * Parse `filter` query string parameter.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns
 */
function parseFilterParam(req, res, next) {
  const filter = req.query.filter || {};
  const entries = Object.entries(filter);

  req.query.filter = {};
  for (let i = 0, length = entries.length; i < length; i += 1) {
    const [field, value] = entries[i];

    if (!/^[A-Za-z0-9_]+$/.test(field)) {
      return next(new ApiError(`Недопустимое название поля: ${field}`, 400));
    } else if (value.startsWith('gt:')) {
      req.query.filter[field] = { $gt: sanitize(value.slice(3)) };
    } else if (value.startsWith('lt:')) {
      req.query.filter[field] = { $lt: sanitize(value.slice(3)) };
    } else if (value.startsWith('in:')) {
      req.query.filter[field] = { $in: value.slice(3).split(',').map(v => sanitize(v)) };
    } else if (value.startsWith('like:')) {
      req.query.filter[field] = new RegExp(escapeStringRegexp(value.slice(5)), 'i');
    } else if (value === 'true') {
      req.query.filter[field] = true;
    } else if (value === 'false') {
      req.query.filter[field] = false;
    } else {
      req.query.filter[field] = sanitize(value);
    }
  }

  return next();
}


module.exports = parseFilterParam;