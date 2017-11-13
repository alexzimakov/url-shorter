/** @module userController */

const User = require('../models/user');
const { ValidationError, ApiError } = require('../lib/error-classes');
const { comparePasswords } = require('../lib/crypto-utils');


/**
 * Controller for handling POST /api/v1/users route.
 *
 * @param {Object} data
 * @returns {Promise.<Object>}
 */
async function register(data) {
  const user = await User.create(data);

  if (!user.isValid) {
    throw new ValidationError(user.errors);
  }

  const jwtToken = await user.generateJwtToken();
  return {
    token: jwtToken,
    user: user.toObject(),
  };
}


/**
 * Controller for handling POST /services/login route.
 * Logs in user with a submitted username and password. On success returns
 * object version of logged in user and generated jwt token.
 *
 * @param {String} username
 * @param {String} password
 * @returns {Promise.<Object>}
 */
async function login(username, password) {
  const user = await User.find({ username });

  if (user === null) {
    throw new ApiError('Пользователь с таким логином не найден', 404);
  }

  if (!user.isActive) {
    throw new ApiError('Данный пользователь заблокирован.', 403);
  }

  if (!(await user.checkPassword(password))) {
    throw new ApiError('Неправильный пароль.', 400);
  }

  const jwtToken = await user.generateJwtToken();
  return {
    token: jwtToken,
    user: user.toObject(),
  };
}


/**
 * Controller for handling GET /api/v1/user/:id route.
 *
 * @param {User} authUser
 * @param {String|Object} id
 * @returns {Promise.<Object>}
 */
async function getOne({ authUser, id }) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Пользователь не найден.', 404);
  }

  if (!authUser.isAdmin && !User.isEqual(authUser, user)) {
    throw new ApiError('Недостаточно прав.', 403);
  }

  return { user: user.toObject() };
}


/**
 * Controller for handling GET /api/v1/users route.
 *
 * @param {Object} query
 * @returns {Promise.<Object>}
 */
async function getMany(query) {
  const count = await User.count(query.filter);
  const users = await User.findAll(query);

  return {
    count,
    users: users.map(user => user.toObject()),
  };
}


/**
 * Controller for handling PUT /api/v1/users/:id route.
 *
 * @param {User} authUser
 * @param {String|Object} id
 * @param {Object} update
 * @returns {Promise.<Object>}
 */
async function updateOne({ authUser, id, update }) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Пользователь не найден.', 404);
  }

  if (!authUser.isAdmin && !User.isEqual(authUser, user)) {
    throw new ApiError('Недостаточно прав.', 403);
  }

  await user.update(update);

  if (!user.isValid) {
    throw new ValidationError(user.errors);
  }

  return {
    user: user.toObject(),
  };
}


/**
 * Controller for handling PUT /api/v1/users route.
 *
 * @param {Object} filter
 * @param {Object} update
 * @returns {Promise.<Object>}
 */
async function updateMany(filter, update) {
  await User.updateAll({ filter, update });
}


/**
 * Controller for handling DELETE /api/v1/users/:id route.
 *
 * @param {User} authUser
 * @param {String|Object} id
 * @returns {Promise.<void>}
 */
async function deleteOne({ authUser, id }) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Пользователь не найден.', 404);
  }

  if (!authUser.isAdmin && !User.isEqual(authUser, user)) {
    throw new ApiError('Недостаточно прав.', 403);
  }

  await user.destroy();
}


/**
 * Controller for handling DELETE /api/v1/users route.
 *
 * @param {Object} filter
 * @returns {Promise.<void>}
 */
async function deleteMany(filter) {
  await User.destroyAll(filter);
}


module.exports = {
  register,
  login,
  getOne,
  getMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
};
