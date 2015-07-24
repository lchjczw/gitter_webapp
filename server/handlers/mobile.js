"use strict";

var ensureLoggedIn = require('../web/middlewares/ensure-logged-in');
var converter      = require('../web/url-converter');
var appRender      = require('./app/render');
var express        = require('express');
var identifyRoute  = require('gitter-web-env').middlewares.identifyRoute;

var router = express.Router({ caseSensitive: true, mergeParams: true });

router.get('/embedded-chat',
  identifyRoute('mobile-embedded-chat'),
  appRender.renderMobileNativeEmbeddedChat);

router.get('/home',
  ensureLoggedIn,
  identifyRoute('mobile-home'),
  appRender.renderMobileNativeUserhome);


router.get('/redirect',
  ensureLoggedIn,
  identifyRoute('mobile-home-redirect'),
  function(req, res, next) {
    var desktopUrl = req.query.desktopUrl;
    converter.desktopToMobile(desktopUrl, req.user)
      .then(function(mobileUrl) {
        res.redirect(mobileUrl);
      })
      .fail(next);
  });

module.exports = router;
