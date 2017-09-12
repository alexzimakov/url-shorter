/** @module addSortObjectToRequest */

const { respondWithFail } = require('../lib/responseUtils');


/**
 * Add sort object to the request object.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 * @returns 
 */
function addSortObjectToRequest(req, res, next) {
  const sortFields = req.query.sort ? req.query.sort.split(',') : [];

  req.sort = {};
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

    req.sort[field] = order;
  }

  return next();
}


module.exports = addSortObjectToRequest;
