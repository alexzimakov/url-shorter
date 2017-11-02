const config = require('getconfig');
const winston = require('winston');
const app = require('./app');
const DatabaseAdapter = require('./lib/database-adapter');
const Group = require('./models/Group');
const User = require('./models/User');
const Link = require('./models/Link');

(async () => {
  try {
    const databaseAdapter = new DatabaseAdapter();

    await databaseAdapter.connect();
    await databaseAdapter.registerModel(Group);
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
