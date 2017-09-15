/** @module general */

const { check } = require('express-validator/check');
const { MONGO_ID } = require('./errors');


exports.mongoId = check('id').isMongoId().withMessage(MONGO_ID);
