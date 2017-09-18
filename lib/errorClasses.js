/** @module errorClasses */

const _ = require('lodash');


/**
 * Creates new Error instance with custom `meta` property.
 * 
 * @class ValidationError
 * @extends {Error}
 */
class ValidationError extends Error {
  constructor(message) {
    super('Произошла ошибка при проверке запроса. ' +
      'Это могут быть недопустимые url-параметры или параметры запроса. ' +
      'Проверьте дополнительную информацию об ошибке для получения более подробной информации.');

    let meta = message;

    Object.defineProperty(this, 'meta', {
      set(value) {
        meta = value;
      },
      get() {
        return _.reduce(meta.array(), (metaObject, { location, param, msg }) => {
          if (!_.has(metaObject, location)) {
            _.assign(metaObject, { [location]: {} });
          }

          _.assign(metaObject[location], { [param]: msg });

          return metaObject;
        }, {});
      },
    });
  }
}

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


class ResponseError extends ApiError {}


module.exports = {
  ValidationError,
  ApiError,
  ResponseError,
};
