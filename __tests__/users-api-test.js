const { ObjectID } = require('mongodb');
const winston = require('winston');
const request = require('supertest');
const databaseAdapter = require('../databaseAdapter');
const cryptoUtils = require('../lib/cryptoUtils');
const app = require('../app');

let staffId;
let authorId;
let staffToken;
let authorToken;

beforeAll(async () => {
  try {
    staffId = new ObjectID();
    authorId = new ObjectID();
    staffToken = await cryptoUtils.createToken({ id: staffId });
    authorToken = await cryptoUtils.createToken({ id: authorId });

    const hashedPassword = await cryptoUtils.hashPassword('qwerty123');
    const db = await databaseAdapter.connect();
    await db.collection('users').deleteMany();
    await db.collection('users').insertMany([{
      _id: staffId,
      username: 'sherif',
      email: 'jim.raynor@terrans.com',
      password: hashedPassword,
      firstName: 'Jim',
      lastName: 'Raynor',
      gender: 'male',
      birthDate: new Date(),
      role: 'staff',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, {
      _id: authorId,
      username: 'ghost',
      email: 'sarah.kerrigan@terrans.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Kerrigan',
      gender: 'female',
      birthDate: new Date(),
      role: 'author',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, {
      username: 'santa',
      email: 'santa.claus@terrans.com',
      password: hashedPassword,
      firstName: 'Santa',
      lastName: 'Claus',
      gender: 'male',
      birthDate: new Date(),
      role: 'author',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);
  } catch (err) {
    winston.error(err);
    process.exit(1);
  }
});


afterAll(() => {
  databaseAdapter.disconnect();
});


describe('Users', () => {
  describe('GET /api/v1/users', () => {
    test('should response with error if user is not authenticated', async () => {
      const res = await request(app).get('/api/v1/users');

      expect(res.unauthorized).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should response with error if user has not permissions', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.forbidden).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should return all users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users).toHaveLength(3);
    });

    test('should return only staff users', async () => {
      const res = await request(app)
        .get('/api/v1/users?filter[role]=staff')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);

      res.body.data.users.forEach((user) => {
        expect(user.role).toBe('staff');
      });
    });

    test('should return only active users', async () => {
      const res = await request(app)
        .get('/api/v1/users?filter[isActive]=true')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);

      res.body.data.users.forEach((user) => {
        expect(user.isActive).toBe(true);
      });
    });

    test('should return users with `ost` phrase in username', async () => {
      const res = await request(app)
        .get('/api/v1/users?filter[username]=like:ost')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);

      res.body.data.users.forEach((user) => {
        expect(/ost/i.test(user.username)).toBe(true);
      });
    });

    test('should return only first user', async () => {
      const res = await request(app)
        .get('/api/v1/users?limit=1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].username).toBe('sherif');
    });

    test('should return only second user', async () => {
      const res = await request(app)
        .get('/api/v1/users?skip=1&limit=1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].username).toBe('ghost');
    });

    test('should return user sorted by username (asc)', async () => {
      const res = await request(app)
        .get('/api/v1/users?sort=username')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users).toHaveLength(3);
      expect(res.body.data.users[0].username).toBe('ghost');
      expect(res.body.data.users[1].username).toBe('santa');
      expect(res.body.data.users[2].username).toBe('sherif');
    });

    test('should return user sorted by username (desc)', async () => {
      const res = await request(app)
        .get('/api/v1/users?sort=-username')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users).toHaveLength(3);
      expect(res.body.data.users[0].username).toBe('sherif');
      expect(res.body.data.users[1].username).toBe('santa');
      expect(res.body.data.users[2].username).toBe('ghost');
    });
  });

  describe('POST /api/v1/users', () => {
    describe('username is not valid', () => {
      test('should response with error if username is empty', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: '',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if username have length less than 3', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'ma',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if username not match for the pattern /^[A-Za-z0-9_-]{3,16}$/', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'ma!rine',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if user with given username already exists', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'sherif',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });
    });

    describe('email is not valid', () => {
      test('should response with error if email is empty', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: '',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if email has not @ symbol', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlayterrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if email has not domain name', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });


      test('should response with error if email has not dot in domain name', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@terranscom',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if email has not name', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: '@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if user with given email already exists', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'jim.raynor@terrans.com',
            password: '12345678',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });
    });

    describe('password is not valid', () => {
      test('should response with error if password is empty', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@terrans.com',
            password: '',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if password has length less than 8 symbols', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@terranscom',
            password: '1234567',
            passwordAgain: '12345678',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if passwordAgain is empty', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });

      test('should response with error if passwordAgain is not same as password', async () => {
        const res = await request(app)
          .post('/api/v1/users')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({
            username: 'marine',
            email: 'tychus.findlay@terrans.com',
            password: '12345678',
            passwordAgain: '123456789',
          }));

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['error']));
      });
    });

    test('should return authData and user object', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          username: 'marine',
          email: 'tychus.findlay@terrans.com',
          password: '12345678',
          passwordAgain: '12345678',
        }));

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining(['authData', 'user']));
    });
  });

  describe('PUT /api/v1/users', () => {
    test('should response with error if user is not authenticated', async () => {
      const res = await request(app)
        .put('/api/v1/users?filter[username]=marine')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          firstName: 'Tychus',
          lastName: 'Findlay',
        }));

      expect(res.unauthorized).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should response with error if user has not permissions', async () => {
      const res = await request(app)
        .put('/api/v1/users?filter[username]=marine')
        .set('Authorization', `Bearer ${authorToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          firstName: 'Tychus',
          lastName: 'Findlay',
        }));

      expect(res.forbidden).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should return updatedCount equal to 4', async () => {
      const res = await request(app)
        .put('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ gender: 'male' }));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.updatedCount).toBe(4);
    });

    test('should return updatedCount equal to 1', async () => {
      const res = await request(app)
        .put('/api/v1/users?filter[username]=marine')
        .set('Authorization', `Bearer ${staffToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          firstName: 'Tychus',
          lastName: 'Findlay',
        }));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.updatedCount).toBe(1);
    });
  });

  describe('DELETE /api/v1/users', () => {
    test('should response with error if user is not authenticated', async () => {
      const res = await request(app).delete('/api/v1/users');

      expect(res.unauthorized).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should response with error if user has not permissions', async () => {
      const res = await request(app)
        .delete('/api/v1/users')
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.forbidden).toBe(true);
      expect(res.body.status).toBe('error');
    });

    test('should return deletedCount equal to 1', async () => {
      const res = await request(app)
        .delete('/api/v1/users?filter[username]=marine')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.deletedCount).toBe(1);
    });

    test('should return deletedCount equal to 3', async () => {
      const res = await request(app)
        .delete('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.deletedCount).toBe(3);
    });
  });
});
