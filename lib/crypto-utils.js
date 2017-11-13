/** @module hashPassword */

const config = require('getconfig');
const jwt = require('jsonwebtoken');
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
 * Creates random hash string with a given length.
 * @param {Number} length
 * @returns {String}
 */
function randomHash(length = 10) {
  return crypto.randomBytes(Math.floor(length / 2)).toString('hex');
}


/**
 * Verifies a given token. Returns a promise.
 * Promise is resolved with a payload if token is valid.
 *
 * @param token
 * @returns {Promise}
 */
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.secret, config.jwt, (error, payload) => {
      if (error) {
        reject(error);
      } else {
        resolve(payload);
      }
    });
  });
}


module.exports = {
  hashPassword,
  randomHash,
  verifyToken,
};
