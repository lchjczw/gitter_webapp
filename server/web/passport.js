/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var env                    = require('../utils/env');
var winston                = env.logger;
var errorReporter          = env.errorReporter;
var config                 = env.config;
var stats                  = env.stats;

var _                      = require('underscore');
var userService            = require('../services/user-service');
var passport               = require('passport');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy         = require('passport-http-bearer').Strategy;
var oauthService           = require('../services/oauth-service');
var mixpanel               = require('../web/mixpanelUtils');
var useragentStats         = require('./useragent-stats');
var GitHubStrategy         = require('troupe-passport-github').Strategy;
var GitHubMeService        = require('../services/github/github-me-service');

function installApi() {
  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate users based on an access token (aka a
   * bearer token).  The user must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(new BearerStrategy(
    function(accessToken, done) {

      return oauthService.validateAccessTokenAndClient(accessToken)
        .then(function(tokenInfo) {
          // Token not found
          if(!tokenInfo) return done();

          // Anonymous tokens cannot be used for Bearer tokens
          if(!tokenInfo.user) return done();

          var user = tokenInfo.user;
          var client = tokenInfo.client;
          // Not yet needed var accessToken = tokenInfo.accessToken;
          done(null, user, { client: client, accessToken: accessToken });
        })
        .fail(done);
    }
  ));
}

function install() {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function deserializeUserCallback(id, done) {
    userService.findById(id, function findUserByIdCallback(err, user) {
      if(err) return done(err);
      if(!user) return done();

      /* Todo: consider using a seperate object for the security user */
      return done(null, user);
    });

  });


  /* OAuth Strategies */


  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients.  They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens.  The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate.  Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header).  While this approach is not recommended by
   * the specification, in practice it is quite common.
   */

  passport.use(new ClientPasswordStrategy(
    function(clientKey, clientSecret, done) {
      oauthService.findClientByClientKey(clientKey, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret != clientSecret) { return done(null, false); }

        return done(null, client);
      });
    }
  ));

  /* Install the API OAuth strategy too */
  installApi();

  function githubOauthCallback(req, accessToken, refreshToken, params, _profile, done) {
    var githubMeService = new GitHubMeService({ githubUserToken: accessToken });
    return githubMeService.getUser()
      .then(function(githubUserProfile) {
        var requestedScopes = params.scope.split(/,/);
        var scopeHash = requestedScopes.reduce(function(memo, v) { memo[v] = true; return memo; }, {});

        if (req.user && req.session.githubScopeUpgrade) {
          req.user.githubToken = accessToken;
          req.user.githubScopes = scopeHash;

          req.user.save(function(err) {
            winston.info('passport: User updated with token');
            if(err) done(err);
            return done(null, req.user);
          });

        } else {
          return userService.findByGithubIdOrUsername(githubUserProfile.id, githubUserProfile.login)
            .then(function(user) {
              // Update an existing user
              if(user) {
                user.username         = githubUserProfile.login;
                user.displayName      = githubUserProfile.name || githubUserProfile.login;
                user.gravatarImageUrl = githubUserProfile.avatar_url;
                user.githubId         = githubUserProfile.id;
                user.githubUserToken  = accessToken;

                user.save(function(err) {
                  if (err) winston.error("Failed to update GH token for user ", user.username);

                  // Tracking
                  var properties = useragentStats(req.headers['user-agent']);
                  stats.userUpdate(user, properties);

                  stats.event("user_login", _.extend({
                    userId: user.id,
                    method: 'github_oauth',
                    username: user.username
                  }, properties));

                  // Login
                  req.logIn(user, function(err) {
                    if (err) { return done(err); }

                    // Remove the old token for this user
                    if(req.session) req.session.accessToken = null;
                    return done(null, user);
                  });

                });

                return;
              }

              // This is in fact a new user
              var githubUser = {
                username:           githubUserProfile.login,
                displayName:        githubUserProfile.name || githubUserProfile.login,
                emails:             githubUserProfile.email ? [githubUserProfile.email] : [],
                gravatarImageUrl:   githubUserProfile.avatar_url,
                githubUserToken:    accessToken,
                githubId:           githubUserProfile.id,
                status:             'ACTIVE',
                source:             'landing_github'
              };

              winston.verbose('About to create GitHub user ', githubUser);

              userService.findOrCreateUserForGithubId(githubUser, function(err, user) {
                if (err) return done(err);

                winston.verbose('Created GitHub user ', user.toObject());

                req.logIn(user, function(err) {
                  if (err) { return done(err); }
                  stats.event("new_user", {
                    userId: user.id,
                    distinctId: mixpanel.getMixpanelDistinctId(req.cookies),
                    method: 'github_oauth',
                    username: user.username
                  });

                  return done(null, user);
                });
              });
            });
        }

      })
      .fail(function(err) {
        errorReporter(err, { oauth: "failed" });
        stats.event("oauth_profile.error");
        winston.error('Error during oauth process. Unable to obtain user profile.', err);

        return done(err);
      });
  }

  var userStrategy = new GitHubStrategy({
      clientID:     config.get('github:user_client_id'),
      clientSecret: config.get('github:user_client_secret'),
      callbackURL:  config.get('web:basepath') + '/login/callback',
      skipUserProfile: true,
      passReqToCallback: true
    }, githubOauthCallback);
  userStrategy.name = 'github_user';
  passport.use(userStrategy);

  var upgradeStrategy = new GitHubStrategy({
      clientID:     config.get('github:client_id'),
      clientSecret: config.get('github:client_secret'),
      callbackURL:  config.get('web:basepath') + '/login/callback',
      skipUserProfile: true,
      passReqToCallback: true
    }, githubOauthCallback);
  upgradeStrategy.name = 'github_upgrade';
  passport.use(upgradeStrategy);

}

module.exports = {
  installApi: installApi,
  install: install
};
