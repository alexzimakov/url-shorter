/** @module responseUtils */

const winston = require('winston');
const { ValidationError, ApiError, ResponseError } = require('../lib/errorClasses');

/**
 * Generic error handler used by all api endpoints.
 * 
 * @param {Object} res – Express response object.
 * @param {Object} error – response payload.
 * @param {number} [code=500] 
 */
function respondWithError(res, error, code = 500) {
  winston.error(error);

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
}


/**
 * Generic success handler used by all api endpoints.
 * 
 * @param {Object} res – Express response object.
 * @param {any} data – response payload.
 * @param {number} [code=200] 
 */
function respondWithSuccess(res, data, code = 200) {
  res.status(code).json({ status: 'success', data });
}


module.exports = {
  respondWithError,
  respondWithSuccess,
};
