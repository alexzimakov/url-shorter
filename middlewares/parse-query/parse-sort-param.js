/** @module parseSortParam */

const { ApiError } = require('../../lib/error-classes');


/**
 * Parse `object` query string parameter.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns
 */
function parseSortParam(req, res, next) {
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
      return next(res, new ApiError(`Недопустимое название поля: ${field}`, 400));
    }

    req.query.sort[field] = order;
  }

  return next();
}


module.exports = parseSortParam;
