const winston = require('winston');
const request = require('supertest');
const databaseAdapter = require('../databaseAdapter');
const app = require('../app');


beforeAll(
  () => databaseAdapter.connect()
    .then(() => true)
    .catch((err) => {
      winston.error(err);
      process.exit(1);
    }),
);


afterAll(() => {
  databaseAdapter.disconnect();
});


describe('Smoke test', () => {
  test('for GET method the `/` route should response with status 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});
