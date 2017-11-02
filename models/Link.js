/** @module Link */

const Base = require('./Base');
const { keyFromDate } = require('../lib/utils');


/**
 * Creates a new Link model instance.
 * If arguments wasn't given, sets properties to default values.
 * If arguments it is a js object, property values sets from the given object.
 * By default _acl propety has read permissions for all users.
 * 
 * @class Link
 * @extends {Base}
 */
class Link extends Base {
  /**
   * Returns object which contains model fields definitions.
   * 
   * @readonly
   * @static
   * @memberof Link
   */
  static get fields() {
    return {
      ...super.fields,
      _acl: {
        type: Object,
        default: {
          '*': {
            w: false,
            r: true,
          },
        },
      },
      url: String,
      tags: {
        type: Array,
        index: true,
      },
      description: String,
      hash: {
        type: String,
        index: true,
      },
      clicks: Object,
    };
  }


  /**
   * Updates number of clicks for current date.
   * 
   * @memberof Link
   */
  async updateStatistics() {
    const key = keyFromDate();

    if (this.clicks[key]) {
      this.clicks[key] += 1;
    } else {
      this.clicks[key] = 1;
    }

    await this.update();
  }
}


module.exports = Link;
