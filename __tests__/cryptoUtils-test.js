const winston = require('winston');
const config = require('getconfig');
const crypto = require('crypto');
const { hashPassword, comparePasswords } = require('../lib/cryptoUtils');

const password = 'secret';
let hashedPassword = null;


beforeAll(() => new Promise((resolve, reject) => {
  crypto.pbkdf2(
    password,
    config.salt,
    config.crypto.iterations,
    config.crypto.keylen,
    config.crypto.algorithm,
    (err, derivedKey) => {
      if (err) {
        winston.error(err);
        return reject(err);
      }

      hashedPassword = derivedKey.toString('hex');
      return resolve();
    });
}),
);


describe('Crypto utils', () => {
  test('should returns hashed password', async () => {
    const pass = await hashPassword(password);
    expect(pass).toBe(hashedPassword);
  });

  test('should return true for identical passwords', async () => {
    const compareResult = await comparePasswords(password, hashedPassword);
    expect(compareResult).toBe(true);
  });
});
