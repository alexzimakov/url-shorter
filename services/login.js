/** @module login */

const express = require('express');
const _ = require('lodash');
const { ValidationError, ApiError } = require('../lib/error-classes');
const { getInstance } = require('../databaseAdapter');
const { validate } = require('../middlewares');
const { validationResult } = require('express-validator/check');
const { respondWithError, respondWithSuccess } = require('../lib/response-utils');
const { comparePasswords, createToken } = require('../lib/cryptoUtils');

const router = express.Router();

router.post('/login', validate.services.login, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { username, password } = req.body;
    const db = await getInstance();
    const col = db.collection('users');
    const user = await col.findOne({ username });

    if (_.isNull(user)) {
      throw new ApiError('Пользователь с таким логином на найден.', 404);
    }

    const compareResult = await comparePasswords(password, user.password);

    if (!compareResult) {
      throw new ApiError('Неправильно введён пароль.', 400);
    }

    const token = await createToken({ id: user._id });

    respondWithSuccess(res, {
      authData: {
        token,
      },
      user: _.omit(user, ['password']),
    });
  } catch (error) {
    respondWithError(res, error);
  }
});


module.exports = router;
