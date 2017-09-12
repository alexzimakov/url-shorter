/** @module parseSkipAndLimitQueryParameters */

const config = require('getconfig');


/**
 * Parse `skip` and `limit` query string parameters.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
function parseSkipAndLimitQueryParameters(req, res, next) {
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


module.exports = parseSkipAndLimitQueryParameters;
