"use strict"

var assert = require('assert');
var forumStore = require('../../../../server/stores/forum-store');

describe.skip('forumStore', () => {

  var data = {};

  it('should expose a data object', () => {
    assert(forumStore(data).data);
  });

  it('should expose a getForum function', () => {
    assert(forumStore(data).getForum);
  });

});