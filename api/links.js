/** @module links */

const express = require('express');
const linkController = require('../controllers/link-controller');
const { authenticate, authorize, parseQuery } = require('../middlewares');

const router = express.Router();


/**
 * GET request for getting list of links.
 */
router.get('/links', [
  authenticate,
  authorize('links.view'),
  parseQuery('filter', 'skip', 'limit', 'sort'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      query: req.query,
    };

    res.json({
      status: 'success',
      data: await linkController.getMany(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST request for creating new link.
 */
router.post('/links', [
  authenticate,
  authorize('links.create'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      data: req.body,
    };

    res.json({
      status: 'success',
      data: await linkController.create(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * PUT request for updating multiple links.
 */
router.put('/links', [
  authenticate,
  authorize('links.edit'),
  parseQuery('filter'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      filter: req.query.filter,
      update: req.body,
    };

    await linkController.updateMany(context);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});


/**
 * DELETE request for deleting multiple links.
 */
router.delete('/links', [
  authenticate,
  authorize('links.delete'),
  parseQuery('filter'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      filter: req.query.filter,
    };

    await linkController.deleteMany(context);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});


/**
 * GET request for getting single link by id.
 */
router.get('/links/:id', [
  authenticate,
  authorize('links.view'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
    };

    res.json({
      status: 'success',
      data: await linkController.getOne(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * PUT request for updating single link by id.
 */
router.put('/links/:id', [
  authenticate,
  authorize('links.edit'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
      update: req.body,
    };

    res.json({
      status: 'success',
      data: await linkController.updateOne(context),
    });
  } catch (error) {
    next(error);
  }
});


/**
 * DELETE request for deleting single link by id.
 */
router.delete('/links/:id', [
  authenticate,
  authorize('links.delete'),
], async (req, res, next) => {
  try {
    const context = {
      authUser: req.user,
      id: req.params.id,
    };

    await linkController.deleteOne(context);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
