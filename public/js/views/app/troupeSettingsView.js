"use strict";
var Marionette = require('backbone.marionette');
var $ = require('jquery');
var _ = require('underscore');
var context = require('utils/context');
var apiClient = require('components/apiClient');
var TroupeViews = require('views/base');
var itemCollections = require('collections/instances/integrated-items');
var troupeSettingsTemplate = require('./tmpl/troupeSettingsTemplate.hbs');
var log = require('utils/log');
var notifications = require('components/notifications');

module.exports = (function() {



  var View = Marionette.ItemView.extend({
    template: troupeSettingsTemplate,
    events: {
      'click #save-troupe-settings': 'saveSettings',
      'click #close-settings' : 'destroySettings',
      'click #enable-lurk-mode' : 'enableLurkMode',
      'change #notification-options' : 'formChange',
      'change #unread-checkbox' : 'formChange'
    },

    initialize: function() {
      this.model = context.troupe();
      this.userCollection = itemCollections.users;

      this.listenTo(this.model, 'change:lurk', this.setShowUnreadBadgeValue);
      var self = this;
      apiClient.userRoom.get('/settings/notifications')
        .then(function(settings) {
          self.settings = settings && settings.push || "all";
          self.$el.find("#notification-options").val(self.settings);
          // self.trigger('settingsLoaded', settings);
          self.setLurkButton();
        })
        .fail(function() {
          log.info('An error occurred while communicating with notification settings');
        });
    },

    formChange: function() {
      this.saveSettings();
    },

    enableLurkMode: function() {
      this.$el.find('#notification-options').val("mention");
      this.$el.find('#unread-checkbox').prop('checked', true);
      this.saveSettings();
      this.destroySettings();
    },

    setShowUnreadBadgeValue: function() {
      var lurk = this.model.get('lurk');
      this.el.querySelector("#unread-checkbox").checked = lurk;
    },

    setLurkButton: function() {
      if (this.$el.find('#unread-checkbox').prop('checked') && (this.$el.find('#notification-options').val() == "mention" || this.$el.find('#notification-options').val() == "mute")) {
        this.$el.find('#enable-lurk-mode').hide();
        this.$el.find('#is-lurking').show();
      }
      else {
        this.$el.find('#is-lurking').hide();
        this.$el.find('#enable-lurk-mode').show();
      }
    },

    destroySettings : function () {
      this.dialog.hide();
      this.dialog = null;
    },

    onRender: function() {
      if (this.settings) {
        this.setLurkButton();
        this.$el.find("#notification-options").val(this.settings);
      }
    },

    serializeData: function() {
      return _.extend({},
        context.getTroupe(), {
          lurk: context.troupe().get('lurk'),
          notificationsBlocked: notifications.hasBeenDenied(),
          isNativeDesktopApp: context().isNativeDesktopApp,
          troupeUrl: '//' + window.location.host + window.location.pathname
        });
    },

    saveSettings: function(e) {
      if(e) e.preventDefault();

      var self = this;
      var push = self.$el.find("#notification-options").val();
      var lurk = self.el.querySelector("#unread-checkbox").checked;

      function done() {
        self.setLurkButton();
      }

      apiClient.userRoom.put('/settings/notifications', { push: push })
        .then(done);

      apiClient.userRoom.put('', { lurk: lurk })
        .then(done);

    }
  });

  return TroupeViews.Modal.extend({
      initialize: function(options) {
        options.title = "Settings";
        TroupeViews.Modal.prototype.initialize.apply(this, arguments);
        this.view = new View({ });
      }
    });
  
})();

