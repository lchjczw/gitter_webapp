#!/usr/bin/env node
/*jslint node:true, unused:true */
"use strict";

var userService = require('../../server/services/user-service');
var troupeService = require('../../server/services/troupe-service');
var restSerializer = require('../../server/serializers/rest-serializer');
var shutdown = require('shutdown');

var graphRecommendations  = require('gitter-web-recommendations');

var opts = require("nomnom")
  .option('username', {
    position: 0,
    required: true,
    help: "username to look up e.g trevorah"
  })
  .option('uri', {
    help: "room in which to do the lookup"
  })
  .option('language', {
    default: 'en',
    help: "human language"
  })
  .parse();

userService.findByUsername(opts.username)
  .then(function(user) {
    return [user, opts.uri && troupeService.findByUri(opts.uri)];
  })
  .spread(function(user, room) {
    if (room) {
      return graphRecommendations.getSuggestionsForRoom(room, user, opts.language);
    }
    
    return graphRecommendations.getSuggestionsForUser(user, opts.language);
  })
  .then(function(suggestions) {
    return restSerializer.serializeQ(suggestions, new restSerializer.SuggestedRoomStrategy({ }));
  })
  .then(function(repos) {
    repos.forEach(function(suggestion) {
      console.log(suggestion.uri);
    });
  })
  .delay(1000)
  .fail(function(err) {
    console.error(err.stack);
  })
  .fin(function() {
    shutdown.shutdownGracefully();
  });
