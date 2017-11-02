/** @module query */

const config = require('getconfig');
const sanitize = require('mongo-sanitize');
const escapeStringRegexp = require('escape-string-regexp');
const { ApiError } = require('../../lib/error-classes');
const { respondWithError } = require('../../lib/response-utils');


/**
 * Parse `filter` query string parameter.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns 
 */
function parseFilterParameter(req, res, next) {
  const filter = req.query.filter || {};
  const entries = Object.entries(filter);

  req.query.filter = {};
  for (let i = 0, length = entries.length; i < length; i += 1) {
    const [field, value] = entries[i];

    if (!/^[A-Za-z0-9_]+$/.test(field)) {
      return respondWithError(res, new ApiError(`Недопустимое название поля: ${field}`, 400));
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


/**
 * Parse `skip` and `limit` query string parameters.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
function parseSkipAndLimitParameters(req, res, next) {
  let skip = parseInt(req.query.skip, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(skip) || skip < 0) {
    skip = config.pagination.skip;
  }

  if (isNaN(limit) || limit < 0) {
    limit = config.pagination.limit;
  }

  req.query.skip = skip;
  req.query.limit = limit;
  next();
}


/**
 * Parse `object` query string parameter.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns 
 */
function parseSortParameter(req, res, next) {
  const sortFields = req.query.sort ? req.query.sort.split(',') : [];

  req.query.sort = {};
  for (let i = 0, length = sortFields.length; i < length; i += 1) {
    let field = sortFields[i];
    let order = 1;

    if (field.startsWith('-')) {
      field = field.slice(1);
      order = -1;
    }

    if (!/^[A-Za-z0-9_]+$/.test(field)) {
      return respondWithError(res, new ApiError(`Недопустимое название поля: ${field}`, 400));
    }

    req.query.sort[field] = order;
  }

  return next();
}


module.exports = {
  filter: parseFilterParameter,
  skipAndLimit: parseSkipAndLimitParameters,
  sort: parseSortParameter,
};
