/** @module DatabaseAdapter */

const config = require('getconfig');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
let instance = null;


/**
 * Creates new DatabaseAdapter.
 * If options don't given, then are used a default options.
 * 
 * @class
 */
class DatabaseAdapter {
  constructor(url = config.database.url, options = config.database.options) {
    if (!instance) {
      instance = this;
    }

    this.database = null;
    this.url = url;
    this.options = options;

    return instance;
  }


  /**
   * Connects to database and sets the `database` property to instance of connected database.
   * 
   * @returns
   */
  async connect() {
    try {
      this.database = await MongoClient.connect(this.url, this.options);

      this.database.on('error', () => {
        this.database = null;
      });

      this.database.on('close', () => {
        this.database = null;
      });

      return this.database;
    } catch (error) {
      throw error;
    }
  }


  /**
   * If `database` property is defined, then disconnects from database
   * and sets `database` property to null.
   * 
   */
  disconnect() {
    if (this.database) {
      this.database.close();
    }
  }


  /**
   * Returns instance of connected database.
   * 
   * @returns {Promise} – A promise that resolves with instance of connected database.
   */
  async getInstance() {
    const database = this.database || await this.connect();
    return database;
  }


  /**
   * Creates necessary indexes. Either fill a collection if initial data is defined.
   * 
   * @param {Function} Model
   */
  async registerModel(Model) {
    const collection = this.database.collection(Model.collectionName);

    await Promise.all(
      Object.entries(Model.schema)
        .filter(entry => entry[1].index)
        .map(([fieldName]) => collection.createIndex({ [fieldName]: 1 })),
    );

    if (Model.initialData) {
      const docsNumber = await collection.count();

      if (docsNumber === 0) {
        await collection.insertMany(Model.initialData);
      }
    }
  }
}


module.exports = DatabaseAdapter;
