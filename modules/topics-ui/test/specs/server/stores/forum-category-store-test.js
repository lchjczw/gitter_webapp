"use strict";

var assert = require('assert');
var categoryStore = require('../../../../server/stores/forum-category-store');
var categories = require('../../../mocks/mock-data/categories');

describe('CategoryStore', function(){

  let store;
  //The sample data already contains an 'all' category that is removed here
  const data = categories.slice(1);

  beforeEach(() => store = categoryStore(data));

  it('should return an object with data', function(){
    assert(store.data, 'should return a models property');
  });

  it('should add an initial category of all', function(){
    assert.equal(store.data[0].category, 'all');
    assert.equal(store.data[0].slug, 'all');
  });

  it('should add active to the all category no filter is passed', function(){
    assert(store.data[0].active);
  });

  it('should add an active property the right category on init', function(){
    assert(categoryStore(data, 'test-1').getCategories()[1].active);
  });


});
