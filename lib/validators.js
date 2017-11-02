/** @module validators */

const User = require('../models/User');


/**
 * Checks if passwords are same.
 * 
 * @param {String} value 
 * @param {Object} { req, location, path }
 * @returns {Boolean}
 */
function isPasswordsMatch(value, { req }) {
  if (value !== req.body.password) {
    throw new Error('Passwords should be same.');
  }
  return true;
}


/**
 * Checks if user with a given username already exists.
 * 
 * @param {String} field 
 * @returns {Function}
 */
function isUserWithSuchUsernameExists(value) {
  return User.count({ filter: { username: value } })
    .then((numberOfUsers) => {
      if (numberOfUsers > 0) {
        throw new Error('User with such username is already exists.');
      }

      return true;
    });
}


/**
 * Checks if user with a given email already exists.
 * 
 * @param {String} field 
 * @returns {Function}
 */
function isUserWithSuchEmailExists(value) {
  return User.count({ filter: { email: value } })
    .then((numberOfUsers) => {
      if (numberOfUsers > 0) {
        throw new Error('User with such email is already exists.');
      }

      return true;
    });
}


/**
 * Checks if value contains only letters.
 * 
 * @param {any} value 
 * @returns {Boolean}
 */
function isLettersOnly(value) {
  if (!/^[^\s\d.,\/#!$%\^&\*;:{}=\_`~()]+$/.test(value)) {
    throw new Error(`Value \`${value}\` should contains letters only.`);
  }

  return true;
}


/**
 * Checks if a given value is array.
 * 
 * @param {Array} value 
 * @returns {Boolean}
 */
function isArray(value) {
  if (!Array.isArray(value)) {
    throw new Error('Value should be an array.');
  }

  return true;
}


/**
 * Checks if all tags in list is valid.
 * 
 * @param {Array} value 
 * @returns {Boolean}
 */
function isValidTags(value) {
  for (let i = 0, length = value.length; i < length; i += 1) {
    const tag = value[i];

    if (!/^[^\s.,\/#!$%\^&\*;:{}=\_`~()]+$/.test(tag)) {
      throw new Error(`Неверный тег "${tag}". Можно использовать только буквы, цифры и дефис.`);
    }
  }

  return true;
}


module.exports = {
  isPasswordsMatch,
  isUserWithSuchUsernameExists,
  isUserWithSuchEmailExists,
  isLettersOnly,
  isArray,
  isValidTags,
};
