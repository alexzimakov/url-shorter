/** @module users */

const config = require('getconfig');
const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');
const { getInstance } = require('../databaseAdapter');
const { hashPassword } = require('../lib/cryptoUtils');
const { validationResult } = require('express-validator/check');
const { authenticate, validate } = require('../middlewares');
const {
  parseFilterQueryParameter,
  parseSkipAndLimitQueryParameters,
  parseSortQueryParameter,
} = require('../middlewares');
const ValidationError = require('../lib/ValidationError');
const ApiError = require('../lib/ApiError');
const { respondWithError, respondWithSuccess } = require('../lib/responseUtils');


const router = express.Router();
const ALLOW_FIELDS = [
  'username',
  'email',
  'password',
  'firstName',
  'lastName',
  'gender',
  'birthDate',
];
const OMIT_FIELDS = ['password'];


/**
 * Middleware for all HTTP methods to `/api/v1/users` route.
 */
router.all('/users', async (req, res, next) => {
  try {
    const db = await getInstance();
    const col = db.collection('users');
    const usernameIndexExists = await col.indexExists('username_1');

    if (!usernameIndexExists) {
      await col.createIndex({ username: 1 });
    }

    next();
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP GET method to `/api/v1/users` route.
 */
router.get('/users', [
  authenticate,
  parseFilterQueryParameter,
  parseSkipAndLimitQueryParameters,
  parseSortQueryParameter,
], async (req, res) => {
  try {
    const { filter, skip, limit, sort, fields: queryFields = [] } = req.query;
    const fields = _.isEmpty(queryFields)
      ? _.reduce(OMIT_FIELDS, (obj, field) => _.assign(obj, { [field]: false }), {})
      : _.reduce(
        _.difference(queryFields, OMIT_FIELDS),
        (obj, field) => _.assign(obj, { [field]: true }),
        {},
      );
    const db = await getInstance();
    const col = db.collection('users');
    const count = await col.count(filter);
    const users = await col.find(filter, fields)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();

    respondWithSuccess(res, { total: count, users });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP POST method to `/api/v1/users` route.
 */
router.post('/users', validate.users.create, async (req, res) => {
  try {
    // Validates a request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const user = _.reduce(
      ALLOW_FIELDS,
      (obj, field) => _.assign(obj, { [field]: req.body[field] || null }),
      {},
    );

    // Hashes password.
    user.password = await hashPassword(user.password);
    // Defines service fields.
    user.isActive = true;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    const db = await getInstance();
    const col = db.collection('users');
    const r = await col.insertOne(user);

    if (!_.eq(r.insertedCount, 1)) {
      throw ApiError('Произошла ошибка при записи пользователя в базу данных.');
    }

    // Create jwt token.
    const token = jwt.sign({ id: user._id }, config.secret, config.jwt);

    respondWithSuccess(
      res,
      {
        authData: { token },
        user: _.omit(user, OMIT_FIELDS),
      },
      201,
    );
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP PUT method to `/api/v1/users` route.
 */
router.put('/users', [
  authenticate,
  validate.users.update,
  parseFilterQueryParameter,
], async (req, res) => {
  try {
    // Validates a request id parameter and request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { filter } = req.query;
    const update = _.reduce(
      ALLOW_FIELDS,
      (obj, field) => (_.has(req.body, field) ? _.assign(obj, { [field]: req.body[field] }) : obj),
      {},
    );

    if (_.isEmpty(update)) {
      respondWithSuccess(res, { updatedCount: 0 });
    } else {
      if (_.has(update, 'password')) {
        update.password = await hashPassword(update.password);
      }

      if (_.has(update, 'birthDate')) {
        update.birthDate = new Date(update.birthDate);
      }

      update.updatedAt = new Date();

      const db = await getInstance();
      const col = db.collection('users');
      const r = await col.updateMany(filter, { $set: update });

      if (!_.eq(r.result.ok, 1)) {
        throw new ApiError('Произошла ошибка при обновлении пользователя в базе данных.');
      }

      respondWithSuccess(res, { updatedCount: r.modifiedCount });
    }
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP DELETE method to `/api/v1/users` route.
 */
router.delete('/users', [
  authenticate,
  parseFilterQueryParameter,
], async (req, res) => {
  try {
    const { filter } = req.query;
    const db = await getInstance();
    const col = db.collection('users');
    const r = await col.deleteMany(filter);

    if (!_.eq(r.result.ok, 1)) {
      throw new ApiError('Произошла ошибка при удалении пользователей из базы данных.');
    }

    respondWithSuccess(res, { deletedCount: r.deletedCount });
  } catch (error) {
    respondWithError(res, error.message);
  }
});


/**
 * Handler for HTTP GET method to `/api/v1/users/:id` route.
 */
router.get('/users/:id', [
  authenticate,
  validate.general.mongoId,
], async (req, res) => {
  try {
    // Validates a request id parameter.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const objectId = new ObjectID(req.params.id);
    const db = await getInstance();
    const col = db.collection('users');
    const doc = await col.findOne({ _id: objectId });

    if (_.isNull(doc)) {
      throw new ApiError('Пользователь не найден', 404);
    }

    respondWithSuccess(res, { user: _.omit(doc, OMIT_FIELDS) });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP POST method to `/api/v1/users/:id` route.
 */
router.post('/users/:id', (req, res) => {
  respondWithError(
    res,
    new ApiError('Метод не поддерживается', 405),
  );
});


/**
 * Handler for HTTP PUT method to `/api/v1/users/:id` route.
 */
router.put('/users/:id', [
  authenticate,
  validate.general.mongoId,
  validate.users.update,
], async (req, res) => {
  try {
    // Validates a request id parameter and request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const update = _.reduce(
      ALLOW_FIELDS,
      (obj, field) => (_.has(req.body, field) ? _.assign(obj, { [field]: req.body[field] }) : obj),
      {},
    );

    if (_.has(update, 'password')) {
      update.password = await hashPassword(update.password);
    }

    if (_.has(update, 'birthDate')) {
      update.birthDate = new Date(update.birthDate);
    }

    update.updatedAt = new Date();

    const db = await getInstance();
    const col = db.collection('users');
    const r = await col.findOneAndUpdate({ _id: new ObjectID(req.params.id) },
      { $set: update },
      { returnOriginal: false },
    );

    if (!_.eq(r.ok, 1)) {
      throw new ApiError('Произошла ошибка при обновлении пользователя в базе данных.');
    }

    if (_.isNull(r.value)) {
      throw new ApiError('Пользователь не найден', 404);
    }

    respondWithSuccess(res, { user: _.omit(r.value, OMIT_FIELDS) });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP DELETE method to `/api/v1/users/:id` route.
 */
router.delete('/users/:id', [
  authenticate,
  validate.general.mongoId,
], async (req, res) => {
  try {
    // Validates a request id parameter.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const objectId = new ObjectID(req.params.id);
    const db = await getInstance();
    const col = db.collection('users');
    const r = await col.findOneAndDelete({ _id: objectId });

    if (!_.eq(r.ok, 1)) {
      throw new ApiError('При удалении пользователя из базы данных произошла ошибка.');
    }

    if (_.isNull(r.value)) {
      throw new ApiError('Пользователь не найден.', 404);
    }

    respondWithSuccess(res);
  } catch (error) {
    respondWithError(res, error);
  }
});


module.exports = router;
