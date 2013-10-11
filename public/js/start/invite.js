/*jshint strict:true, undef:true, unused:strict, browser:true *//* global define:false */
define([
  'jquery',
  'views/shareSearch/shareSearchView',
  'utils/appevents'
], function($, shareSearch, appevents) {
  "use strict";

  return function() {
    var hasInvitedSomeone = false;

    var shareSearchView = new shareSearch.View({
      el: $('.trpStartContent')
    });
    shareSearchView.afterRender();

    appevents.on('searchSearchView:success', function(name) {
      hasInvitedSomeone = true;
      $('.help').text(name + ' has been invited.');
    });

    $('#next-button').on('click', function() {
      if(hasInvitedSomeone) {
        window.location.href = '/start/finish';
      }
    });

  };
});
