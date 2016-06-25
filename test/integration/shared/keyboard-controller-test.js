'use strict';
var path = require('path');
var assert = require('assert');

var _ = require('underscore');
var Backbone = require('backbone');

// This is weird and based off of the `test-require` -> `path.resolve(__dirname + '/../../server/' + module)`
var keyboardControllerRequireBasePath = '../public/js/views/menu/room/keyboard-controller/';

var sanitizeDir = require('../test-require')(path.join(keyboardControllerRequireBasePath, 'sanitize-direction'));
var findNextActiveItem = require('../test-require')(path.join(keyboardControllerRequireBasePath, 'find-next-active-item'));
var findNextNavigableModel = require('../test-require')(path.join(keyboardControllerRequireBasePath, 'find-next-navigable-model'));


// Only compares the keys of the expected
var assertExpectedOnlyDeep = function(actual, expected) {
  Object.keys(expected).forEach(function(key) {
    assert.strictEqual(actual[key], expected[key]);
  });
};




var FORWARDS = sanitizeDir.FORWARDS;
var BACKWARDS = sanitizeDir.BACKWARDS;


var activeCollectionFixtureDataSingle = [
  { name: 'foo' },
];

var activeCollectionFixtureData1 = [
  { name: 'foo1-1' },
  { name: 'bar1-2' },
  { name: 'baz1-3' },
  { name: 'qux1-4' },
  { name: 'gar1-5' },
  { name: 'wal1-6' }
];

var activeCollectionFixtureData2 = [
  { name: 'hot2-1' },
  { name: 'cro2-2' },
  { name: 'bun2-3' },
  { name: 'thr2-4' },
  { name: 'bli2-5' },
  { name: 'mic2-6' }
];

var activeCollectionFixtureData3 = [
  { name: 'qwe3-1' },
  { name: 'asd3-2' },
  { name: 'zxc3-3' }
];

// var activeCollectionFixtureData4 = [
//   { name: 'lor4-1' },
//   { name: 'ips4-2' },
//   { name: 'dol4-3' }
// ];


var ActiveModel = Backbone.Model.extend({
  defaults: {
    name: '',
    active: false,
    isHidden: false
  }
});

var ActiveCollection = Backbone.Collection.extend({
  model: ActiveModel
});


var singleCollectionFixtureReferenceList = [
  new ActiveCollection(activeCollectionFixtureDataSingle)
];
var basicCollectionFixtureReferenceList = [
  new ActiveCollection(activeCollectionFixtureData1)
];
var mediumCollectionFixtureReferenceList = [
  new ActiveCollection(activeCollectionFixtureData1),
  new ActiveCollection(activeCollectionFixtureData2),
  new ActiveCollection(activeCollectionFixtureData3),
  //new ActiveCollection(activeCollectionFixtureData4)
];
var singleFirstMixedCollectionFixtureReferenceList = [
  new ActiveCollection(activeCollectionFixtureDataSingle),
  new ActiveCollection(activeCollectionFixtureData1),
  new ActiveCollection(activeCollectionFixtureData2),
];


var singleNavigableCollectionListFixture = singleCollectionFixtureReferenceList.map(function(collectionFixture) {
  return { collection: collectionFixture };
});
var basicNavigableCollectionListFixture = basicCollectionFixtureReferenceList.map(function(collectionFixture) {
  return { collection: collectionFixture };
});
var mediumNavigableCollectionListFixture = mediumCollectionFixtureReferenceList.map(function(collectionFixture) {
  return {
    collection: collectionFixture,
    /* */
    getActive: function(collection, i) {
      if(i === 3) {
        return false;
      }
      return true;
    }
    /* */
  };
});
var singleFirstMixedNavigableCollectionListFixture = singleFirstMixedCollectionFixtureReferenceList.map(function(collectionFixture) {
  return { collection: collectionFixture };
});

