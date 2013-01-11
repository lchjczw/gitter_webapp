

require([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'views/base',
  'components/chat/chat-component',
  'views/app/appIntegratedView',
  'views/chat/chatView',
  'views/file/fileView',
  'views/conversation/conversationView',
  'utils/vent',
  'collections/troupes',
  'collections/files',
  'collections/conversations',
  'views/file/fileDetailView',
  'views/file/filePreviewView',
  'views/file/fileVersionsView',
  'views/conversation/conversationDetailView',
  'views/toolbar/troupeCollectionView'
], function($, _, Backbone, Marionette, TroupeViews, chat, AppIntegratedView, ChatView, FileView, ConversationView, vent, troupeModels, fileModels, conversationModels, FileDetailView, filePreviewView, fileVersionsView, conversationDetailView, TroupeCollectionView) {
  /*jslint browser: true*/
  /*global require console */
  "use strict";

  $(document).on("click", "a", function(event) {
    if(this.href) {
      var href = $(this).attr('href');
      if(href.substring(0, 2) === "#|") {
        event.preventDefault();

        href = href.substring(2);

        var currentFragment;
        var hash = window.location.hash;

        if(!hash) {
          currentFragment = '#';
        } else {
          currentFragment = hash.split('|', 1)[0];
        }

        window.location = currentFragment + "|" + href;
      }
    }

    return true;
  });

  // Make drop down menus drop down
  $(document).on("click", ".trpButtonDropdown .trpButtonMenu", function(event) {
    $(this).parent().next().toggle();
  });

  var app = new Marionette.Application();
  app.addRegions({
    leftMenuRegion: "#left-menu",
    chatRegion: "#chat-frame",
    peopleRosterRegion: "#people-roster",
    fileRegion: "#file-list",
    mailRegion: "#mail-list",
    rightPanelRegion: "#right-panel"
  });

  chat.connect();

  /* This is a special region which acts like a region, but is implemented completely differently */
  app.dialogRegion = {
    currentView: null,
    show: function(view) {
      if(this.currentView) {
        console.log("Closing view: " + this.currentView);
        this.currentView.fade = false;
        this.currentView.hideInternal();
      }
      this.currentView = view;
      view.navigable = true;
      view.show();
    },
    close: function() {
      if(this.currentView) {
        console.log("Closing view: " + this.currentView);
        this.currentView.navigationalHide();
        this.currentView = null;
      }
    }
  };

  var router;
  var fileCollection, conversationCollection, troupeCollection;
  var appView = new AppIntegratedView({ app: app });

  var Router = Backbone.Router.extend({
    initialize: function(options) {
      this.regionsFragments = {};
      this.route(/^(.*?)$/, "handle");
    },

    regionFragmentMapping: [
      'rightPanelRegion',
      'dialogRegion'
    ],

    getViewDetails: function(fragment) {

      var routes = [
        { re: /^file\/(\w+)$/,            viewType: FileDetailView,               collection: fileCollection },
        { re: /^file\/preview\/(\w+)$/,   viewType: filePreviewView.Modal,        collection: fileCollection },
        { re: /^file\/versions\/(\w+)$/,  viewType: fileVersionsView.Modal,       collection: fileCollection },
        { re: /^mail\/(\w+)$/,            viewType: conversationDetailView.Modal, collection: conversationCollection }
      ];

      var match = null;
      _.any(routes, function(route) {
        if(route.re.test(fragment)) {
          match = route;
          return true;
        }
      });

      if(!match) return null;

      var result = match.re.exec(fragment);

      return {
        viewType: match.viewType,
        collection: match.collection,
        id: result[1]
      };
    },

    handle: function(path) {
      var parts = path.split("|");

      this.regionFragmentMapping.forEach(function(regionName, index) {
        var fragment = parts[index] ? parts[index] : "";

        if(fragment.substring(0, 1) === '#') {
          fragment = fragment.substring(1);
        }

        var region, viewDetails;

        function loadItemIntoView() {
          var model = viewDetails.collection.get(viewDetails.id);

          var cv = region.currentView;

          if(cv instanceof viewDetails.viewType &&
            cv.supportsModelReplacement &&
            cv.supportsModelReplacement()) {
            cv.replaceModel(model);
          } else {
            var view = new viewDetails.viewType({ model: model, collection: viewDetails.collection });
            region.show(view);
          }
        }

        if(this.regionsFragments[regionName] !== fragment) {
          this.regionsFragments[regionName] = fragment;

          region = app[regionName];

          if(fragment) {
            // lookup handler:
            viewDetails = this.getViewDetails(fragment);

            if(viewDetails) {
              if(viewDetails.collection.length === 0) {
                viewDetails.collection.once('reset', loadItemIntoView, this);
              } else {
                loadItemIntoView();
              }
              return;
            }
          }

          region.close();
        } else {
          // This hasn't changed....
        }
      }, this);
    }

  });

  app.addInitializer(function(options){
    var chatView = new ChatView();
    app.chatRegion.show(chatView);

    fileCollection = new fileModels.FileCollection();
    fileCollection.listen();
    fileCollection.fetch();

    var fileView = new FileView({
      collection: fileCollection
    });
    app.fileRegion.show(fileView);

    conversationCollection = new conversationModels.ConversationCollection();
    conversationCollection.listen();
    conversationCollection.fetch();

    var conversationView = new ConversationView({
      collection: conversationCollection
    });

    app.mailRegion.show(conversationView);

    troupeCollection = new troupeModels.TroupeCollection();
    troupeCollection.fetch();

    var troupeCollectionView = new TroupeCollectionView({
      collection: troupeCollection
    });

    app.leftMenuRegion.show(troupeCollectionView);
  });

  app.on("initialize:after", function(){
    router = new Router({});

    router.initialize();
    Backbone.history.start();

    console.log("History started");
  });

  // Asynchronously load tracker
  /*
  not working with marionette yet
  require([
    'utils/tracking'
  ], function(tracking) {
    // No need to do anything here
  });
  */

  app.start();

  return app;
});
