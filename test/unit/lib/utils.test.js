const { assert } = require('chai');
const { keyFromDate } = require('../../../lib/utils');

describe('lib: utils:', () => {
  describe('keyFromDate:', () => {
    it('should returns date with `YYYY-MM-DD` format', () => {
      const dateForTesting = new Date(1970, 0, 1);
      const key = keyFromDate(dateForTesting);

      assert.equal('1970-01-01', key);
    });
  });
});
