/** @module handleErrors */

const { ValidationError, ApiError, ResponseError } = require('../lib/error-classes');


/**
 * Middleware for handling errors.
 *
 * @param {Object} error
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function handleErrors(error, req, res, next) {
  console.error(error);
  const code = 500;

  if (error instanceof ValidationError) {
    res.status(400).json({
      status: 'fail',
      data: {
        error: {
          message: error.message,
          meta: error.meta,
        },
      },
    });
  } else if (error instanceof ResponseError) {
    res.status(error.code || code).render('error.html', {
      code: error.code || code,
      message: error.message,
    });
  } else if (error instanceof ApiError) {
    res.status(error.code || code).json({
      status: 'error',
      data: {
        error: {
          message: error.message,
        },
      },
    });
  } else {
    res.status(code).json({
      status: 'error',
      data: {
        error: {
          message: 'Произошла внутренняя ошибка сервера.',
        },
      },
    });
  }
};
