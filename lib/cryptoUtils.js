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


/**
 * Creates json web token with given payload.
 * 
 * @param {any} [payload={}] 
 * @returns {Promise}
 */
function createToken(payload = {}) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.secret, config.jwt, (error, token) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
  });
}


module.exports = {
  hashPassword,
  comparePasswords,
  randomHash,
  createToken,
};
