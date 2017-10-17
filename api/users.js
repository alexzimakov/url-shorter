/** @module users */

const express = require('express');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { ValidationError, ApiError } = require('../lib/errorClasses');
const { authenticate, authorize, validate, parse } = require('../middlewares');
const Group = require('../models/Group');
const User = require('../models/User');
const { validationResult } = require('express-validator/check');
const { getInstance } = require('../databaseAdapter');
const { hashPassword, createToken } = require('../lib/cryptoUtils');
const { respondWithError, respondWithSuccess } = require('../lib/responseUtils');


const router = express.Router();
const ALLOWED_FIELDS = [
  'username',
  'email',
  'password',
  'firstName',
  'lastName',
  'gender',
  'birthDate',
];
const OMITTED_FIELDS = ['password'];


/**
 * Handler for HTTP GET method to `/api/v1/users` route.
 */
router.get('/users', [
  parse.query.filter,
  parse.query.skipAndLimit,
  parse.query.sort,
], async (req, res) => {
  try {
    const { filter, skip, limit, sort } = req.query;
    const count = await User.count(filter);
    const users = await User.values({ filter, skip, limit, sort });

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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    await user.save();
    await Group.addUserToDefaultGroup(user);

    const token = await createToken({ id: user._id });

    respondWithSuccess(
      res,
      {
        authData: { token },
        user: user.toJson(),
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
  authorize('staff'),
  validate.users.update,
  parse.query.filter,
], async (req, res) => {
  try {
    // Validates a request id parameter and request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { filter } = req.query;
    const update = _.reduce(
      ALLOWED_FIELDS,
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
  authorize('staff'),
  parse.query.filter,
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
 * Middlewares for all HTTP methods to `/api/v1/users/:id` route.
 */
router.use('/users/:id', [
  authenticate,
  authorize(['staff', 'author']),
  (req, res, next) => {
    const { role, _id } = req.auth.user;

    /**
     * User with role `author` can edit only himself.
     * But if user has role `staff` he can manage other users.
     */
    if (_.eq(role, 'author') && !_.eq(_id.toString(), req.params.id)) {
      respondWithError(res, new ApiError('Недостаточно прав.', 403));
    } else {
      next();
    }
  },
  validate.general.mongoId,
]);


/**
 * Handler for HTTP GET method to `/api/v1/users/:id` route.
 */
router.get('/users/:id', async (req, res) => {
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

    respondWithSuccess(res, { user: _.omit(doc, OMITTED_FIELDS) });
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
router.put('/users/:id', validate.users.update, async (req, res) => {
  try {
    // Validates a request id parameter and request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const update = _.reduce(
      ALLOWED_FIELDS,
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

    respondWithSuccess(res, { updatedCount: 1, user: _.omit(r.value, OMITTED_FIELDS) });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP DELETE method to `/api/v1/users/:id` route.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    // Validates user permissions.
    if (_.eq(req.auth.user.role, 'author') && !_.eq(req.auth.user._id.toString(), req.params.id)) {
      throw new ApiError('Недостаточно прав.', 403);
    }

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

    respondWithSuccess(res, { deletedCount: 1 });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP GET method to `/api/v1/users/:id/links` route.
 */
router.get('/users/:id/links', [
  parse.query.filter,
  parse.query.skipAndLimit,
  parse.query.sort,
], async (req, res) => {
  try {
    const filter = _.defaults(
      { author: req.auth.user._id },
      req.query.filter,
    );
    const { skip, limit, sort } = req.query;
    const db = await getInstance();
    const col = db.collection('links');
    const getCount = col.count(filter);
    const getLinks = col.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
    const count = await getCount;
    const links = await getLinks;

    respondWithSuccess(res, { count, links });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP GET method to `/api/v1/users/:userId/links/:linkId` route.
 */
router.get('/users/:userId/links/:linkId', async (req, res) => {
  try {
    const { user } = req.auth;
    const userObjectId = new ObjectID(req.params.userId);
    const linkObjectId = new ObjectID(req.params.linkId);

    const db = await getInstance();
    const col = db.collection('links');
    const link = await col.findOne({ _id: linkObjectId });

    if (_.isNull(link)) {
      throw new ApiError('Ссылка не найдена.', 404);
    }

    if (!_.isEqual(user._id, link.author, userObjectId)) {
      throw new ApiError('Недостаточно прав.', 403);
    }

    respondWithSuccess(res, { link });
  } catch (error) {
    respondWithError(res, error);
  }
});


module.exports = router;
