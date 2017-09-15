/** @module general */

const { ObjectID } = require('mongodb');
const { check } = require('express-validator/check');
const { MONGO_ID } = require('./errorMessages');


exports.mongoId = check('id')
  .custom(value => ObjectID.isValid(value))
  .withMessage(MONGO_ID);
