/** @module authenticate */

const config = require('getconfig');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');
const { getInstance } = require('../databaseAdapter');
const ApiError = require('../lib/ApiError');
const { respondWithError } = require('../lib/responseUtils');


/**
 * Checks jwt token stored at Authorization header.
 * If token is valid, calls a callback function and extends `req` object with auth data.
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

    if (!_.startsWith(authorizationHeader, 'Bearer ')) {
      throw new ApiError('Authorization Header – неверный формат.', 401);
    }

    const token = _.replace(authorizationHeader, 'Bearer ', '');
    const payload = jwt.verify(token, config.secret, config.jwt);
    const db = await getInstance();
    const col = db.collection('users');
    const user = await col.findOne({ _id: new ObjectID(payload.id) });

    if (_.isNull(user)) {
      throw new ApiError('Пользователь, ассоциированный с токеном авторизации, не найден.', 401);
    }

    req.auth = { user };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      respondWithError(res, new ApiError('Недействительный токен авторизации.'), 401);
    } else {
      respondWithError(res, error);
    }
  }
}


module.exports = authenticate;
