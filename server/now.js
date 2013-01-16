/*jshint globalstrict:true, trailing:false unused:true node:true*/
/*global console:false, require: true, module: true */
"use strict";

var passport = require('passport'),
    winston = require('winston'),
    userService = require("./services/user-service"),
    troupeService = require("./services/troupe-service"),
    presenceService = require("./services/presence-service"),
    conversationService = require("./services/conversation-service"),
    fileService = require("./services/file-service"),
    restSerializer = require("./serializers/rest-serializer"),
    appEvents = require("./app-events"),
    nconf = require('./utils/config'),
    bayeux = require('./web/bayeux'),
    Q = require("q"),
    everyone,
    nowjs = {};

function getNestedUrlForModel(modelName) {
  switch(modelName) {
    case 'chat':
      return 'chatMessages';
    case 'conversation':
      return 'conversations';
    case 'files':
      return 'files';
    default:
      winston.warn("nowjs: unexpected modelName " + modelName);
      return modelName + "s";
  }
}

module.exports = {
    install: function(server, sessionStore) {
      var bayeuxServer = bayeux.server;
      var bayeuxClient = bayeux.client;
      bayeuxServer.attach(server);

      appEvents.onDataChange(function(data) {

        var troupeId = data.troupeId;
        var modelId = data.modelId;
        var modelName = data.modelName;
        var operation = data.operation;
        var model = data.model;

        var publishUrl = "/troupes/" + troupeId + "/" + getNestedUrlForModel(modelName);

        console.log("Publishing to " + publishUrl);

        console.log("now: appEvents.onDataChange");

        if(operation === 'create' || operation === 'update') {
          winston.debug("nowjs: Data has changed. Change will be serialized and pushed to clients.", { model: model });

          var Strategy = restSerializer.getStrategy(modelName, true);

          // No strategy, ignore it
          if(!Strategy) {
            winston.info("nowjs: Skipping serialization as " + modelName + " has no serialization strategy");
            return;
          }

          restSerializer.serialize(model, new Strategy(), function(err, serializedModel) {
            if(err) return winston.error("nowjs: Serialization failure" , err);
            if(!serializedModel) return winston.error("nowjs: No model returned from serializer");

            console.log(">>>>>> ", operation, " sending model ", model, " as ", serializedModel);

            bayeuxClient.publish(publishUrl, {
              troupeId: troupeId,
              modelName: modelName,
              operation: operation,
              id: modelId,
              model: serializedModel
            });
          });
        } else {
          /* For remove operations.... */
          bayeuxClient.publish(publishUrl, {
            troupeId: troupeId,
            modelName: modelName,
            operation: operation,
            id: modelId
          });
        }

      });


      return;
      everyone = nowjs.initialize(server, {
         "host" : nconf.get("ws:hostname"),
         "port" : nconf.get("ws:externalPort"),
         "autoHost": false,
         "socketio" : {
           "log level": 1
         }
      });

      nowjs.on('connect', function() {
        winston.info("nowjs: Incoming nowjs socket connected");

        var self = this;

        loadSessionWithUser(this.user, sessionStore, function(err, user) {
          if(err) return;
          if(!user) return;

          winston.info("nowjs: User connected", { userId: user.id });

          nowjs.getGroup("user." + user.id).addUser(self.user.clientId);

          presenceService.userSocketConnected(user.id, self.user.clientId);
        });
      });

      nowjs.on('disconnect', function() {
        var self = this;

        loadSessionWithUser(this.user, sessionStore, function(err, user) {
          if(err) return;
          if(!user) return;

          nowjs.getGroup("user." + user.id).removeUser(self.user.clientId);

          /* Give the user 10 seconds to log back into before reporting that they're disconnected */
          setTimeout(function(){
            presenceService.userSocketDisconnected(user.id, self.user.clientId);
          }, 10000);

        });
      });

      everyone.now.subscribeToTroupe = function(troupeId, callback) {
        var self = this;
        if(!callback) callback = function() {};

        loadUserAndTroupe(this.user, troupeId, sessionStore, function(err, user, troupe) {
          if(err) {
            winston.warn('nowjs: Error while loading user and troupe in subscribeToTroupe: ',  { exception: err } );
            callback({ description: "Server error", reauthenticate: true });
            return;
          }

          if(!user || !troupe) {
            callback({ description: "Authentication failure", reauthenticate: true });
            return;
          }

          presenceService.userSubscribedToTroupe(user.id, troupe.id, self.user.clientId);

          var group = nowjs.getGroup("troupe." + troupe.id);
          group.addUser(self.user.clientId);

          callback(null);
        });
      };

      appEvents.onTroupeUnreadCountsChange(function(data) {
        var userId = data.userId;

        var group = nowjs.getGroup("user." + userId);
        if(group && group.now && group.now.onTroupeUnreadCountsChange) {
          group.now.onTroupeUnreadCountsChange(data);
        }
      });

      appEvents.onNewUnreadItem(function(data) {
        var userId = data.userId;
        var items = data.items;

        var group = nowjs.getGroup("user." + userId);
        if(group && group.now && group.now.onNewUnreadItems) {
          group.now.onNewUnreadItems(items);
        }
      });

      appEvents.onUnreadItemsRemoved(function(data) {
        var userId = data.userId;
        var items = data.items;

        var group = nowjs.getGroup("user." + userId);
        if(group && group.now && group.now.onUnreadItemsRemoved) {
          group.now.onUnreadItemsRemoved(items);
        }
      });

      appEvents.onUserLoggedIntoTroupe(function(data) {
        var troupeId = data.troupeId;
        var userId = data.userId;

        getGroup("troupe." + troupeId, function(group) {
          if(!group || !group.now || !group.now.onUserLoggedIntoTroupe) {
            return;
          }

          var deferredT = Q.defer();
          var deferredU = Q.defer();

          userService.findById(userId, deferredU.node());
          troupeService.findById(troupeId, deferredT.node());

          Q.all([deferredT.promise, deferredU.promise]).spread(function(troupe, user) {
            group.now.onUserLoggedIntoTroupe({
              userId: userId,
              displayName: user.displayName
            });
          });
        });

      });

      appEvents.onUserLoggedOutOfTroupe(function(data) {
        var troupeId = data.troupeId;
        var userId = data.userId;

        getGroup("troupe." + troupeId, function(group) {
          if(!group || !group.now || !group.now.onUserLoggedOutOfTroupe) {
            return;
          }

          var deferredT = Q.defer();
          var deferredU = Q.defer();

          userService.findById(userId, deferredU.node());
          troupeService.findById(troupeId, deferredT.node());

          Q.all([deferredT.promise, deferredU.promise]).spread(function(troupe, user) {
            group.now.onUserLoggedOutOfTroupe({
              userId: userId,
              displayName: user.displayName
            });
          });

        });
      });

      appEvents.onFileEvent(function(data) {
        var event = data.event;
        switch(event) {
          case 'createVersion':
          case 'createThumbnail':
          break;
        default:
          return;
        }

        var fileId = data.fileId;
        var troupeId = data.troupeId;

        getGroup("troupe." + troupeId, function(group) {
          if(!group || !group.now || !group.now.onFileEvent) {
            return;
          }

          fileService.findById(fileId, function(err, file) {
            winston.info("nowjs: Bridging file event to now.js clients");

            restSerializer.serialize(file, new restSerializer.FileStrategy(), function(err, serializedFile) {
              if(err || !serializedFile) return winston.error("nowjs: Notification failure", { exception: err });

              group.now.onFileEvent({
                event: event,
                file: serializedFile
              });

            });

          });

        });
      });


      appEvents.onMailEvent(function(data) {
        var event = data.event;
        if(event !== 'new') {
          /* Filter..... */
          return;
        }

        var troupeId = data.troupeId;
        var conversationId = data.conversationId;
        var mailIndex = data.mailIndex;

        getGroup("troupe." + troupeId, function(group) {
          if(!group || !group.now || !group.now.onMailEvent) {
            return;
          }

          conversationService.findById(conversationId, function(err, conversation) {
            if(err || !conversation) return winston.error("nowjs: Notification failure", { exception: err});

            restSerializer.serialize(conversation, new restSerializer.ConversationMinStrategy(), function(err, serializedConversation) {
              if(err || !serializedConversation) return winston.error("nowjs: Notification failure", err);

              group.now.onMailEvent({
                event: event,
                conversation: serializedConversation,
                mailIndex: mailIndex
              });
            });
          });

        });
      });

      appEvents.onNewNotification(function(data) {
        var troupeId = data.troupeId;
        var userId = data.userId;
        var notificationText = data.notificationText;
        var notificationLink = data.notificationLink;

        /* Directed at a troupe? */
        if(troupeId) {
          getGroup("troupe." + troupeId, function(group) {
            if(!group || !group.now || !group.now.onNotification) {
              return;
            }

            group.now.onNotification({
              troupeId: troupeId,
              notificationText: notificationText,
              notificationLink: notificationLink
            });
          });
        }

        /* Directed at a user? */
        if(userId) {
          winston.error("nowjs: DIRECT USER NOTIFICATIONS NOT YET IMPLEMENTED!!");
          // TODO
        }
      });

      appEvents.onDataChange(function(data) {

        var troupeId = data.troupeId;
        var modelId = data.modelId;
        var modelName = data.modelName;
        var operation = data.operation;
        var model = data.model;

        getGroup("troupe." + troupeId, function(group) {
          if(!group || !group.now || !group.now.onDataChange) {
            console.log("If a tree falls in a forest");
            return;
          }

          console.log("now: appEvents.onDataChange");

          if(operation === 'create' || operation === 'update') {
            winston.debug("nowjs: Data has changed. Change will be serialized and pushed to clients.", { model: model });

            var Strategy = restSerializer.getStrategy(modelName, true);

            // No strategy, ignore it
            if(!Strategy) {
              winston.info("nowjs: Skipping serialization as " + modelName + " has no serialization strategy");
              return;
            }

            restSerializer.serialize(model, new Strategy(), function(err, serializedModel) {
              if(err) return winston.error("nowjs: Serialization failure" , err);
              if(!serializedModel) return winston.error("nowjs: No model returned from serializer");

              group.now.onDataChange({
                troupeId: troupeId,
                modelName: modelName,
                operation: operation,
                id: modelId,
                model: serializedModel
              });
            });
          } else {
            group.now.onDataChange({
              troupeId: troupeId,
              modelName: modelName,
              operation: operation,
              id: modelId
            });
          }
        });

      });

    }

};
