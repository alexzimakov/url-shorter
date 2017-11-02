process.env.NODE_ENV = 'test';

const { assert } = require('chai');
const sinon = require('sinon');
const { ObjectID } = require('mongodb');
const Base = require('../../../models/Base');
const DatabaseAdapter = require('../../../lib/database-adapter');


describe('model: Base:', () => {
  describe('collection:', () => {
    it('should return class name in plural and lowercase', () => {
      assert.equal('bases', Base.collection);
    });
  });


  describe('getCollection:', () => {
    let getInstanceStub;
    let collectionStub;

    beforeEach(() => {
      collectionStub = sinon
        .stub()
        .resolves({});
      getInstanceStub = sinon
        .stub(new DatabaseAdapter(), 'getInstance')
        .returns({ collection: collectionStub });
    });

    afterEach(() => {
      getInstanceStub.restore();
    });

    it('should return a promise that resolve with collection object', async () => {
      const collection = await Base.getCollection();

      assert.isTrue(getInstanceStub.calledOnce);
      assert.isTrue(collectionStub.calledOnce);
      assert.deepEqual(collectionStub.firstCall.args, ['bases']);
      assert.isObject(collection);
    });
  });


  describe('count:', () => {
    const expectedNumberOfDocs = 10;
    let getCollectionStub;
    let countStub;

    beforeEach(() => {
      countStub = sinon
        .stub()
        .resolves(expectedNumberOfDocs);
      getCollectionStub = sinon
        .stub(Base, 'getCollection')
        .resolves({ count: countStub });
    });

    afterEach(() => {
      getCollectionStub.restore();
    });

    it('should returns number of docs in collection if a filter arg no given', async () => {
      const numberOfDocs = await Base.count();

      assert.deepEqual(getCollectionStub.firstCall.args, []);
      assert.deepEqual(countStub.firstCall.args, [{}]);
      assert.equal(numberOfDocs, expectedNumberOfDocs);
    });

    it('should returns number of docs in collection if a filter arg is given', async () => {
      const filter = { key: 'value' };
      const numberOfDocs = await Base.count(filter);

      assert.deepEqual(getCollectionStub.firstCall.args, []);
      assert.deepEqual(countStub.firstCall.args, [filter]);
      assert.equal(numberOfDocs, expectedNumberOfDocs);
    });
  });


  describe('objects:', () => {
    let getCollectionStub;
    let sortStub;
    let limitStub;
    let skipStub;
    let findStub;

    before(() => {
      sortStub = sinon.stub();
      sortStub.returns({
        toArray: () => Promise.resolve(new Array(10)),
      });

      limitStub = sinon.stub();
      limitStub.returns({ sort: sortStub });

      skipStub = sinon.stub();
      skipStub.returns({ limit: limitStub });

      findStub = sinon.stub();
      findStub.returns({ skip: skipStub });

      getCollectionStub = sinon.stub(Base, 'getCollection');
      getCollectionStub.resolves({ find: findStub });
    });

    after(() => {
      getCollectionStub.restore();
    });

    it('should returns a promise which resolves with the array of model instances', async () => {
      const filter = { field1: 'value1', field2: 'value2' };
      const fields = { field1: true, field2: false };
      const sort = { field: -1, field2: 1 };
      const skip = 0;
      const limit = 10;
      const instances = await Base.objects({
        filter,
        fields,
        sort,
        skip,
        limit,
      });

      assert.deepEqual(findStub.firstCall.args, [filter, fields]);
      assert.deepEqual(sortStub.firstCall.args, [sort]);
      assert.deepEqual(skipStub.firstCall.args, [skip]);
      assert.deepEqual(limitStub.firstCall.args, [limit]);
      assert.isArray(instances);
      assert.isTrue(instances.every(instance => instance instanceof Base));
    });
  });


  describe('get:', () => {
    let mockId;
    let getCollectionStub;
    let findOneStub;

    beforeEach(() => {
      findOneStub = sinon.stub();
      getCollectionStub = sinon
        .stub(Base, 'getCollection')
        .resolves({ findOne: findOneStub });
    });

    afterEach(() => {
      getCollectionStub.restore();
    });

    it('should return null if a given id is not valid MongoDB id', async () => {
      const doc = await Base.get('test');

      assert.isNull(doc);
    });

    it('should return instance of class model if doc was found and ids must be same', async () => {
      mockId = new ObjectID();
      findOneStub.resolves({ _id: mockId });

      const doc = await Base.get(mockId);

      assert.instanceOf(doc, Base);
      assert.equal(doc._id, mockId);
    });

    it('should return null if doc wasn\'t found', async () => {
      findOneStub.resolves(null);

      const doc = await Base.get(new ObjectID());

      assert.isNull(doc);
    });
  });


  describe('values:', () => {
    let objectsStub;

    before(() => {
      objectsStub = sinon.stub(Base, 'objects');
    });

    after(() => {
      objectsStub.restore();
    });

    it('should return array with object versions of model instances', async () => {
      const fakeInstance = new Base();
      const toObjectSpy = sinon.spy(fakeInstance, 'toObject');
      const expectedArgs = {
        filter: { field: 'value' },
      };

      objectsStub.resolves([fakeInstance, fakeInstance, fakeInstance]);

      const values = await Base.values(expectedArgs);

      assert.isTrue(objectsStub.calledOnce);
      assert.deepEqual(objectsStub.firstCall.args, [expectedArgs]);
      assert.equal(toObjectSpy.callCount, 3);
      assert.isArray(values);
      assert.lengthOf(values, 3);
    });

    it('should return empty array if docs wasn\'t found', async () => {
      objectsStub.resolves([]);

      const values = await Base.values();

      assert.isArray(values);
      assert.lengthOf(values, 0);
    });
  });


  describe('toObject:', () => {
    it('should returns object version of instance with id property and without _id, _acl properties', () => {
      const instance = new Base();
      const target = instance.toObject();

      assert.notInstanceOf(target, Base);
      assert.containsAllKeys(target, ['id']);
      assert.doesNotHaveAllKeys(target, ['_id', '_acl']);
    });
  });


  describe('toJson:', () => {
    it('should returns JSON version of instance', () => {
      const instance = new Base();
      const toObjectStub = sinon
        .stub(instance, 'toObject')
        .returns({});
      const target = instance.toJson();

      assert.isTrue(toObjectStub.calledOnce);
      assert.isString(target);
    });
  });


  describe('save:', () => {
    let getCollectionStub;
    let insertOneSpy;

    before(() => {
      insertOneSpy = sinon.spy();
      getCollectionStub = sinon
        .stub(Base, 'getCollection')
        .resolves({ insertOne: insertOneSpy });
    });

    after(() => {
      getCollectionStub.restore();
    });

    it('should saves instance to database', async () => {
      const instance = new Base();

      await instance.save();

      assert.isTrue(getCollectionStub.calledOnce);
      assert.isTrue(insertOneSpy.calledOnce);
    });
  });


  describe('update:', () => {
    let getCollectionStub;
    let updateOneSpy;

    beforeEach(() => {
      updateOneSpy = sinon.spy();
      getCollectionStub = sinon
        .stub(Base, 'getCollection')
        .resolves({ updateOne: updateOneSpy });
    });

    afterEach(() => {
      getCollectionStub.restore();
    });

    it('should updates instance if an args no given', async () => {
      const oldUpdatedAt = new Date(2017, 0, 1);
      const instance = new Base({ updatedAt: oldUpdatedAt });

      await instance.update();

      assert.isTrue(getCollectionStub.calledOnce);
      assert.isTrue(updateOneSpy.calledOnce);
      assert.deepEqual(updateOneSpy.firstCall.args, [
        { _id: instance._id },
        { $set: instance },
      ]);
      assert.notEqual(oldUpdatedAt, instance.updatedAt);
    });

    it('should updates instance if an args given', async () => {
      const oldCreatedAt = new Date(2016, 0, 1);
      const newCreatedAt = new Date(2017, 0, 1);
      const instance = new Base({ createdAt: oldCreatedAt });
      const update = { createdAt: newCreatedAt };

      await instance.update(update);

      assert.notEqual(oldCreatedAt, instance.createdAt);
      assert.deepEqual(updateOneSpy.firstCall.args, [
        { _id: instance._id },
        { $set: instance },
      ]);
    });
  });


  describe('delete:', () => {
    let getCollectionStub;
    let deleteOneSpy;

    before(() => {
      deleteOneSpy = sinon.spy();
      getCollectionStub = sinon
        .stub(Base, 'getCollection')
        .resolves({ deleteOne: deleteOneSpy });
    });

    after(() => {
      getCollectionStub.restore();
    });

    it('should deletes instance from database', async () => {
      const instance = new Base();
      const _id = instance._id;

      await instance.delete();

      assert.isTrue(getCollectionStub.calledOnce);
      assert.isTrue(deleteOneSpy.calledOnce);
      assert.deepEqual(deleteOneSpy.firstCall.args, [{ _id }]);
    });
  });
});
