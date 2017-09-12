/** @module middlewares */

const parseFilterQueryParameter = require('./parseFilterQueryParameter');
const addPaginationObjectToRequest = require('./addPaginationObjectToRequest');
const parseSortQueryParameter = require('./parseSortQueryParameter');


module.exports = {
  parseFilterQueryParameter,
  addPaginationObjectToRequest,
  parseSortQueryParameter,
};
