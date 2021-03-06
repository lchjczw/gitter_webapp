'use strict';
var ensurePojo = require('./ensure-pojo');
// @const - higher index in array, higher rank
var RANK = ['contributor', 'admin'];

function compareRank(a, b) {
  return RANK.indexOf(a.role) - RANK.indexOf(b.role) || 0;
}

function compareNames(a, b) {
  return b.username.toLowerCase().localeCompare(a.username.toLowerCase());
}

function inviteStatusDiffer(a, b) {
  return a.invited !== b.invited;
}

function compareInvites(a, b) {
  if (a.invited === b.invited) {
    return 0;
  } else if (a.invited && !b.invited) {
    return -1;
  } else {
    return 1;
  }
}

// it is worth noticing that we want to sort in a descindencing order, thus the negative results
module.exports = function(a, b) {
  // normalizing Backbone.Model to POJO
  a = ensurePojo(a);
  b = ensurePojo(b);

  var rankDifference = compareRank(a, b); // checks if there is rank difference

  // attempts to sort by rank
  if (rankDifference) {
    return -rankDifference;
  }

  // attempts to sort by invite status
  if (inviteStatusDiffer(a, b)) {
    return -compareInvites(a, b);
  }

  // default sort
  return -compareNames(a, b);
};
