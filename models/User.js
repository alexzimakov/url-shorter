/** @module User */

const Base = require('./Base');
const { hashPassword } = require('../lib/cryptoUtils');


/**
 * Creates a new User model instance.
 * If arguments wasn't given, sets properties to default values.
 * If arguments it is a js object, property values sets from the given object.
 * _acl property by default has read and write permissions for that user.
 * 
 * @class User
 * @extends {Base}
 */
class User extends Base {
  /**
   * Returns object which contains model fields definitions.
   * 
   * @readonly
   * @static
   * @memberof User
   */
  static get fields() {
    return {
      ...super.fields,
      _acl: {
        type: Object,
        default(instance) {
          return {
            [instance._id]: {
              w: true,
              r: true,
            },
          };
        },
      },
      username: {
        type: String,
        index: true,
      },
      email: String,
      password: String,
      firstName: String,
      lastName: String,
      birthDate: Date,
      gender: String,
      isActive: {
        type: Boolean,
        default: true,
      },
    };
  }


  /**
   * Sets a new password for user which is presented by model instance.
   * 
   * @param {String} password – Raw password.
   * @returns {Promise}
   * @memberof User
   */
  async setPassword(password) {
    const hashedPassword = await hashPassword(password || this.password);
    Object.assign(this, { password: hashedPassword });
  }


  /**
   * Saves a user to database.
   * Calls this.setPassword before saving.
   * 
   * @returns {Promise}
   * @memberof User
   * @override
   */
  async save() {
    await this.setPassword();
    await super.save();
  }


  /**
   * Updates an user data in database.
   * 
   * @returns {Promise}
   * @memberof User
   * @override
   */
  async update(update) {
    const updateWithoutPassword = Object.assign({}, update);

    delete updateWithoutPassword.password;
    delete this.password;
    await super.update(updateWithoutPassword);
  }


  /**
   * Returns an object version of the User model instance.
   * 
   * @returns {Object}
   * @memberof User
   * @override
   */
  toObject() {
    const target = super.toObject();

    delete target.password;
    return target;
  }
}


module.exports = User;
