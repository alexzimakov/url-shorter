/** @module addPaginationObjectToRequest */

const config = require('getconfig');


/**
 * Adds pagination object with skip and limit keys to request object.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
function addPaginationObjectToRequest(req, res, next) {
  let skip = parseInt(req.query.skip, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(skip) || skip < 0) {
    skip = config.pagination.skip;
  }

  if (isNaN(limit) || limit < 0) {
    limit = config.pagination.limit;
  }

  req.pagination = { skip, limit };
  next();
}


module.exports = addPaginationObjectToRequest;
