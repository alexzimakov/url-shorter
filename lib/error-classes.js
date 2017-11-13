/** @module errorClasses */

/**
 * Creates new Error instance with custom `meta` property.
 * 
 * @class
 * @augments Error
 */
class ValidationError extends Error {
  constructor(message) {
    super('Произошла ошибка при проверке запроса. ' +
      'Это могут быть недопустимые url-параметры или параметры запроса. ' +
      'Проверьте дополнительную информацию об ошибке для получения более подробной информации.');

    this.meta = Object.entries(message).reduce((meta, [attr, errors]) => {
      let messages = '';

      if (errors.length === 1) {
        messages = errors[0].message;
      }

      if (errors.length > 1) {
        messages = errors.map(error => error.message);
      }

      return { ...meta, [attr]: messages };
    }, {});
  }
}

/**
 * Creates new Error instance with custom `code` property.
 * 
 * @class
 * @augments Error
 */
class ApiError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}


class ResponseError extends ApiError {}


module.exports = {
  ValidationError,
  ApiError,
  ResponseError,
};
