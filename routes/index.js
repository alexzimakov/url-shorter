/** @module routes */

const express = require('express');
const hash = require('./redirect');

const router = express.Router();
router.use(hash);


module.exports = router;
