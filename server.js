const config = require('getconfig');
const winston = require('winston');
const app = require('./app');
const databaseAdapter = require('./databaseAdapter');

databaseAdapter.initializeDatabase()
  .then(() => {
    app.listen(config.port, () => {
      winston.info(`Application listening on port: ${config.port}`);
    });
  })
  .catch((err) => {
    winston.error('Failed to initialize database');
    winston.error(err);
    process.exit(1);
  });
