/** @module parseSortQueryParameter */

const { respondWithFail } = require('../lib/responseUtils');


/**
 * Parse `object` query string parameter.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns 
 */
function parseSortQueryParameter(req, res, next) {
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
      return respondWithFail(res, `Недопустимое название поля: ${field}`);
    }

    req.query.sort[field] = order;
  }

  return next();
}


module.exports = parseSortQueryParameter;
