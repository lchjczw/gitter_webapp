/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var idStrategyGenerator = require('../id-strategy-generator');
var userService = require('../../services/user-service');
var UserStrategy = require('./user-strategy');

var UserIdStrategy = idStrategyGenerator('UserIdStrategy', UserStrategy, userService.findByIds);

module.exports = UserIdStrategy;