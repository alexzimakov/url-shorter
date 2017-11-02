const { assert } = require('chai');
const sinon = require('sinon');
const User = require('../../../models/User');
const {
  isPasswordsMatch,
  isUserWithSuchUsernameExists,
  isUserWithSuchEmailExists,
  isLettersOnly,
  isArray,
  isValidTags,
} = require('../../../lib/validators');

describe('lib: validators:', () => {
  describe('isPasswordsMatch:', () => {
    const correctPassword = 'qwerty';
    const wrongPassword = 'qwerty123';
    const payload = {
      req: {
        body: {
          password: correctPassword,
        },
      },
    };

    it('should returns true if a given passowrd is equal to req.body.passowrd', () => {
      const validationResult = isPasswordsMatch(correctPassword, payload);

      assert.isOk(validationResult);
    });

    it('should throws error if a given password does not match with req.body.password', () => {
      try {
        isPasswordsMatch(wrongPassword, payload);
      } catch (error) {
        assert.isNotNull(error);
      }
    });
  });


  describe('isUserWithSuchUsernameExists:', () => {
    const existingUsername = 'existing-username';
    let count;

    before(() => {
      count = sinon.stub(User, 'count');
      count.callsFake((args) => {
        const username = args.filter.username;

        if (username === existingUsername) {
          return Promise.resolve(1);
        }

        return Promise.resolve(0);
      });
    });

    after(() => {
      count.restore();
    });

    it('should returns a promise which resolves with true if user with such username wasn\'t found', async () => {
      const expectedArgsForCount = [{
        filter: {
          username: 'test',
        },
      }];
      const result = await isUserWithSuchUsernameExists('test');

      assert.isTrue(count.calledOnce);
      assert.deepEqual(count.firstCall.args, expectedArgsForCount);
      assert.isTrue(result);
    });

    it('should returns a promise which rejects with error if user with such username was found', async () => {
      try {
        await isUserWithSuchUsernameExists(existingUsername);
      } catch (error) {
        assert.isNotNull(error);
      }
    });
  });


  describe('isUserWithSuchEmailExists:', () => {
    const existingEmail = 'existing.email@example.com';
    let count;

    before(() => {
      count = sinon.stub(User, 'count');
      count.callsFake((args) => {
        const email = args.filter.email;

        if (email === existingEmail) {
          return Promise.resolve(1);
        }

        return Promise.resolve(0);
      });
    });

    after(() => {
      count.restore();
    });

    it('should returns a promise which resolves with true if user with such email wasn\'t found', async () => {
      const expectedArgsForCount = [{
        filter: {
          email: 'not.existing.email@example.com',
        },
      }];
      const result = await isUserWithSuchEmailExists('not.existing.email@example.com');

      assert.isTrue(count.calledOnce);
      assert.deepEqual(count.firstCall.args, expectedArgsForCount);
      assert.isTrue(result);
    });

    it('should returns a promise which rejects with error if user with such email was found', async () => {
      try {
        await isUserWithSuchEmailExists(existingEmail);
      } catch (error) {
        assert.isNotNull(error);
      }
    });
  });


  describe('isLettersOnly:', () => {
    it('should returns true if a given value contains only letters and dashes', () => {
      assert.isTrue(isLettersOnly('Abc'));
      assert.isTrue(isLettersOnly('Abc-efd'));
    });

    it('should throws error if a given value contains not only letters and dashes, or value is empty', () => {
      try {
        isLettersOnly('Abc1');
        isLettersOnly('');
      } catch (error) {
        assert.isNotNull(error);
      }
    });
  });


  describe('isArray:', () => {
    it('should returns true if a given value is array', () => {
      assert.isTrue(isArray([]));
      assert.isTrue(isArray(['a', 'b', 'c']));
    });

    it('should throws error if a given value is not array', () => {
      [
        true,
        1,
        'abc',
        {},
        null,
        undefined,
      ].forEach((checkingValue) => {
        try {
          assert.isNotTrue(isArray(checkingValue));
        } catch (error) {
          assert.instanceOf(error, Error);
        }
      });
    });
  });


  describe('isValidTags:', () => {
    it('should returns true if every tag in array is valid (contains only letters, numbers and dashes) or array is empty', () => {
      assert.isTrue(isValidTags(['one', 'two', 'three', '123', 'a1']));
      assert.isTrue(isValidTags([]));
    });

    it('should throws error if even though tag in array is not valid', () => {
      [
        ['one', 'two', ''],
        ['123+'],
        [''],
      ].forEach((checkingValue) => {
        try {
          assert.isNotTrue(checkingValue);
        } catch (error) {
          assert.isNotNull(error);
        }
      });
    });
  });
});
