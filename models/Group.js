/** @module Group */

const { ObjectID } = require('mongodb');
const Base = require('./Base');


/**
 * Creates a new Group model instance.
 * If arguments wasn't given, sets properties to default values.
 * If arguments it is a js object, property values sets from the given object.
 * 
 * @class Group
 * @extends {Base}
 */
class Group extends Base {
  /**
   * Returns object which contains model fields definitions.
   * 
   * @readonly
   * @static
   * @memberof Group
   */
  static get fields() {
    return {
      ...super.fields,
      name: String,
      pluralName: String,
      isDefault: Boolean,
      users: {
        type: Array,
        index: true,
      },
    };
  }


  /**
   * Returns an initial data for inserting to collection.
   * 
   * @readonly
   * @static
   * @memberof Group
   */
  static get initialData() {
    const adminGroupId = new ObjectID();
    return [{
      _id: adminGroupId,
      _acl: {
        [adminGroupId]: {
          w: true,
          r: true,
        },
      },
      name: 'Администратор',
      pluralName: 'Администраторы',
      isDefault: false,
      users: [],
    }, {
      _acl: {
        [adminGroupId]: {
          w: true,
          r: true,
        },
      },
      name: 'Автор',
      pluralName: 'Авторы',
      isDefault: true,
      users: [],
    }];
  }


  /**
   * Adds an user to default group. Returns a promise which resolves
   * if user was added successfully.
   * 
   * @static
   * @param {any} user – An instance of User model.
   * @memberof Group
   */
  static async addUserToDefaultGroup(user) {
    const collection = await this.getCollection();
    await collection.findOneAndUpdate({ isDefault: true }, {
      $push: {
        users: user._id,
      },
    });
  }


  /**
   * Removes user from default group. Returns a promise which resolves
   * if user was removed successfully.
   * 
   * @static
   * @param {any} user 
   * @memberof Group
   */
  static async removeUserFromDefaultGroup(user) {
    const collection = await this.getCollection();
    await collection.findOneAndUpdate({ isDefault: true }, {
      $pull: {
        users: user._id,
      },
    });
  }
}

module.exports = Group;
