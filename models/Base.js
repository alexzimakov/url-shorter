const config = require('getconfig');
const { ObjectID } = require('mongodb');
const pluralize = require('pluralize');
const DatabaseAdapter = require('../lib/database-adapter');

const databaseAdapter = new DatabaseAdapter();

/**
 * Abstract class for model classes.
 * 
 * @class Base
 */
class Base {
  /**
   * Creates an instance of Base.
   * @param {Object} [args={}]
   * @memberof Base
   */
  constructor(args = {}) {
    Object.entries(this.constructor.fields).forEach(([name, definition]) => {
      let Type;
      this[name] = args[name];

      if (typeof definition === 'function') {
        Type = definition;
        this[name] = args[name] || new Type();
      } else {
        Type = definition.type;

        if (
          args[name] ||
          (Type.name === 'Boolean' && (args[name] === false || args[name] === true))
        ) {
          this[name] = args[name];
        } else {
          this[name] = (typeof definition.default === 'function')
            ? definition.default(this)
            : definition.default;
        }
      }
    });
  }


  /**
   * Returns object with default fields definitions.
   *
   * @readonly
   * @returns {Object}
   * @memberOf Base
   */
  static get fields() {
    return {
      _id: {
        type: Object,
        default: new ObjectID(),
      },
      _acl: Object,
      createdAt: Date,
      updatedAt: Date,
    };
  }


  /**
   * Returns class name in plural and lowercase.
   * 
   * @readonly
   * @static
   * @memberof Base
   */
  static get collection() {
    return pluralize(this.name.toLowerCase());
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

    return database.collection(this.collection);
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
   * Returns an array with instances of model.
   * 
   * @static
   * @param {Object} {
   *     filter = {},
   *     fields = {},
   *     sort = {},
   *     skip = config.pagination.skip,
   *     limit = config.pagination.limit,
   *   } 
   * @returns {Array}
   * @memberof Base
   */
  static async objects({
    filter = {},
    fields = {},
    sort = {},
    skip = config.pagination.skip,
    limit = config.pagination.limit,
  } = {}) {
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
   * @param {string|object} id – The id that should match.
   * @returns {Promise} – A promise that is resolved with a new object when the query completes.
   * @memberof Base
   */
  static async get(id) {
    if (!ObjectID.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: new ObjectID(id) });

    return doc ? new this(doc) : null;
  }


  /**
   * Returns array with an object versions of retrieved documents.
   * 
   * @static
   * @returns 
   * @memberof Base
   */
  static async values(options = {}) {
    const objects = await this.objects(options);
    return objects.map(object => object.toObject());
  }


  /**
   * Returns an object version of a model instance.
   * 
   * @returns 
   * @memberof Base
   */
  toObject() {
    const target = Object.assign({}, this);

    target.id = target._id;
    delete target._id;
    delete target._acl;

    return target;
  }


  /**
   * Returns a JSON version of a model instance.
   * 
   * @returns {Object}
   * @memberof Base
   */
  toJson() {
    return JSON.stringify(this.toObject());
  }


  /**
   * Saves a document to database which is presented by instance of model class.
   * 
   * @memberof Base
   */
  async save() {
    const collection = await this.constructor.getCollection();
    await collection.insertOne(this);
  }


  /**
   * Updates a document in database which is presented by instance of model class.
   * 
   * @param {Object} [update={}]
   * @memberof Base
   */
  async update(update = {}) {
    const collection = await this.constructor.getCollection();

    Object.keys(update).forEach((fieldName) => {
      if (fieldName in this.constructor.fields) {
        this[fieldName] = update[fieldName];
      }
    });
    this.updatedAt = new Date();

    await collection.updateOne({ _id: this._id }, { $set: this });
  }


  /**
   * Removes a document from database which is presented by instance of model class.
   * 
   * @memberof Base
   */
  async delete() {
    const collection = await this.constructor.getCollection();
    await collection.deleteOne({ _id: this._id });
  }
}


module.exports = Base;