var templateNavigableItemReference = {
  mapKey: 'test',
  listIndex: null,
  modelId: null,
  modelIndex: null
};


describe('Keyboard Controller', function() {

  describe('sanitize-direction', function() {
    it('Resolves boolean `true` as forwards', function() {
      assert.strictEqual(sanitizeDir(true), FORWARDS);
    });
    it('Resolves boolean `false` as backwards', function() {
      assert.strictEqual(sanitizeDir(false), BACKWARDS);
    });
    it('Resolves number `1` as forwards', function() {
      assert.strictEqual(sanitizeDir(1), FORWARDS);
    });
    it('Resolves number `-1` as backwards', function() {
      assert.strictEqual(sanitizeDir(-1), BACKWARDS);
    });
    it('Resolves number `0` as forwards', function() {
      assert.strictEqual(sanitizeDir(0), FORWARDS);
    });
    it('Resolves number `4` as forwards', function() {
      assert.strictEqual(sanitizeDir(4), FORWARDS);
    });
    it('Resolves number `-4` as backwards', function() {
      assert.strictEqual(sanitizeDir(-4), BACKWARDS);
    });
    it('Resolves `undefined` as forwards', function() {
      assert.strictEqual(sanitizeDir(undefined), FORWARDS);
    });
    it('Resolves `null` as forwards', function() {
      assert.strictEqual(sanitizeDir(null), FORWARDS);
    });
  });


  describe('find-next-active-item', function() {
    var singleListFixture = ['foo'];
    var doubleListFixture = [1, 2];
    var basicListFixture = [1, 2, 3];
    var mediumListFixture = [1, 2, 3, 4, 5, 6];


    it('Resolves to only item when going forwards', function() {
      var nextItem = findNextActiveItem(singleListFixture, 0, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 'foo',
        index: 0
      });
    });
    it('Resolves to only item when going backwards', function() {
      var nextItem = findNextActiveItem(singleListFixture, 0, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 'foo',
        index: 0
      });
    });

    it('Resolves to second-item starting at first-item and going forwards with only two items', function() {
      var nextItem = findNextActiveItem(doubleListFixture, 0, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 2,
        index: 1
      });
    });
    it('Resolves to first-item starting at second-item and going backwards with only two items', function() {
      var nextItem = findNextActiveItem(doubleListFixture, 1, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to first-item starting at second-item and going forwards with only two items', function() {
      var nextItem = findNextActiveItem(doubleListFixture, 1, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to second-item starting at first-item and going backwards with only two items', function() {
      var nextItem = findNextActiveItem(doubleListFixture, 0, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 2,
        index: 1
      });
    });

    it('Resolves to first-item starting at the beginning(null) and going forwards', function() {
      var nextItem = findNextActiveItem(basicListFixture, null, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to last-item starting at the beginning(null) and going backwards', function() {
      var nextItem = findNextActiveItem(basicListFixture, null, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 3,
        index: 2
      });
    });

    it('Resolves to next-item starting at the first index', function() {
      var nextItem = findNextActiveItem(basicListFixture, 0, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 2,
        index: 1
      });
    });

    it('Resolves to first-item starting at last-item and going forwards', function() {
      var nextItem = findNextActiveItem(basicListFixture, 2, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to last-item starting at first-item and going backwards', function() {
      var nextItem = findNextActiveItem(basicListFixture, 0, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 3,
        index: 2
      });
    });

    it('Resolves to previous-item starting at the last index', function() {
      var nextItem = findNextActiveItem(basicListFixture, basicListFixture.length-1, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 2,
        index: 1
      });
    });
    it('Resolves to previous-item starting in the middle', function() {
      var nextItem = findNextActiveItem(basicListFixture, 1, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 3,
        index: 2
      });
    });
    it('Resolves to next-item starting in the middle', function() {
      var nextItem = findNextActiveItem(basicListFixture, 1, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to next-item when in the middle of a list and going forwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, 2, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 4,
        index: 3
      });
    });
    it('Resolves to previous-item when in the middle of a list and going backwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, 2, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 2,
        index: 1
      });
    });

    it('Resolves to next-item when using negative index and going forwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, -1, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to previous-item when using negative index and going backwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, -1, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: 5,
        index: 4
      });
    });

    it('Resolves to first-item starting at last-item and going forwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, mediumListFixture.length-1, FORWARDS);
      assert.deepEqual(nextItem, {
        item: 1,
        index: 0
      });
    });
    it('Resolves to last-item starting at first-item and going backwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, 0, BACKWARDS);
      assert.deepEqual(nextItem, {
        item: mediumListFixture[mediumListFixture.length-1],
        index: mediumListFixture.length-1
      });
    });

    describe('Some inactive items', function() {
      it('Resolves to last-item starting in the middle but first-active-item and going backwards', function() {
        var nextItem = findNextActiveItem(mediumListFixture, 3, BACKWARDS, function(item, i) {
          if(i <= 2) {
            return false;
          }
          return true;
        });
        assert.deepEqual(nextItem, {
          item: mediumListFixture[mediumListFixture.length-1],
          index: mediumListFixture.length-1
        });
      });
      it('Resolves to first-item starting in the middle but last-active-item and going forwards', function() {
        var nextItem = findNextActiveItem(mediumListFixture, 3, FORWARDS, function(item, i) {
          if(i > 3) {
            return false;
          }
          return true;
        });
        assert.deepEqual(nextItem, {
          item: 1,
          index: 0
        });
      });

      it('Resolves to last-active-item starting in the middle but first-active-item and going backwards', function() {
        var nextItem = findNextActiveItem(mediumListFixture, 3, BACKWARDS, function(item, i) {
          // Only items with index 3 and 4 are active
          if(i <= 2 || i >= 5) {
            return false;
          }
          return true;
        });
        assert.deepEqual(nextItem, {
          item: 5,
          index: 4
        });
      });


      it('Resolves to first-active-item starting in the middle but last-active-item and going forwards', function() {
        var nextItem = findNextActiveItem(mediumListFixture, 4, FORWARDS, function(item, i) {
          // Only items with index 3 and 4 are active
          if(i <= 2 || i >= 5) {
            return false;
          }
          return true;
        });
        assert.deepEqual(nextItem, {
          item: 4,
          index: 3
        });
      });
    });


    it('Resolves to nothing when list is empty and going forwards', function() {
      var nextItem = findNextActiveItem([], null, FORWARDS);
      assert.strictEqual(nextItem, undefined);
    });
    it('Resolves to nothing when list is empty and going backwards', function() {
      var nextItem = findNextActiveItem([], null, BACKWARDS);
      assert.strictEqual(nextItem, undefined);
    });

    it('Resolves to nothing when nothing is active and going forwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, null, FORWARDS, function(item) {
        // nothing is active
        return false;
      });
      assert.strictEqual(nextItem, undefined);
    });
    it('Resolves to nothing when nothing is active and going backwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, null, BACKWARDS, function(item) {
        // nothing is active
        return false;
      });
      assert.strictEqual(nextItem, undefined);
    });

    it('Resolves correctly when using custom active callback and going forwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, null, FORWARDS, function(item) {
        return item === 3;
      });
      assert.deepEqual(nextItem, {
        item: 3,
        index: 2
      });
    });
    it('Resolves correclty when using custom active callback and going backwards', function() {
      var nextItem = findNextActiveItem(mediumListFixture, null, BACKWARDS, function(item) {
        return item === 3;
      });
      assert.deepEqual(nextItem, {
        item: 3,
        index: 2
      });
    });
  });


  describe('find-next-navigable-model', function() {

    describe('Barebones list', function() {
      var createBareBonesSingleTest = function(testName, dir, referenceModelIndex, expectedIndex) {
        it(testName, function() {
          var nextResult = findNextNavigableModel(singleNavigableCollectionListFixture, _.extend({}, templateNavigableItemReference, {
            listIndex: 0,
            modelIndex: referenceModelIndex
          }), dir);

          assert.ok(nextResult);
          assert.strictEqual(nextResult.model.get('name'), singleCollectionFixtureReferenceList[0].at(expectedIndex).get('name'));
          assertExpectedOnlyDeep(nextResult.reference, {
            listIndex: 0,
            modelIndex: expectedIndex
          });
        });
      };

      createBareBonesSingleTest('Find only-item when starting from nothing moving forward', FORWARDS, null, 0);
      createBareBonesSingleTest('Find only-item when starting from nothing moving backward', BACKWARDS, null, 0);
      createBareBonesSingleTest('Find only-item when starting from only-item moving forward', FORWARDS, 0, 0);
      createBareBonesSingleTest('Find only-item when starting from only-item moving backward', BACKWARDS, 0, 0);
    });


    describe('Basic list', function() {
      var createBasicTest = function(testName, dir, referenceModelIndex, expectedIndex) {
        it(testName, function() {
          var nextResult = findNextNavigableModel(basicNavigableCollectionListFixture, _.extend({}, templateNavigableItemReference, {
            listIndex: 0,
            modelIndex: referenceModelIndex
          }), dir);

          assert.ok(nextResult);
          assert.strictEqual(nextResult.model.get('name'), basicCollectionFixtureReferenceList[0].at(expectedIndex).get('name'));
          assertExpectedOnlyDeep(nextResult.reference, {
            listIndex: 0,
            modelIndex: expectedIndex
          });
        });
      };

      createBasicTest('Find first-item when starting from nothing moving forward', FORWARDS, null, 0);
      createBasicTest('Find last-item when starting from nothing moving backward', BACKWARDS, null, basicCollectionFixtureReferenceList[0].length-1);

      createBasicTest('Find next-item when starting in middle moving forward', FORWARDS, 2, 3);
      createBasicTest('Find previous-item when starting in middle moving backward', BACKWARDS, 2, 1);
      createBasicTest('Find next-item when starting first moving forward', FORWARDS, 0, 1);
      createBasicTest('Find previous-item when starting last moving backward', BACKWARDS, basicCollectionFixtureReferenceList[0].length-1, basicCollectionFixtureReferenceList[0].length-2);

      createBasicTest('Find first-item when starting last moving forward', FORWARDS, basicCollectionFixtureReferenceList[0].length-1, 0);
      createBasicTest('Find last-item when starting first moving backward', BACKWARDS, 0, basicCollectionFixtureReferenceList[0].length-1);
    });

    describe('Medium list', function() {
      var createMediumTest = function(testName, dir, quickReference, expectedReference) {
        it(testName, function() {
          var nextResult = findNextNavigableModel(
            mediumNavigableCollectionListFixture,
            _.extend({}, templateNavigableItemReference, quickReference),
            dir
          );

          assert.ok(nextResult);
          assert.strictEqual(nextResult.model.get('name'), mediumCollectionFixtureReferenceList[expectedReference.listIndex].at(expectedReference.modelIndex).get('name'));
          assertExpectedOnlyDeep(nextResult.reference, expectedReference);
        });
      };

      createMediumTest('Find first-item in first-collection when starting from nothing moving forward', FORWARDS, {
        listIndex: 0,
        modelIndex: null
      }, {
        listIndex: 0,
        modelIndex: 0
      });
      createMediumTest('Find last-item in last-collection when starting from nothing moving backward', BACKWARDS, {
        listIndex: 0,
        modelIndex: null
      }, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-1].length-1
      });

      createMediumTest('Find last-item in last-collection when starting from first-item in first-collection moving backward', BACKWARDS, {
        listIndex: 0,
        modelIndex: 0
      }, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-1].length-1
      });
      createMediumTest('Find first-item in first-collection when starting from last-item in last-collection moving forward', FORWARDS, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-1].length-1
      }, {
        listIndex: 0,
        modelIndex: 0
      });

      createMediumTest('Find next-item in first-collection when starting from first-item in first-collection moving backward', FORWARDS, {
        listIndex: 0,
        modelIndex: 0
      }, {
        listIndex: 0,
        modelIndex: 1
      });
      createMediumTest('Find previous-item in last-collection when starting from last-item in last-collection moving backward', BACKWARDS, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-1].length-1
      }, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-1].length-2
      });


      createMediumTest('Find first-item in last-collection when starting from last-item in first-collection moving forward', FORWARDS, {
        listIndex: mediumCollectionFixtureReferenceList.length-2,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-2].length-1
      }, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: 0
      });
      createMediumTest('Find last-item in first-collection when starting from first-item in last-collection moving backward', BACKWARDS, {
        listIndex: mediumCollectionFixtureReferenceList.length-1,
        modelIndex: 0
      }, {
        listIndex: mediumCollectionFixtureReferenceList.length-2,
        modelIndex: mediumCollectionFixtureReferenceList[mediumCollectionFixtureReferenceList.length-2].length-1
      });


      createMediumTest('Find next-item in first-collection when starting from middle in first-collection moving forward', FORWARDS, {
        listIndex: 0,
        modelIndex: 3
      }, {
        listIndex: 0,
        modelIndex: 4
      });
      createMediumTest('Find previous-item in first-collection when starting from middle in first-collection moving backward', BACKWARDS, {
        listIndex: 0,
        modelIndex: 3
      }, {
        listIndex: 0,
        modelIndex: 2
      });


      createMediumTest('Find next-item in middle-collection when starting from middle in middle-collection moving forward', FORWARDS, {
        listIndex: 1,
        modelIndex: 3
      }, {
        listIndex: 1,
        modelIndex: 4
      });
      createMediumTest('Find previous-item in middle-collection when starting from middle in middle-collection moving backward', BACKWARDS, {
        listIndex: 1,
        modelIndex: 3
      }, {
        listIndex: 1,
        modelIndex: 2
      });
    });


    describe('List with collection that has only 1 item', function() {
      var createSingleFirstMixedTest = function(testName, dir, quickReference, expectedReference) {
        it(testName, function() {
          var nextResult = findNextNavigableModel(
            singleFirstMixedNavigableCollectionListFixture,
            _.extend({}, templateNavigableItemReference, quickReference),
            dir
          );

          assert.ok(nextResult);
          assert.strictEqual(nextResult.model.get('name'), singleFirstMixedCollectionFixtureReferenceList[expectedReference.listIndex].at(expectedReference.modelIndex).get('name'));
          assertExpectedOnlyDeep(nextResult.reference, expectedReference);
        });
      };


      createSingleFirstMixedTest('Find first-item in first-collection when starting from last-item in last-collection moving forward', FORWARDS, {
        listIndex: singleFirstMixedCollectionFixtureReferenceList.length-1,
        modelIndex: singleFirstMixedCollectionFixtureReferenceList[singleFirstMixedCollectionFixtureReferenceList.length-1].length-1
      }, {
        listIndex: 0,
        modelIndex: 0
      });

      createSingleFirstMixedTest('Find last-item in last-collection when starting from first-item in first-collection moving backward', BACKWARDS, {
        listIndex: 0,
        modelIndex: 0
      }, {
        listIndex: singleFirstMixedCollectionFixtureReferenceList.length-1,
        modelIndex: singleFirstMixedCollectionFixtureReferenceList[singleFirstMixedCollectionFixtureReferenceList.length-1].length-1
      });
    });

    // Currently with this situation, we just won't wrap around to the first/last
    it('Resolve to last-item starting on first-item of middle-collection and all collections before have no active items, going backwards');
    // TODO: Add tests for different collections with tricky hidden item combos
  });

});