const config = require('getconfig');
const winston = require('winston');
const app = require('./app');
const DatabaseAdapter = require('./lib/database-adapter');
const User = require('./models/user');
const Link = require('./models/link');

(async () => {
  try {
    const databaseAdapter = new DatabaseAdapter();

    await databaseAdapter.connect();
    await databaseAdapter.registerModel(User);
    await databaseAdapter.registerModel(Link);
    app.listen(config.port, () => {
      winston.info(`Application listening on port: ${config.port}`);
    });
  } catch (error) {
    winston.error('Failed to initialize database');
    winston.error(error);
    process.exit(1);
  }
})();
