"use strict";

var forumFilterConstants = require('../../constants/forum-filters');

module.exports = function navigateToFilter(filter){
  if(!filter) {
    throw new Error('navigateToFilter must be called with a valid filter');
  }

  return {
    type: forumFilterConstants.NAVIGATE_TO_FILTER,
    route: 'forum',
    filter: filter,
  };
};
