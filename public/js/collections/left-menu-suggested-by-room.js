'use strict';

var Backbone                       = require('backbone');
var SuggestedRoomsByRoomCollection = require('./room-suggested-rooms.js');
var SyncMixin                      = require('./sync-mixin');

var SuggestionsContextModel = Backbone.Model.extend({});

module.exports = SuggestedRoomsByRoomCollection.extend({

  initialize: function(models, attrs, options) {

    if (!attrs || !attrs.roomMenuModel) {
      throw new Error('A valid instance of a RoomMenuModel must be passed to a new instance of LeftMenuSuggestionsCollection');
    }

    this.roomMenuModel = attrs.roomMenuModel;
    this.listenTo(this.roomMenuModel, 'change:state', this.onDataUpdate, this);

    if (!attrs || !attrs.troupeModel) {
      throw new Error('A valid instance of a TroupeModel must be passed to a new instance of LeftMenuSuggestionsCollection');
    }

    this.troupeModel = attrs.troupeModel;
    this.listenTo(this.troupeModel, 'change:id', this.onDataUpdate, this);

    this.contextModel = new SuggestionsContextModel(null, {
      roomMenuModel: this.roomMenuModel,
      troupeModel:   this.troupeModel,
    });

    attrs.contextModel = (attrs.contextModel || this.contextModel);
    SuggestedRoomsByRoomCollection.prototype.initialize.call(this, models, attrs, options);

  },

  onDataUpdate: function () {
    //check the menu state
    var currentMenuState = this.roomMenuModel.get('state');
    if(currentMenuState !== 'all') { return }

    //check the current state of the room
    var currentRoomId = this.troupeModel.get('id');
    if(!currentRoomId) { return }

    //update url and get data
    this.contextModel.set('roomId', currentRoomId);
    this.fetch();
  },

  sync: SyncMixin.sync,
});
