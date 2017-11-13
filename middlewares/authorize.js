/** @module authorize */

const { ApiError } = require('../lib/error-classes');


/**
 *
 * @param permissions
 * @returns {Function}
 */
function authorize(...permissions) {
  return (req, res, next) => {
    const allowed = req.user.hasPermission(permissions);

    if (allowed) {
      next();
    } else {
      next(new ApiError('Недостаточно прав.', 403));
    }
  };
}


module.exports = authorize;
