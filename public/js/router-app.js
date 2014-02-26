/*jshint strict:true, undef:true, unused:strict, browser:true *//* global require:false */
require([
  'utils/appevents',
  'utils/context',
  'views/app/appIntegratedView',
  'views/toolbar/troupeMenu',
  'collections/instances/troupes',
  'components/titlebar',
  'components/realtime',
  'views/widgets/preload',            // No ref
  'components/webNotifications',      // No ref
  'components/desktopNotifications',  // No ref
  'template/helpers/all',             // No ref
  'components/bug-reporting',         // No ref
  'components/csrf'                   // No ref
], function(appEvents, context, AppIntegratedView, TroupeMenuView, troupeCollections, TitlebarUpdater, realtime) {
  "use strict";

  var chatIFrame = document.getElementById('content-frame');
  if(window.location.hash) {
    chatIFrame.src = chatIFrame.src + window.location.hash;
  }

  var appView = new AppIntegratedView({ });

  appView.leftMenuRegion.show(new TroupeMenuView({ }));

  function updateContent(state) {
    if(state) {
      // TODO: update the title....
      context.setTroupeId(undefined);
      chatIFrame.src = state+window.location.hash;
    }
  }

  var titlebarUpdater = new TitlebarUpdater();

  var allRoomsCollection = troupeCollections.troupes;
  allRoomsCollection.on("remove", function(model) {
    if(model.id == context.getTroupeId()) {
      var username = context.user().get('username');
      var newLocation = '/' + username;
      var newFrame = newLocation + '/~home';
      var title = '';

      titlebarUpdater.setRoomName(title);

      window.history.pushState(newFrame, title, newLocation);
      updateContent(newFrame);
    }
  });

  appEvents.on('navigation', function(url, type, title) {
    // This is a bit hacky..
    // Add a /-/ if the path only has one component
    // so /moo/ goes to /moo/-/chat but
    // /moo/foo goes to /moo/foo/chat
    var frameUrl = url + '/~' + type;
    titlebarUpdater.setRoomName(title);

    window.history.pushState(frameUrl, title, url);
    updateContent(frameUrl);
  });

  // Revert to a previously saved state
  window.addEventListener('popstate', function(event) {
    updateContent(event.state);
  });

  window.addEventListener('message', function(e) {
    if(e.origin !== context.env('basePath')) return;

    var message = JSON.parse(e.data);
    switch(message.type) {
      case 'context.troupeId':
        context.setTroupeId(message.troupeId);
        titlebarUpdater.setRoomName(message.name);
        break;
      case 'navigation':
        appEvents.trigger('navigation', message.url, message.urlType, message.title);
        break;
      case 'realtime.testConnection':
        realtime.testConnection();
        break;
    }
  });

  // Asynchronously load tracker
  require([
    'utils/tracking'
  ], function(/*tracking*/) {
    // No need to do anything here
  });
});
