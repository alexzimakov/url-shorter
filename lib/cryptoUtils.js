/** @module hashPassword */

const config = require('getconfig');
const crypto = require('crypto');


/**
 * Hashes password using salt.
 * @param {String} password
 * @return {Promise}
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      config.salt,
      config.crypto.iterations,
      config.crypto.keylen,
      config.crypto.algorithm,
      (err, derivedKey) => {
        if (err) {
          return reject(err);
        }

        return resolve(derivedKey.toString('hex'));
      });
  });
}


/**
 * Compares 2 passwords to determine if they are same.
 * @param {String} password – password for compare 
 * @param {String} hashedPassowrd – hashing passowrd
 * @return {Boolean}
 */
async function comparePasswords(password, hashedPassowrd) {
  const comparedPassword = await hashPassword(password);
  return comparedPassword === hashedPassowrd;
}


/**
 * Creates random hash string with a given length.
 * 
 * @param {number} [length=10] 
 * @returns {Promise}
 */
function randomHash(length = 10) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(Math.floor(length / 2), (error, buf) => {
      if (error) {
        reject(error);
      } else {
        resolve(buf.toString('hex'));
      }
    });
  });
}


module.exports = {
  hashPassword,
  comparePasswords,
  randomHash,
};
