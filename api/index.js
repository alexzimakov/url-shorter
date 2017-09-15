/** @module api */

const express = require('express');
const users = require('./users');

const router = express.Router();

router.use(users);


module.exports = router;
