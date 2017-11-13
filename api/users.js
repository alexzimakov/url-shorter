/** @module users */

const express = require('express');
const userController = require('../controllers/user-controller');
const { ApiError } = require('../lib/error-classes');
const { authenticate, authorize, parseQuery } = require('../middlewares');

const router = express.Router();


/**
 * GET request for getting a list of users.
 */
router.get('/users', [
  authenticate,
  authorize('users.view'),
  parseQuery('filter', 'skip', 'limit', 'sort'),
], async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: await userController.getMany(req.query),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST request for creating new user.
 */
router.post('/users', async (req, res, next) => {
  try {
    res.status(201).json({
      status: 'success',
      data: await userController.register(req.body),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * PUT request for updating multiple users.
 */
router.put('/users', [
  authenticate,
  authorize('users.edit'),
  parseQuery('filter'),
], async (req, res, next) => {
  try {
    await userController.updateMany(req.query.filter, req.body);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});


/**
 * DELETE request for deleting multiple users.
 */
router.delete('/users', [
  authenticate,
  authorize('users.delete'),
  parseQuery('filter'),
], async (req, res, next) => {
  try {
    await userController.deleteMany(req.query.filter);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});


/**
 * GET request for getting single user by id.
 */
router.get('/users/:id', [
  authenticate,
  authorize('users.view', 'users.self.view'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
    };
    res.json({
      status: 'success',
      data: await userController.getOne(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * PUT request for updating single user by id.
 */
router.put('/users/:id', [
  authenticate,
  authorize('users.edit', 'users.self.edit'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
      update: req.body,
    };
    res.json({
      status: 'success',
      data: await userController.updateOne(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * DELETE request for deleting single user by id.
 */
router.delete('/users/:id', [
  authenticate,
  authorize('users.delete', 'users.self.delete'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
    };
    res.json({
      status: 'success',
      data: await userController.deleteOne(context),
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
