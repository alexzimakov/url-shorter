/** @module Link */

const { isEqual } = require('lodash');
const AbstractModel = require('./abstract-model');
const { keyFromDate } = require('../lib/utils');
const { randomHash } = require('../lib/crypto-utils');


/**
 * Creates a new Link model instance.
 * 
 * @class
 * @augments AbstractModel
 */
class Link extends AbstractModel {
  static get schema() {
    return {
      originalUrl: {
        type: 'url',
        required: true,
      },
      hash: {
        type: 'hex',
        index: true,
        required: true,
        default: randomHash(6),
      },
      author: {
        type: 'object',
        required: true,
      },
      tags: {
        type: 'array',
        index: true,
      },
      description: {
        type: 'string',
      },
      clicks: {
        type: 'object',
      },
    };
  }


  /**
   * Checks if a given user is author of link.
   *
   * @param {User} user
   * @returns {Boolean}
   */
  isAuthor(user) {
    return isEqual(user._id, this.author);
  }


  /**
   * Updates number of clicks for current date.
   *
   * @returns {Promise.<void>}
   */
  async updateStatistics() {
    const key = keyFromDate();

    if (key in this.clicks) {
      this.clicks[key] += 1;
    } else {
      this.clicks[key] = 1;
    }

    await super.update();
  }
}


module.exports = Link;
