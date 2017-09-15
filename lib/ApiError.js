/** @module ApiError */


/**
 * Creates new Error instance with custom `code` property.
 * 
 * @class ApiError
 * @extends {Error}
 */
class ApiError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}


module.exports = ApiError;
