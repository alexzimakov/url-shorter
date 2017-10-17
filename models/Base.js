const config = require('getconfig');
const { ObjectID } = require('mongodb');
const DatabaseAdapter = require('../lib/database-adapter');

const databaseAdapter = new DatabaseAdapter();

class Base {
  constructor() {
    this._id = new ObjectID();
    this._acl = {};
  }


  /**
   * Returns a collection instance for model class.
   * 
   * @static
   * @returns {Promise} – A promise that resolves with a collection instance.
   * @memberof Base
   */
  static async getCollection() {
    const database = await databaseAdapter.getInstance();
    const collection = database.collection(this.collection);

    return collection;
  }


  /**
   * Counts the number of documents that match query.
   * 
   * @static
   * @returns {Promise} – A promise that resolves with a count of documents in collection.
   * @memberof Base
   */
  static async count(filter = {}) {
    const collection = await this.getCollection();
    const numberOfDocs = await collection.count(filter);

    return numberOfDocs;
  }


  /**
   * 
   * 
   * @static
   * @param {Object} {
   *     filter = {},
   *     fields = {},
   *     sort = {},
   *     skip = config.pagination.skip,
   *     limit = config.pagination.limit,
   *   } 
   * @returns {Array of object}
   * @memberof Base
   */
  static async objects({
    filter = {},
    fields = {},
    sort = {},
    skip = config.pagination.skip,
    limit = config.pagination.limit,
  }) {
    const collection = await this.getCollection();
    const docs = await collection.find(filter, fields)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();

    return docs.map(doc => new this(doc));
  }


  /**
   * Retrieves a document that match id. Either creates new instance of
   * model class if document was found.
   * 
   * @static
   * @param {any} id – The id that should match.
   * @returns {Promise} – A promise that is resolved with a new object when the query completes.
   * @memberof Base
   */
  static async get(id) {
    if (!ObjectID.isValid(id)) {
      throw new Error('Invalid id.');
    }

    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: id });

    return doc ? this(doc) : null;
  }


  /**
   * 
   * 
   * @static
   * @returns 
   * @memberof Base
   */
  static async values(options = {}) {
    const objects = await this.objects(options);
    return objects.map(object => object.toJson());
  }


  /**
   * Returns a JSON version of the object.
   * 
   * @returns {Object}
   * @memberof Base
   */
  toJson() {
    const target = Object.assign({}, this);

    target.id = target._id;
    delete target._id;
    delete target._acl;

    return target;
  }


  /**
   * 
   * 
   * @memberof Base
   */
  async save() {
    Object.assign(this, {
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const collection = await this.constructor.getCollection();
    await collection.insertOne(this);
  }


  /**
   * 
   * 
   * @memberof Base
   */
  async update() {
    const collection = await this.constructor.getCollection();

    Object.assign(this, {
      updatedAt: new Date(),
    });
    await collection.updateOne({ _id: this._id }, { $set: this });
  }


  /**
   * 
   * 
   * @memberof Base
   */
  async delete() {
    const collection = await this.constructor.getCollection();
    await collection.deleteOne({ _id: this._id });
  }
}


module.exports = Base;
