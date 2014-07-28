/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var persistence   = require("./persistence-service");
var processChat   = require('../utils/process-chat-isolated');
var appEvents     = require("../app-events");
var ObjectID      = require('mongodb').ObjectID;
var Q             = require('q');
var StatusError   = require('statuserror');


exports.newEventToTroupe = function(troupe, user, text, meta, payload, callback) {
  text = text ? "" : "" + text;

  return Q.fcall(function() {
      if(!troupe) throw new StatusError(500, "Invalid troupe");
      if(!text) throw new StatusError(400, "Text required");

      return processChat(text);
    })
    .then(function(parsed) {
      var event = new persistence.Event();

      event.fromUserId = user ? user.id : null;
      event.toTroupeId = troupe.id;
      event.sent       = new Date();
      event.text       = text;
      event.html       = parsed.html;
      event.meta       = meta;
      event.payload    = payload;

      return event.saveQ()
        .then(function() {
          appEvents.hookEvent({username: 'gitter', room: troupe.uri, text: text});
          return event;
        });

    })
    .nodeify(callback);
};

exports.findEventsForTroupe = function(troupeId, options, callback) {
  var q = persistence.Event
    .where('toTroupeId', troupeId);

  if(options.startId) {
    var startId = new ObjectID(options.startId);
    q = q.where('_id').gte(startId);
  }

  if(options.beforeId) {
    var beforeId = new ObjectID(options.beforeId);
    q = q.where('_id').lt(beforeId);
  }

  q.sort(options.sort || { sent: 'desc' })
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .exec(function(err, results) {
      if(err) return callback(err);

      return callback(null, results.reverse());
    });
};
