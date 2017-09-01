/** @module databaseAdapter */

const config = require('getconfig');
const mongodb = require('mongodb');


const MongoClient = mongodb.MongoClient;
const databaseAdapter = {};


/**
 * Variable for storing connected database instance.
 * 
 * @private
 */
let db = null;


/**
 * Connect a database and set value of the `db` variable to connected database instance.
 * 
 * @param {String} url 
 * @param {Object} options 
 * @return {Object}
 */
async function connect(url = config.db.url, options = config.db.options) {
  try {
    db = await MongoClient.connect(url, options);
    return db;
  } catch (error) {
    throw error;
  }
}


/**
 * Close a database connection and set value of the `db` variable to null.
 */
function disconnect() {
  if (db) {
    db.close();
    db = null;
  }
}


/**
 * Return connected database instance.
 * 
 * @return {Object}
 */
async function getInstance() {
  const database = db || await databaseAdapter.connect();
  return database;
}


Object.defineProperties(databaseAdapter, {
  connect: {
    value: connect,
    enumerable: true,
  },
  disconnect: {
    value: disconnect,
    enumerable: true,
  },
  getInstance: {
    value: getInstance,
    enumerable: getInstance,
  },
});


module.exports = databaseAdapter;
