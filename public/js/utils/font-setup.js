'use strict';

var FontFaceObserver = require('fontfaceobserver');
var RAF = require('./raf');
var cookie = require('tiny-cookie');

//We only want to observer events for the default font
var font = new FontFaceObserver('source-sans-pro', {
  weight: 'normal'
});

font.load().then(function() {
  RAF(function() {
    document.documentElement.className += ' fonts-loaded';
    //Store a cookie to say the fonts have been loaded and should be cached
    var now = new Date();
    //TODO this is set 11months from now but should follow our caching rules
    now.setMonth(now.getMonth() + 11);
    cookie.set('webfontsLoaded', true, { expires: now.toGMTString() });
  });
});
