/** @module GuestUser */

const User = require('./user');


/**
 * Creates new GuestUser instance.
 *
 * @class
 * @augments User
 */
class GuestUser extends User {
  constructor() {
    super();

    this._id = null;
    this.group = 'guest';
    this.isActive = false;
  }
}

module.exports = GuestUser;
