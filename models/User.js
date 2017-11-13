/** @module User */

const config = require('getconfig');
const jwt = require('jsonwebtoken');
const { get, isEqual } = require('lodash');
const AbstractModel = require('./abstract-model');
const { hashPassword } = require('../lib/crypto-utils');


/**
 * Creates a new User model instance.
 *
 * @class
 * @augments AbstractModel
 */
class User extends AbstractModel {
  static get schema() {
    return {
      group: {
        type: 'enum',
        enum: this.groups,
        default: this.groups[1],
      },
      username: {
        type: 'string',
        index: true,
        default: '',
        required: true,
        pattern: /^[a-z0-9_-]+$/i,
      },
      email: {
        type: 'email',
        required: true,
      },
      password: {
        type: 'string',
        required: true,
        range: {
          min: 8,
        },
      },
      firstName: {
        type: 'string',
        index: true,
      },
      lastName: {
        type: 'string',
      },
      birthDate: {
        type: 'date',
      },
      gender: {
        type: 'enum',
        enum: ['male', 'female'],
      },
      isActive: {
        type: 'boolean',
        default: true,
      },
    };
  }


  static get groups() {
    return ['admin', 'user', 'guest'];
  }


  static get permissions() {
    const [admin, user, guest] = this.groups;
    return {
      [admin]: {
        users: {
          create: true,
          view: true,
          edit: true,
          delete: true,
        },
        links: {
          create: true,
          view: true,
          edit: true,
          delete: true,
        },
      },
      [user]: {
        users: {
          self: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        links: {
          create: true,
          view: true,
          edit: true,
          delete: true,
        },
      },
      [guest]: {
        links: {
          view: true,
        },
      },
    };
  }


  /**
   * Checks if passed users is the same.
   *
   * @param {User} user1
   * @param {User} user2
   * @returns {Boolean}
   */
  static isEqual(user1, user2) {
    return isEqual(user1._id, user2._id);
  }


  static async updateAll({
    filter = {},
    update = {},
  } = {}) {
    if ('password' in update) {
      const hashedPassword = await hashPassword(update.password);
      await super.updateAll({
        filter,
        update: Object.assign(update, { password: hashedPassword }),
      });
    } else {
      await super.updateAll({ filter, update });
    }
  }


  get isAdmin() {
    return this.group === this.constructor.groups[0];
  }


  get isUser() {
    return this.group === this.constructor.groups[1];
  }


  get isGuest() {
    return this.group === this.constructor.groups[2];
  }


  /**
   * Returns true if user has at least one permission from a given permissions list.
   *
   * @param {Array} permissions
   * @returns {Boolean}
   */
  hasPermission(permissions = []) {
    return permissions.some(
      permission => get(this.constructor.permissions, `${this.group}.${permission}`, false),
    );
  }


  /**
   * Creates and returns new jwt token for user using user id.
   *
   * @returns {Promise}
   */
  async generateJwtToken() {
    return new Promise((resolve, reject) => {
      jwt.sign({ id: this._id }, config.secret, config.jwt, (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      });
    });
  }


  /**
   * Checks if a submitted password is correct.
   *
   * @param {String} password
   * @returns {Promise.<Boolean>}
   */
  async checkPassword(password) {
    const hashedSubmittedPassword = await hashPassword(password);
    return this.password === hashedSubmittedPassword;
  }


  /**
   * Hashes password if password was modified.
   *
   * @returns {Promise.<void>}
   */
  async encryptPassword() {
    const passwordModified = await this.isModified('password');

    if (passwordModified) {
      this.password = await hashPassword(this.password);
    }
  }


  async save() {
    await this.encryptPassword();
    await super.save();
  }


  async update(update = {}) {
    if ('password' in update) {
      this.password = update.password;
    }

    await this.encryptPassword();
    await super.update(update);
  }


  toObject() {
    const object = super.toObject();

    delete object.password;
    return object;
  }
}


module.exports = User;
