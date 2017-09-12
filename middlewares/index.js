/** @module middlewares */

const parseWhereQueryParameter = require('./parseWhereQueryParameter');
const addPaginationObjectToRequest = require('./addPaginationObjectToRequest');
const addSortObjectToRequest = require('./addSortObjectToRequest');


module.exports = {
  parseWhereQueryParameter,
  addPaginationObjectToRequest,
  addSortObjectToRequest,
};
