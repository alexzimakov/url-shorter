/** @module parseQuery */

const parseFilterParam = require('./parse-filter-param');
const parseSkipParam = require('./parse-skip-param');
const parseLimitParam = require('./parse-limit-param');
const parseSortParam = require('./parse-sort-param');

/**
 * Returns array of parsers for query parameters.
 *
 * @param params
 */
function parseQuery(...params) {
  const paramParsers = {
    filter: parseFilterParam,
    skip: parseSkipParam,
    limit: parseLimitParam,
    sort: parseSortParam,
  };
  return params
    .filter(param => param in paramParsers)
    .map(param => paramParsers[param]);
}


module.exports = parseQuery;
