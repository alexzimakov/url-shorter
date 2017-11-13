/** @module parseLimitParam */

const config = require('getconfig');

/**
 * Parse `limit` query string parameter.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function parseLimitParam(req, res, next) {
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(limit) || limit < 0) {
    limit = config.pagination.limit;
  }

  req.query.limit = limit;
  next();
}


module.exports = parseLimitParam;
