/** @module responseUtils */


/**
 * Generic error handler used by all api endpoints.
 * 
 * @param {Object} res – Express response object.
 * @param {any} data – response payload.
 * @param {number} [code=500] 
 */
function respondWithError(res, data, code = 500) {
  res.status(code).json({ status: 'error', data });
}

/**
 * Generic fail handler used by all api endpoints.
 * 
 * @param {Object} res - Express respsone object.
 * @param {any} data – response payload.
 * @param {number} [code=400] 
 */
function respondWithFail(res, data, code = 400) {
  res.status(code).json({ status: 'fail', data });
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
  respondWithFail,
  respondWithSuccess,
};
