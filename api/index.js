/** @module api */

const express = require('express');
const users = require('./users');
const links = require('./links');

const router = express.Router();

router.use(users);
router.use(links);


module.exports = router;
