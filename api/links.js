/** @module links */

const express = require('express');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { ValidationError, ApiError } = require('../lib/errorClasses');
const { authenticate, authorize, validate, parse } = require('../middlewares');
const { validationResult } = require('express-validator/check');
const { getInstance } = require('../databaseAdapter');
const { randomHash } = require('../lib/cryptoUtils');
const { respondWithError, respondWithSuccess } = require('../lib/responseUtils');

const router = express.Router();
const ALLOWED_FIELDS = ['url', 'tags', 'description'];
const OMITTED_FIELDS = ['clicks', 'author'];


/**
 * Handler for HTTP GET method to `/api/v1/links` route.
 */
router.get('/links', [
  parse.query.filter,
  parse.query.skipAndLimit,
  parse.query.sort,
], async (req, res) => {
  try {
    const { filter, skip, limit, sort } = req.query;
    const fields = _.reduce(
      OMITTED_FIELDS,
      (obj, field) => _.assign(obj, { [field]: false }),
      {},
    );
    const db = await getInstance();
    const col = db.collection('links');
    const getTotal = col.count(filter);
    const getLinks = col.find(filter, fields)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
    const total = await getTotal;
    const links = await getLinks;

    respondWithSuccess(res, { count: total, links });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP POST method to `/api/v1/links` route.
 */
router.post('/links', [
  authenticate,
  authorize(['staff', 'author']),
  validate.links.create,
], async (req, res) => {
  try {
    // Validates a request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { user } = req.auth;
    const link = _.reduce(
      ALLOWED_FIELDS,
      (obj, field) => _.assign(obj, { [field]: req.body[field] || null }),
      {},
    );

    // Define service fields.
    link.hash = await randomHash(6);
    link.author = user._id;
    link.clicks = {};
    link.createdAt = new Date();
    link.updatedAt = new Date();

    const db = await getInstance();
    const col = db.collection('links');
    const r = await col.insertOne(link);

    if (!_.eq(r.insertedCount, 1)) {
      throw ApiError('Произошла ошибка при сохранении ссылки в базу данных.');
    }

    respondWithSuccess(res, { link }, 201);
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP PUT method to `/api/v1/links` route.
 */
router.put('/links', [
  authenticate,
  authorize(['staff', 'author']),
  validate.users.update,
  parse.query.filter,
], async (req, res) => {
  try {
    // Validates a request id parameter and request body.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { user } = req.auth;
    const filter = _.defaults(
      { author: new ObjectID(user._id) },
      req.query.filter,
    );
    const update = _.reduce(
      ALLOWED_FIELDS,
      (obj, field) => (_.has(req.body, field) ? _.assign(obj, { [field]: req.body[field] }) : obj),
      {},
    );

    if (_.isEmpty(update)) {
      respondWithSuccess(res, { updatedCount: 0 });
    } else {
      update.updatedAt = new Date();

      const db = await getInstance();
      const col = db.collection('links');
      const r = await col.updateMany(filter, { $set: update });

      if (!_.eq(r.result.ok, 1)) {
        throw new ApiError('Произошла ошибка при обновлении ссылок в базе данных.');
      }

      respondWithSuccess(res, { updatedCount: r.modifiedCount });
    }
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP DELETE method to `/api/v1/links` route.
 */
router.delete('/links', [
  authenticate,
  authorize(['staff', 'author']),
  parse.query.filter,
], async (req, res) => {
  try {
    const { user } = req.auth;
    const filter = _.defaults(
      { author: new ObjectID(user._id) },
      req.query.filter,
    );
    const db = await getInstance();
    const col = db.collection('links');
    const r = await col.deleteMany(filter);

    if (!_.eq(r.result.ok, 1)) {
      throw new ApiError('Произошла ошибка при удалении ссылок из базы данных.');
    }

    respondWithSuccess(res, { deletedCount: r.deletedCount });
  } catch (error) {
    respondWithError(res, error.message);
  }
});


/**
 * Handler for HTTP GET method to `/api/v1/links/:id` to route.
 */
router.get('/links/:id', validate.general.mongoId, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const objectId = new ObjectID(req.params.id);
    const db = await getInstance();
    const col = db.collection('links');
    const doc = await col.findOne({ _id: objectId });

    if (_.isNull(doc)) {
      throw new ApiError('Ссылка не найдена.', 404);
    }

    respondWithSuccess(res, { link: _.omit(doc, OMITTED_FIELDS) });
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP PUT method to `/api/v1/links/:id` route.
 */
router.put('/links/:id', [
  authenticate,
  authorize(['staff', 'author']),
  validate.general.mongoId,
  validate.links.update,
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const update = _.reduce(
      ALLOWED_FIELDS,
      (obj, field) => (_.has(req.body, field) ? _.assign(obj, { [field]: req.body[field] }) : obj),
      {},
    );

    if (_.isEmpty(update)) {
      respondWithSuccess(res, { updatedCount: 0 });
    } else {
      update.updatedAt = new Date();

      const { user } = req.auth;
      const objectId = new ObjectID(req.params.id);
      const db = await getInstance();
      const col = db.collection('links');
      const doc = await col.findOne({ _id: objectId });

      if (_.isNull(doc)) {
        throw new ApiError('Ссылка не найдена.', 404);
      }

      if (!_.isEqual(doc.author, user._id)) {
        throw new ApiError('Недостаточно прав.', 403);
      }

      const r = await col.findOneAndUpdate(
        { _id: objectId },
        { $set: update },
        { returnOriginal: false },
      );

      if (!_.eq(r.ok, 1)) {
        throw new ApiError('Произошла ошибка при обновлении ссылки в базе данных.');
      }

      respondWithSuccess(res, { updatedCount: 1, link: r.value });
    }
  } catch (error) {
    respondWithError(res, error);
  }
});


/**
 * Handler for HTTP DELETE method to `/api/v1/links/:id` route.
 */
router.delete('/links/:id', [
  authenticate,
  authorize(['staff', 'author']),
  validate.general.mongoId,
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors);
    }

    const { user } = req.auth;
    const objectId = new ObjectID(req.params.id);
    const db = await getInstance();
    const col = db.collection('links');
    const doc = await col.findOne({ _id: objectId });

    if (_.isNull(doc)) {
      throw new ApiError('Ссылка не найдена.', 404);
    }

    if (!_.isEqual(doc.author, user._id)) {
      throw new ApiError('Недостаточно прав.', 403);
    }

    const r = await col.findOneAndDelete({ _id: objectId });

    if (!_.eq(r.ok, 1)) {
      throw new ApiError('Произошла ошибка при удалении ссылки из базы данных.');
    }

    respondWithSuccess(res, { deletedCount: 1 });
  } catch (error) {
    respondWithError(res, error);
  }
});


module.exports = router;
