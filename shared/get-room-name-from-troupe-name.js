'use strict';

var getOrgNameFromTroupeName = require('./get-org-name-from-troupe-name');
var escapeStringRegexp       = require('escape-string-regexp');

module.exports = function getRoomNameFromTroupeName(name) {
  return name.replace(new RegExp('^' + escapeStringRegexp(getOrgNameFromTroupeName(name)) + '/'), '');
};
