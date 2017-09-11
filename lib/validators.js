/** @module validators */

const { getInstance } = require('../databaseAdapter');


/**
 * Check if passwords the same.
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

module.exports = {
  isPasswordsMatch,
  isValueExists,
};
