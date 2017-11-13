/** @module login */

const express = require('express');
const userController = require('../controllers/user-controller');

const router = express.Router();


/**
 * Handler for HTTP POST to `/services/login` route.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    res.json({
      status: 'success',
      data: await userController.login(username, password),
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
