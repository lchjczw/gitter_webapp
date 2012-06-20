/*jshint globalstrict:true, trailing:false */
/*global console:false, require: true, module: true */
"use strict";

var persistence = require("./persistence-service");
var appEvents = require("../app-events");
var winston = require("winston");
var hogan = require('hogan');
var _ = require('underscore');

function compile(map) {
  for(var k in map) {
    if(map.hasOwnProperty(k)) {
      map[k] = hogan.compile(map[k]);
    }
  }
  return map;
}

/* TODO: externalize and internationalise this! */
var notificationTemplates = compile({
  "email:new": "New email with subject \"{{subject}}\" from {{from}}" ,
  "file:createVersion": "Version {{version}}  of {{fileName}} created.",
  "file:createNew": "New file {{fileName}} created."
});

var notificationLinkTemplates = compile({
  "email:new": "#mail/{{emailId}}",
  "file:createVersion": "#files",
  "file:createNew": "#files"
});

function findByTroupe(id, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  var q = persistence.Notification
        .where('troupeId', id);

  if(options.skip) q.skip(options.skip);
  if(options.limit) q.limit(options.limit);

  q.desc('createdDate')
        .slaveOk()
        .exec(callback);
}

function formatNotification(notification) {
  var templateData = {};
  _.extend(templateData, notification.data, { troupeId: notification.troupeId });
  console.dir(templateData);

  var textTemplate = notificationTemplates[notification.notificationName];
  var linkTemplate = notificationLinkTemplates[notification.notificationName];

  if(!textTemplate || !linkTemplate) { winston.warn("Unknown notification ", notification.notificationName); return null; }

  return {
    troupeId: notification.troupeId,
    notificationText: textTemplate.render(templateData),
    notificationLink: linkTemplate.render(templateData)
  };
}

module.exports = {
  /* Create a new troupe notification */
  createTroupeNotification: function(troupeId, notificationName, data) {
    winston.debug("notificationService: createTroupeNotification", arguments);
    var notification = new persistence.Notification({
      troupeId: troupeId,
      userId: null,
      notificationName: notificationName,
      data: data
    });

    notification.save(function(err) {
      if(err) return winston.error("Unable to save notification", err);

      var n = formatNotification(notification);
      if(n) appEvents.newNotification(notification.troupeId, null, n.notificationText, n.notificationLink);
    });
  },

  /* Find all notifications for a troupe */
  findByTroupe: findByTroupe,

  listByTroupe: function(id, options, callback) {
    findByTroupe(id, options, function(err, notifications) {
      if(err) return callback(err);
      callback(null, notifications.map(formatNotification).filterNulls());
    });
  }

};