/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var winston = require('../utils/winston');
var collections = require("../utils/collections");
var execPreloads = require('./exec-preloads');

function idStrategyGenerator(name, FullObjectStrategy, loaderFunction) {
  var Strategy = function IdStrategy(options) {
    var strategy = new FullObjectStrategy(options);
    var self = this;

    this.preload = function(ids, callback) {
      loaderFunction(ids, function(err, fullObjects) {
        if(err) {
          winston.error("Error loading objects", { exception: err });
          return callback(err);
        }

        self.objectHash = collections.indexById(fullObjects);

        execPreloads([{
          strategy: strategy,
          data: fullObjects
        }], callback);

      });
    };

    this.map = function(id) {
      var fullObject = self.objectHash[id];

      if(!fullObject) {
        winston.warn("Unable to locate object ", { id: id });
        return null;
      }

      return strategy.map(fullObject);
    };

  };

  Strategy.prototype = {
    name: name
  };

  return Strategy;
}
module.exports = idStrategyGenerator;

