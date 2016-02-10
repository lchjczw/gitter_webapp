"use strict";

var env = require('gitter-web-env');
var config = env.config;

var Q = require('q');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var userService = require('../../services/user-service');
var trackSignupOrLogin = require('../../utils/track-signup-or-login');
var updateUserLocale = require('../../utils/update-user-locale');

function linkedinOauth2Callback(req, accessToken, refreshToken, profile, done) {
  var avatar = profile.photos[0].value; // is this always set?

  var linkedinUser = {
    username: profile.id+'_linkedin',
    displayName: profile.displayName,
    gravatarImageUrl: avatar
  };
  var linkedinIdentity = {
    provider: 'linkedin',
    providerKey: profile.id,
    displayName: profile.displayName,
    email: profile.email,
    // LinkedIn accessTokens only live 60 days
    accessToken: accessToken,
    // appears to be undefined for LinkedIn
    //https://github.com/auth0/passport-linkedin-oauth2/issues/18
    refreshToken: refreshToken,
    avatar: avatar
  };
  var user;
  return userService.findOrCreateUserForProvider(linkedinUser, linkedinIdentity)
    .spread(function(_user, isNewUser) {
      user = _user;

      trackSignupOrLogin(req, user, isNewUser);
      updateUserLocale(req, user);

      // blegh
      var deferred = Q.defer();
      req.logIn(user, function(err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise;
    })
    .then(function() {
      done(null, user);
    })
    .catch(done);
}

var linkedInStrategy = new LinkedInStrategy({
    clientID: config.get('linkedinoauth2:client_id'),
    clientSecret: config.get('linkedinoauth2:client_secret'),
    callbackURL: config.get('web:basepath') + '/login/linkedin/callback',
    // see https://github.com/auth0/passport-linkedin-oauth2/issues/2
    // (scope only works here and not when calling passport.authorize)
    scope: ['r_basicprofile', 'r_emailaddress'],
    passReqToCallback: true
  }, linkedinOauth2Callback);

linkedInStrategy.name = 'linkedin';

module.exports = linkedInStrategy;