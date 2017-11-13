/** @module parseSkipParam */

const config = require('getconfig');

/**
 * Parse `skip` query string parameter.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function parseSkipParam(req, res, next) {
  let skip = parseInt(req.query.skip, 10);

  if (isNaN(skip) || skip < 0) {
    skip = config.pagination.skip;
  }

  req.query.skip = skip;
  next();
}


module.exports = parseSkipParam;
