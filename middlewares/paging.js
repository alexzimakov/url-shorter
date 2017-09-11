/** @module paging */


/**
 * Adds `pager` property to request object.
 * 
 * @param {Object} req – Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next – Callback function.
 */
function paging(req, res, next) {
  let offset = parseInt(req.query.offset, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }

  if (isNaN(limit) || limit < 0) {
    limit = 20;
  }

  req.pager = { offset, limit };
  next();
}


module.exports = paging;
