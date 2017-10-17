/** @module User */

const Base = require('./Base');
const { hashPassword } = require('../lib/cryptoUtils');


/**
 * 
 * 
 * @class User
 * @extends {Base}
 */
class User extends Base {
  constructor({
    username,
    email,
    password,
    firstName,
    lastName,
    birthDate,
    gender,
    isActive = true,
  }) {
    super();

    this._acl = {
      [this._id]: {
        r: true,
        w: true,
      },
    };
    this.username = username;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthDate = birthDate;
    this.gender = gender;
    this.isActive = isActive;
  }


  /**
   * 
   * 
   * @readonly
   * @static
   * @memberof User
   */
  static get collection() {
    return 'users';
  }


  /**
   * 
   * 
   * @readonly
   * @static
   * @memberof User
   */
  static get indexes() {
    return ['username'];
  }


  /**
   * 
   * 
   * @param {String} password 
   * @returns {Promise}
   * @memberof User
   */
  async setPassword(password) {
    try {
      const hashedPassword = await hashPassword(password || this.password);
      Object.assign(this, { password: hashedPassword });
    } catch (error) {
      throw error;
    }
  }


  /**
   * 
   * 
   * @returns {Promise}
   * @memberof User
   */
  async save() {
    try {
      await this.setPassword();
      await super.save();
    } catch (error) {
      throw error;
    }
  }


  /**
   * 
   * 
   * @returns {Promise}
   * @memberof User
   */
  async update(update) {
    try {
      delete this.password;
      await super.update(update);
    } catch (error) {
      throw error;
    }
  }


  /**
   * 
   * 
   * @returns {Object}
   * @memberof User
   */
  toJson() {
    const target = super.toJson();

    delete target.password;

    return target;
  }
}


module.exports = User;
