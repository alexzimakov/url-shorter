/** @module Base */

const Schema = require('async-validator');
const pluralize = require('pluralize');
const { ObjectID } = require('mongodb');
const { isEqual } = require('lodash');
const DatabaseAdapter = require('../lib/database-adapter');

const databaseAdapter = new DatabaseAdapter();

/**
 * Abstract class for model classes.
 * 
 * @class
 * @abstract
 */
class AbstractModel {
  constructor(data = {}) {
    const schema = this.constructor.getSchema();
    const attributes = Object.keys(schema);

    attributes.forEach((attribute) => {
      const type = schema[attribute].type;
      let value;

      switch (type) {
        case 'string':
        case 'email':
          value = '';
          break;
        case 'array':
          value = [];
          break;
        case 'object':
          value = {};
          break;
        default:
          value = null;
          break;
      }

      if (attribute in data) {
        value = data[attribute];
      } else if (schema[attribute].default) {
        value = schema[attribute].default;
      }

      Object.assign(this, {
        [attribute]: value,
      });
    });

    Object.defineProperties(this, {
      isValid: {
        value: true,
        writable: true,
      },
      errors: {
        value: {},
        writable: true,
      },
    });
  }


  /**
   * Returns schema object extended with _id, createdAt and updatedAt properties.
   *
   * @returns {Object}
   * @readonly
   */
  static getSchema() {
    return Object.assign({
      _id: {
        type: 'object',
        default: new ObjectID(),
        required: true,
      },
      createdAt: {
        type: 'date',
        default: new Date(),
        required: true,
      },
      updatedAt: {
        type: 'date',
        default: new Date(),
        required: true,
      },
    }, this.schema);
  }


  /**
   * Returns collection name using class name.
   *
   * @returns {String}
   */
  static get collectionName() {
    const className = this.name;
    const classNameParts = className.match(/[A-Z][a-z]+/g);

    return classNameParts === null
      ? pluralize(className).toLowerCase()
      : pluralize(classNameParts.join('_')).toLowerCase();
  }


  /**
   * Returns collection object for model class.
   *
   * @returns {Promise.<Collection>}
   */
  static async getCollection() {
    const db = await databaseAdapter.getInstance();
    return db.collection(this.collectionName);
  }


  /**
   * Creates new Model instance and save it to database.
   *
   * @param data
   * @returns {Promise.<Object>}
   */
  static async create(data) {
    const object = new this(data);

    await object.save();
    return object;
  }


  /**
   * Returns count of filtered docs. If filter object is empty then returns total
   * count of docs.
   *
   * @param {Object} filter
   * @returns {Promise.<Number>}
   */
  static async count(filter = {}) {
    const query = Object.assign({}, filter);
    const collection = await this.getCollection();

    delete query.skip;
    delete query.limit;

    const count = await collection.count(query);
    return count;
  }


  /**
   * Finds a single document in database by id.
   * If document was found then returns new Model instance from document.
   *
   * @param {ObjectID|String} id
   * @returns {Object}
   */
  static async findById(id) {
    if (!ObjectID.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: new ObjectID(id) });

