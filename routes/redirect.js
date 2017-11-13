/** @module redirect */

const express = require('express');
const linkController = require('../controllers/link-controller');


const router = express.Router();


/**
 * GET request for redirecting to original url by hash.
 */
router.get('/:hash', async (req, res, next) => {
  try {
    const originalUrl = await linkController.updateLinkStatistics(req.params.hash);

    res.redirect(originalUrl);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
