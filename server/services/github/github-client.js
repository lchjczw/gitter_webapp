/*jshint globalstrict:true, trailing:false, unused:true, node:true */
'use strict';

var github = require('troupe-octonode');
var assert = require('assert');
var request = require('./request-wrapper');

function createClient(user, token) {
  assert(token, 'token required');

  var client = github.client(token, request);

  return client;
}

module.exports = exports = {
  user: function(user) {
    assert(user, 'user required');
    var token = user.githubUserToken || user.githubToken;
    return createClient(user, token);
  },
  full: function(user) {
    assert(user, 'user required');
    var token = user.githubToken || user.githubUserToken;
    return createClient(user, token);
  }
};