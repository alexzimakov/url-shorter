/** @module authorize */

const _ = require('lodash');
const { ApiError } = require('../lib/error-classes');
const { respondWithError } = require('../lib/response-utils');


/**
 * Checks permissions for role.
 * 
 * @param {String|Array} roles 
 * @returns 
 */
function authorize(roles) {
  return (req, res, next) => {
    const { user } = req.auth;
    let notAllowed = true;

    if (_.isArray(roles)) {
      for (let i = 0, length = roles.length; i < length; i += 1) {
        if (_.eq(user.role, roles[i])) {
          notAllowed = false;
          break;
        }
      }
    }

    if (_.isString(roles) && _.eq(user.role, roles)) {
      notAllowed = false;
    }

    if (notAllowed) {
      respondWithError(res, new ApiError('Недостаточно прав.', 403));
    } else {
      next();
    }
  };
}


module.exports = authorize;
