"use strict";

var userModels        = require('../users');
var chatModels        = require('../chat');
var eventModels       = require('../events');
var appEvents         = require('utils/appevents');
var context           = require('utils/context');
var unreadItemsClient = require('components/unread-items-client');
var errorHandle       = require('utils/live-collection-error-handle');
var ProxyCollection   = require('backbone-proxy-collection');

require('components/realtime-troupe-listener');

module.exports = (function() {
  var currentChats            = new chatModels.ChatCollection(null, { listen: true });
  var chatCollection          = new ProxyCollection({ collection: currentChats });
  var rosterCollection        = new userModels.RosterCollection(null, { listen: true });
  var eventCollection         = new eventModels.EventCollection(null,  { listen: true, snapshot: true });

  chatCollection.on('error', errorHandle.bind(null, 'chat-collection'));
  rosterCollection.on('error', errorHandle.bind(null, 'roster-collection'));
  eventCollection.on('error', errorHandle.bind(null, 'events-collection'));

  // update online status of user models
  appEvents.on('userLoggedIntoTroupe', updateUserStatus);
  appEvents.on('userLoggedOutOfTroupe', updateUserStatus);

  function updateUserStatus(data) {
    var user = rosterCollection.get(data.userId);
    if (user) {
      // the backbone models have not always come through before the presence events,
      // but they will come with an accurate online status so we can just ignore the presence event
      user.set('online', (data.status === 'in') ? true : false);
    }
  }

  // Keep the unread items up to date on the model
  // This allows the unread items client to mark model items as read
  if(context.isLoggedIn()) {
    unreadItemsClient.syncCollections({
      'chat': chatCollection
    });
  }

  var collections = {
    chats: chatCollection,
    roster: rosterCollection,
    events: eventCollection
  };

  window._intergratedCollections = collections;

  return collections;
})();