    return doc !== null ? new this(doc) : null;
  }


  /**
   * Finds a single document in database that matches to filter.
   *
   * @param filter
   * @returns {Promise.<Object>}
   */
  static async find(filter = {}) {
    const query = Object.assign({}, filter);
    const collection = await this.getCollection();

    delete query.skip;
    delete query.limit;

    const doc = await collection.findOne(query);
    return doc !== null ? new this(doc) : null;
  }


  /**
   * Finds multiple document in database that match to filter.
   *
   * @param {Object} filter
   * @param {Number} skip
   * @param {Number} limit
   * @param {Object} sort
   * @returns {Promise.<Array>}
   */
  static async findAll({
    filter = {},
    skip,
    limit,
    sort = {},
  } = {}) {
    const query = Object.assign({}, filter);
    const collection = await this.getCollection();

    delete query.skip;
    delete query.limit;

    let getDocs = collection.find(query);

    if (skip) {
      getDocs = getDocs.skip(skip);
    }

    if (limit) {
      getDocs = getDocs.limit(limit);
    }

    getDocs = getDocs.sort(sort);

    const docs = await getDocs.toArray();
    return docs.map(doc => new this(doc));
  }


  /**
   * Updates multiple documents in database that match to filter.
   *
   * @param {Object} filter
   * @param {Object} update
   * @returns {Promise.<void>}
   */
  static async updateAll({
    filter = {},
    update = {},
  } = {}) {
    const collection = await this.getCollection();
    await collection.updateMany(filter, { $set: update });
  }


  /**
   * Deletes multiple documents in database that match to filter.
   *
   * @param {Object} filter
   * @returns {Promise.<void>}
   */
  static async destroyAll(filter = {}) {
    const collection = await this.getCollection();
    await collection.deleteMany(filter);
  }


  /**
   * Validates instance data using model schema.
   *
   * @returns {Promise}
   */
  validate() {
    const validator = new Schema(this.constructor.getSchema());

    return new Promise((resolve) => {
      validator.validate(this, (errors, fields) => {
        if (errors) {
          this.isValid = false;
          this.errors = fields;
        } else {
          this.isValid = true;
          this.errors = {};
        }

        resolve();
      });
    });
  }


  /**
   * Saves single instance to database.
   *
   * @returns {Promise.<void>}
   */
  async save() {
    await this.validate();

    if (this.isValid) {
      const object = await this.constructor.findById(this._id);

      if (object === null) {
        const collection = await this.constructor.getCollection();
        await collection.insertOne(this);
      } else {
        await this.update();
      }
    }
  }


  /**
   * Updates instance in database.
   *
   * @param {Object} update
   * @returns {Promise.<void>}
   */
  async update(update = {}) {
    const attributes = Object.keys(this.constructor.getSchema());

    Object.entries(update).forEach(([attribute, value]) => {
      if (attributes.includes(attribute)) {
        this[attribute] = value;
      }
    });

    await this.validate();

    if (this.isValid) {
      const collection = await this.constructor.getCollection();
      await collection.findOneAndUpdate({ _id: this._id }, { $set: this });
    }
  }


  /**
   * Deletes instance from database.
   *
   * @returns {Promise.<void>}
   */
  async destroy() {
    const collection = await this.constructor.getCollection();
    await collection.deleteOne({ _id: this._id });
  }


  /**
   * Checks if object or some attribute of object was modified.
   *
   * @param {String} attribute
   * @returns {Promise.<Boolean>}
   */
  async isModified(attribute) {
    const object = await this.constructor.findById(this._id);
    let result;

    if (object === null) {
      result = true;
    } else if (attribute && !(attribute in object)) {
      result = false;
    } else if (attribute) {
      result = !isEqual(this[attribute], object[attribute]);
    } else {
      result = !isEqual(this, object);
    }

    return result;
  }


  /**
   * Returns an object version of instance.
   *
   * @returns {Object}
   */
  toObject() {
    const object = Object.assign({}, { id: this._id }, this);

    delete object._id;
    return object;
  }


  /**
   * Returns an object version of instance only with attributes that listed
   * in arguments.
   *
   * @param attributes
   * @returns {Object}
   */
  select(...attributes) {
    const object = this.toObject();

    Object.keys(object)
      .filter(attribute => attribute !== 'id' && !attributes.includes(attribute))
      .forEach(attribute => delete object[attribute]);
    return object;
  }


  /**
   * Returns an object version of instance without attributes that listed in arguments.
   *
   * @param attributes
   * @returns {Object}
   */
  exclude(...attributes) {
    const object = this.toObject();

    Object.keys(object)
      .filter(attribute => attribute !== 'id' && attributes.includes(attribute))
      .forEach(attribute => delete object[attribute]);
    return object;
  }
}


module.exports = AbstractModel;
