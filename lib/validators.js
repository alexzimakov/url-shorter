/** @module validators */

const _ = require('lodash');
const { getInstance } = require('../databaseAdapter');


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
 * Returns validator for checking if value is exists in collection.
 * 
 * @param {String} collection 
 * @param {String} field 
 * @returns {Function}
 */
function isValueExists(collection, field) {
  return value => getInstance()
    .then(db => db.collection(collection).findOne({ [field]: value }))
    .then((result) => {
      if (result) {
        throw new Error(`Value \`${value}\` is already exists in \`${collection}\` collection.`);
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
  if (!_.isArray(value)) {
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

    try {
      isLettersOnly(tag);
    } catch (error) {
      throw new Error(`Неверный тег "${tag}". Можно использовать только буквы, цифры и дефис.`);
    }
  }

  return true;
}


module.exports = {
  isPasswordsMatch,
  isValueExists,
  isLettersOnly,
  isArray,
  isValidTags,
};
