'use strict';

var ItemModel = require('../minibar-item-model');

module.exports = ItemModel.extend({
  defaults: {
    mentions: false,
    unreadItems: false,
    type: 'people',
    name: 'people'
  },

  initialize: function(attrs, options) {
    //jshint unused: true
    this.roomCollection = options.roomCollection;
    this.listenTo(
      this.roomCollection,
      'snapshot sync change remove reset',
      this.onRoomsUpdate,
      this
    );
  },

  onRoomsUpdate: function() {
    this.set(this.reduceRooms());
  },

  reduceRooms: function() {
    return this.roomCollection.reduce(
      function(memo, room) {
        if (room.get('oneToOne')) {
          return memo;
        }
        return {
          mentions: memo.mentions + room.get('mentions'),
          unreadItems: memo.unreadItems + room.get('unreadItems')
        };
      },
      { mentions: 0, unreadItems: 0 }
    );
  }
});
