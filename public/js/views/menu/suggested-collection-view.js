"use strict";
var roomNameTrimmer = require('utils/room-name-trimmer'); // TODO: move this to shared
var resolveIconClass = require('utils/resolve-icon-class'); // TODO: move this to shared
var Marionette = require('backbone.marionette');
var template = require('./tmpl/suggested-list-item.hbs');

module.exports = (function() {

  var SuggestedItemView = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'room-list-item',
    template: template,
    modelEvents: {
      change: 'render',
    },
    serializeData: function() {
      var data = this.model.toJSON();
      data.uri = roomNameTrimmer(data.uri);
      data.repoTypeClass = resolveIconClass(data);
      data.linkUrl = data.exists ? '/' + this.model.get('uri') : '#confirm/' + this.model.get('uri');
      return data;
    }
  });

  return Marionette.CollectionView.extend({
    tagName: 'ul',
    className: 'room-list',
    childView: SuggestedItemView
  });


})();
