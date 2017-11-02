/** @module hash */

const express = require('express');
const _ = require('lodash');
const winston = require('winston');
const { ObjectID } = require('mongodb');
const { ResponseError } = require('../lib/errorClasses');
const { getInstance } = require('../databaseAdapter');
const { respondWithError } = require('../lib/response-utils');

const router = express.Router();


/**
 * Handler for HTTP GET method to `/:hash` route.
 */
router.get('/:hash', async (req, res) => {
  let col = null;
  let link = null;

  try {
    const db = await getInstance();

    col = db.collection('links');
    link = await col.findOne({ hash: req.params.hash }, {
      fields: { url: true, clicks: true },
    });

    if (_.isNull(link)) {
      throw new ResponseError('Ссылка не найдена.', 404);
    }

    const redirectUrl = _.startsWith(link.url, 'http') ? link.url : `http://${link.url}`;

    res.redirect(redirectUrl);
  } catch (error) {
    respondWithError(res, error);
  } finally {
    if (!_.isNull(col) && !_.isNull(link)) {
      const now = new Date();
      const year = now.getFullYear();
      let month = now.getMonth();
      month = month > 8 ? month + 1 : `0${month + 1}`;
      let day = now.getDate();
      day = day > 9 ? day : `0${day}`;
      const date = `${year}-${month}-${day}`;

      const clicksToday = _.get(link, `clicks.${date}`, 0);
      const update = {
        $set: {
          clicks: _.assign(link.clicks, { [date]: clicksToday + 1 }),
        },
      };

      try {
        await col.updateOne({ _id: new ObjectID(link._id) }, update);
      } catch (error) {
        winston.error(error); // or to log error another way.
      }
    }
  }
});


module.exports = router;
