'use strict';

var BaseItemView = require('../base-item-view');
var toggleClass = require('../../../../utils/toggle-class');
var template = require('./base-collection-item-view.hbs');
var updateUnreadIndicatorClassState = require('../../../../components/menu/update-unread-indicator-class-state');

var BaseCollectionItemView = BaseItemView.extend({
  className: 'room-item',
  template: template,

  triggers: {
    click: 'item:activated'
  },

  modelEvents: {
    activated: 'onItemActivated',
    'change:active': 'onActiveChange',
    'change:unreadItems change:mentions change:activity': 'onUnreadUpdate',
    'change:isHidden': 'onHiddenChange'
  },

  ui: {
    container: '#room-item__container',
    unreadIndicator: '.room-item__unread-indicator',
    title: '#room-item-title'
  },

  initialize: function(attrs) {
    this.roomMenuModel = attrs.roomMenuModel;
    this.index = attrs.index;
  },

  attributes: function() {
    //TODO specialise this to be data-*-id eg data-room-id
    return {
      'data-id': this.model.get('id')
    };
  },

  getRoomName: function() {
    var model = this.model;

    var name =
      model.get('uri') ||
      model.get('url') ||
      model.get('name') ||
      (model.get('fromUser') && model.get('fromUser').username);

    return name;
  },

  getRoomTitle: function() {
    var model = this.model;

    return (
      model.get('name') || // For room models
      model.get('displayName') || // For users in search
      model.get('username') || // For users in search
      model.get('uri') || // Fallback
      ''
    );
  },

  getRoomUrl: function() {
    // Does every room not have a `url`?
    var name = this.getRoomName();
    var url = name[0] === '/' ? name : '/' + name;

    return url;
  },

  onRender: function() {
    toggleClass(this.el, 'hidden', this.model.get('isHidden'));
    if (!this.ui.unreadIndicator || !this.ui.unreadIndicator[0]) {
      return;
    }
    toggleClass(this.ui.unreadIndicator[0], 'hidden', this.roomMenuModel.get('state') === 'group');
  },

  pulseIndicators: function() {
    // Re-trigger the pulse animation
    // 16ms is a good 60-fps number to trigger on which Firefox needs (requestAnimationFrame doesn't work for this)
    Array.prototype.forEach.call(this.ui.unreadIndicator, function(unreadIndicatorElement) {
      unreadIndicatorElement.classList.remove('pulse-animation');
      setTimeout(function() {
        unreadIndicatorElement.classList.add('pulse-animation');
      }, 16);
    });
  },

  onActiveChange: function(model, val) {
    toggleClass(this.ui.container[0], 'active', !!val);
  },

  onItemActivated: function() {
    this.trigger('item:activated');
  },

  onUnreadUpdate: function() {
    updateUnreadIndicatorClassState(this.model, this.ui.unreadIndicator);

    // Update the count inside the badge indicator
    var unreadIndicatorContent = '';
    var unreads = this.model.get('unreadItems');
    var mentions = this.model.get('mentions');
    if (mentions === 0 && unreads > 0) {
      unreadIndicatorContent = unreads;
    }
    Array.prototype.forEach.call(this.ui.unreadIndicator, function(indicatorElement) {
      indicatorElement.textContent = unreadIndicatorContent;
    });

    this.pulseIndicators();
  },

  onHiddenChange: function(model, val) {
    toggleClass(this.el, 'hidden', val);
    if (!this.ui.unreadIndicator || !this.ui.unreadIndicator[0]) {
      return;
    }
    toggleClass(this.ui.unreadIndicator[0], 'hidden', this.roomMenuModel.get('state') === 'group');
  }
});

module.exports = BaseCollectionItemView;
