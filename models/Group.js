/** @module Group */

const Base = require('./Base');


class Group extends Base {
  constructor({ name, pluralName, isDefault, users }) {
    super();

    this.name = name;
    this.pluralName = pluralName;
    this.isDefault = isDefault;
    this.users = users;
  }


  static get collection() {
    return 'groups';
  }


  static get indexes() {
    return ['users'];
  }

  static get initialData() {
    return [{
      name: 'Администратор',
      pluralName: 'Администраторы',
      isDefault: false,
      users: [],
    }, {
      name: 'Автор',
      pluralName: 'Авторы',
      isDefault: true,
      users: [],
    }];
  }

  static async addUserToDefaultGroup(user) {
    const collection = await this.getCollection();
    await collection.findOneAndUpdate({ isDefault: true }, {
      $push: {
        users: user._id,
      },
    });
  }


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
