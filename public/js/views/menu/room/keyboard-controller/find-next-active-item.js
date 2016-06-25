'use strict';

var sanitizeDir = require('./sanitize-direction');


// Bounds input index to somewhere in [0, length] with wrapping/rollover
var arrayBoundWrap = function(index, length) {
  return ((index % length) + length) % length;
};

// Helper to iterate and break/return the active item if we come across one
var iterateListUntilActive = function(list, dir, startIndex, stopIndex, getActiveCb) {
  startIndex = arrayBoundWrap(startIndex, list.length);

  for(var i = startIndex; (dir > 0 ? i < stopIndex : i > -1); (dir > 0 ? i++ : i--)) {
    var item = list[i];
    if(getActiveCb(item, i)) {
      return {
        item: item,
        index: i
      };
    }
  }
};

// When `dir` is forwards:
//   (startIndex, list.length] then [0, startIndex]
// When `dir` is backwards:
//   (startIndex, 0] then [list.length, startIndex]
var findNextActiveItem = function(list, startIndex, dir, getActiveCb) {
  dir = sanitizeDir(dir);
  getActiveCb = (getActiveCb || function() { return true; });
  // This is so you can pass in `null` and go to first or last item depending on direction
  if(startIndex === null) {
    startIndex = (dir > 0 ? -1 : 0);
  }

  var nextIndex = (dir > 0 ? startIndex+1 : startIndex-1);
  nextIndex = arrayBoundWrap(nextIndex, list.length);
  var boundaryEndIndex = (dir > 0 ? list.length : 0);
  var result = iterateListUntilActive(list, dir, nextIndex, boundaryEndIndex, getActiveCb);
  if(!result) {
    var boundaryStartIndex = (dir > 0 ? 0 : list.length-1);
    result = iterateListUntilActive(list, dir, boundaryStartIndex, startIndex+1, getActiveCb);
  }

  return result;
};

module.exports = findNextActiveItem;