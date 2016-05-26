'use strict';

var _ = require('underscore');
var Marionette = require('backbone.marionette');
var itemTemplate = require('./minibar-item-view.hbs');
var resolveRoomAvatar = require('gitter-web-shared/avatars/resolve-room-avatar-srcset');
var updateUnreadIndicatorClassState = require('../../../../components/menu/update-unread-indicator-class-state');
var toggleClass = require('utils/toggle-class');



module.exports = Marionette.ItemView.extend({
  tagName: 'li',
  template: itemTemplate,
  ui: {
    minibarButton: '.room-menu-options__item-button',
    unreadIndicatorWrapper: '.room-menu-options__item__unread-indicator-wrapper',
    unreadIndicator: '.room-menu-options__item__unread-indicator'
  },

  behaviors: {
    Tooltip: {
      '.room-menu-options__item-button': { placement: 'right' }
    }
  },

  modelEvents: {
    'change:unreadItems change:mentions change:activity': 'onUnreadUpdate',
    'change:active': 'onActiveStateUpdate',
    'focus:item': 'focusItem',
    'blur:item': 'blurItem'
  },
  events: {
    'click': 'onItemClicked',
  },
  attributes: function() {
    var type = this.model.get('type');

    //account for initial render
    var className = 'room-menu-options__item--' + type;
    if (this.model.get('active')) { className = className += ' active'; }
    var id = (type === 'org') ? this.model.get('name') : type;

    return {
      'class':             className,
      'data-state-change': type,
      id:                  'minibar-' + id
    };
  },

  initialize: function(options) {
    this.roomMenuModel = options.roomMenuModel;
    this.firstRender = true;
  },


  serializeData: function() {
    var data = this.model.toJSON();
    return _.extend({}, data, {
      isHome:            (data.type === 'all'),
      isSearch:          (data.type === 'search'),
      isFavourite:       (data.type === 'favourite'),
      isPeople:          (data.type === 'people'),
      isOrg:             (data.type === 'org'),
      isCommunityCreate: (data.type === 'community-create'),
      hasUnreadIndicators: (data.type === 'people' || data.type === 'org'),
      avatarSrcset:  resolveRoomAvatar({ uri: data.name }, 23)
    });
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


  onItemClicked: function() {
    this.trigger('minibar-item:activated', this.model);
  },

  onActiveStateUpdate: function() {
    var isActive = !!this.model.get('active');
    toggleClass(this.el, 'active', isActive);
    toggleClass(this.ui.minibarButton[0], 'focus', isActive);
  },

  onUnreadUpdate: function() {
    updateUnreadIndicatorClassState(this.model, this.ui.unreadIndicatorWrapper);
    updateUnreadIndicatorClassState(this.model, this.ui.unreadIndicator);

    this.pulseIndicators();
  },

  onRender: function() {
    if(!this.firstRender || this.firstRender && this.roomMenuModel && this.roomMenuModel.get('roomMenuIsPinned')) {
      this.onActiveStateUpdate();
    }

    this.firstRender = false;
  },


  focusItem: function() {
    this.ui.minibarButton.focus();
    toggleClass(this.ui.minibarButton[0], 'focus', true);
    this.trigger('minibar-item:keyboard-activated', this.model);
  },

  blurItem: function() {
    this.ui.minibarButton.blur();
    toggleClass(this.ui.minibarButton[0], 'focus', false);
  }

});
