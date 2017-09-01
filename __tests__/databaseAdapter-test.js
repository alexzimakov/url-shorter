const databaseAdapter = require('../databaseAdapter');
const mongodb = require('mongodb');


const Db = mongodb.Db;


afterAll(() => databaseAdapter.disconnect());


describe('Database adapter', () => {
  test('the `db` object should be the instance of `Db` class', async () => {
    await expect(
      databaseAdapter.connect(),
    ).resolves.toBeInstanceOf(Db);
  });

  test('should throw an error if passed the wrong connection URI string', async () => {
    await expect(
      databaseAdapter.connect('mongodb://db.wrong.net:2500'),
    ).rejects.toBeDefined();
  });

  test('should return an object being the instance of `Db` class', async () => {
    await expect(
      databaseAdapter.getInstance(),
    ).resolves.toBeInstanceOf(Db);
  });
});
