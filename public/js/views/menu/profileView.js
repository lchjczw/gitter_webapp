"use strict";
var context = require('utils/context');
var Marionette = require('backbone.marionette');
var appEvents = require('utils/appevents');
var isMobile = require('utils/is-mobile');
var isNative = require('utils/is-native');
var template = require('./tmpl/profile.hbs');
var logout = require('utils/logout');

require('views/behaviors/widgets');

module.exports = (function () {

  return Marionette.ItemView.extend({
    template: template,
    className: 'menu-header',
    events: {
      "click #link-home": 'homeClicked',
      "click #link-logout": 'logoutClicked'
    },

    behaviors: {
      Widgets: {}
    },

    modelEvents: {
      'change': 'render'
    },

    serializeData: function () {
      var userModel = context.user().toJSON();
      var isMobileResult = isMobile();
      var isNativeResult = isNative();

      return {
        menuHeaderExpanded: this.model.get('menuHeaderExpanded'),
        isMobile: isMobileResult,
        user: userModel,
        billingUrl: context.env('billingUrl'),
        showBilling: !isMobileResult,
        showGetApps: !isMobileResult && !isNativeResult,
        showSignout: !isNativeResult
      };
    },

    homeClicked: function (e) {
      e.preventDefault();
      if (context().user.url !== window.location.pathname) {
        appEvents.trigger('navigation', context.getUser().url, 'home', '');
      }
    },

    logoutClicked: function(e) {
      e.preventDefault();
      logout();
    }
  });

})();
