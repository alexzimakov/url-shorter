/** @module authenticate */

const User = require('../models/user');
const GuestUser = require('../models/guest-user');
const { ApiError } = require('../lib/error-classes');
const { isValidAuthorizationHeader } = require('../lib/validators');
const { verifyToken } = require('../lib/crypto-utils');


/**
 * Checks jwt token stored at Authorization header.
 * If token is valid, calls a callback function and extends `req` object with user object.
 * In case of token is not valid or user associated with token not exists,
 * then finishes request with error.
 * 
 * @param {Object} req – Express request object.
 * @param {Object} res – Express response object.
 * @param {Function} next – callback function.
 * @returns {Promise}
 */
async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.header('Authorization');

    if (!authorizationHeader) {
      req.user = new GuestUser();
      next();
    } else if (!isValidAuthorizationHeader(authorizationHeader)) {
      next(new ApiError('Неверный формат аутентификационного заголовка.', 401));
    } else {
      const token = authorizationHeader.replace(/^Bearer /, '');
      const payload = await verifyToken(token);
      const user = await User.findById(payload.id);

      if (user === null) {
        next(new ApiError('Пользователь, ассоциированный с токеном аутентификации, не найден.', 401));
      } else {
        req.user = user;
        next();
      }
    }
  } catch (error) {
    switch (error.name) {
      case 'TokenExpiredError':
        next(new ApiError('Истёк срок действия токена аутентификации.', 401));
        break;

      case 'JsonWebTokenError':
        next(new ApiError('Недействительный токен аутентификации.', 401));
        break;

      default:
        next(error);
        break;
    }
  }
}


module.exports = authenticate;
