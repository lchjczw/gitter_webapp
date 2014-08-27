/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var persistence = require('./persistence-service');
var mongoUtils  = require('../utils/mongo-utils');
var env         = require('../utils/env');
var config      = env.config;


function isEarlyAdopter(roomUri) {
  var lcUri = roomUri.toLowerCase();
  return persistence.Troupe.findOneQ({ lcUri: lcUri }, { _id: 1 }, { lean: true })
    .then(function(troupe) {
      if(!troupe) return false;

      var releaseDate = new Date(config.get('premiumRelease'));
      var createdAt = mongoUtils.getDateFromObjectId(troupe._id);
      return releaseDate > createdAt;
    });
}



module.exports = isEarlyAdopter;
