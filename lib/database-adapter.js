/** @module DatabaseAdapter */

const config = require('getconfig');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
let instance = null;


/**
 * Creates new DatabaseAdapter.
 * If options don't given, then are used a default options.
 * 
 * @class DatabaseAdapter
 */
class DatabaseAdapter {
  /**
   * Creates an instance of DatabaseAdapter.
   * @param {any} {
   *     url = config.database.url,
   *     options = config.database.options,
   *   } 
   * @memberof DatabaseAdapter
   */
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
   * @memberof DatabaseAdapter
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
   * @memberof DatabaseAdapter
   */
  disconnect() {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }


  /**
   * Returns instance of connected database.
   * 
   * @returns {Promise} – A promise that resolves with instance of connected database.
   * @memberof DatabaseAdapter
   */
  async getInstance() {
    const database = this.database || await this.connect();
    return database;
  }


  /**
   * Creates necessary indexes. Either fill a collection if initial data is defined.
   * 
   * @param {Class} Model 
   * @memberof DatabaseAdapter
   */
  async registerModel(Model) {
    const collection = this.database.collection(Model.collection);

    await Promise.all(
      Object.entries(Model.fields)
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
