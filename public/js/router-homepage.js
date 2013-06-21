/*jshint unused:true, browser:true*/
require([
  'jquery',
  'underscore',
  'backbone',
  'backbone.keys', // no ref
  'marionette',
  'template/helpers/all',
  'views/base',
  'components/dozy',
  'views/app/appIntegratedView',
  'collections/instances/troupes',
  'views/profile/profileView',
  'views/signup/createTroupeView',
  'hbs!./views/app/tmpl/appHeader',
  'components/webNotifications',
  'views/toolbar/troupeMenu',
  'utils/router',
  'components/errorReporter'
], function($, _, Backbone, _backboneKeys, Marionette, _Helpers, TroupeViews, dozy, AppIntegratedView, troupeCollections,
  profileView, createTroupeView, headerViewTemplate, webNotifications, TroupeMenuView, Router /*, errorReporter , FilteredCollection */) {
  "use strict";

  var app = new Marionette.Application();
  app.collections = {};
  app.addRegions({
    rightPanelRegion: "#right-panel",
    headerRegion: "#header-region"
  });

  /* This is a special region which acts like a region, but is implemented completely differently */
  app.dialogRegion = {
    currentView: null,
    show: function(view) {
      if(this.currentView) {
        this.currentView.fade = false;
        this.currentView.hideInternal();
      }
      this.currentView = view;
      view.navigable = true;
      view.show();
    },
    close: function() {
      if(this.currentView) {
        this.currentView.navigationalHide();
        this.currentView = null;
      }
    }
  };

  var router;
  new AppIntegratedView({ app: app });
  new TroupeMenuView({ app: app });

  app.addInitializer(function(/*options*/){

    var headerView = new (TroupeViews.Base.extend({
      template: headerViewTemplate,
      getRenderData: function() {
        return { user: window.troupeContext.user, troupeContext: troupeContext };
      }
    }))();

    app.headerRegion.show(headerView);

    $('#mail-list').hide();
  });

  app.on("initialize:after", function(){
    router = new Router({
      routes: [
        { name: "profile",        re: /^profile$/,                viewType: profileView.Modal },
        { name: "create",         re: /^create$/,                 viewType: createTroupeView.Modal, collection: troupeCollections.troupes,   skipModelLoad: true }
      ],
      app: app
    });

    Backbone.history.start();
  });

  // Asynchronously load tracker
  require([
    'utils/tracking'
  ], function(/*tracking*/) {
    // No need to do anything here
  });


  app.start();
  window._troupeDebug = {
    app: app
  };

  return app;
});
