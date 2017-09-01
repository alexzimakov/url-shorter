const config = require('getconfig');
const winston = require('winston');
const app = require('./app');
const databaseAdapter = require('./databaseAdapter');

databaseAdapter.connect()
  .then(() => {
    app.listen(config.port, () => {
      winston.info(`Application listening on port: ${config.port}`);
    });
  })
  .catch((err) => {
    winston.error('Failed to make database connection');
    winston.error(err);
    process.exit(1);
  });
