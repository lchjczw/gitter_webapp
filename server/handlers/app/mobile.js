/*jshint globalstrict: true, trailing: false, unused: true, node: true */
"use strict";

var ensureLoggedIn = require('../../web/middlewares/ensure-logged-in');
var appRender = require('./render');

module.exports = {
  install: function(app) {
    app.get('/mobile/chat', ensureLoggedIn, function(req, res, next) {
      appRender.renderMobileNativeChat(req, res, next);
    });
    app.get('/mobile/home', ensureLoggedIn, function(req, res, next) {
      appRender.renderMobileNativeUserhome(req, res, next);
    });
  }
};
