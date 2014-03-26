/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var nconf = require('../utils/config');

if(!nconf.get('test:exposeDataForTestingPurposes')) {
  module.exports = { install: function() {} };
} else {

  // This would be very insecure in a production environment, but we do it in testing to aid our
  // testing processes

  var userService = require("../services/user-service");
  var troupeService = require("../services/troupe-service");
  var oauthService = require('../services/oauth-service');
  var userConfirmationService = require('../services/user-confirmation-service');
  var persistence = require('../services/persistence-service');
  var winston = require('../utils/winston');
  var child_process = require('child_process');
  var uuid = require('node-uuid');

  winston.warn('Warning: confidential data is being exposed for testing purposes!');

  module.exports = {
    install: function(app) {

      app.get('/testdata/oauthToken', function(req, res, next) {
        var email = req.query.email;

        if(!email || !email.match(/troupetest\.local$/)) return next(401);

        return userService.findByEmail(email)
          .then(function(user) {
            if(!user) throw 404;
            return oauthService.findOrGenerateWebToken(user.id);
          })
          .then(function(token) {
            res.send(token);
          })
          .fail(next);
      });

      app.get('/testdata/reset', function(req, res) {
        child_process.exec('make reset-test-data');
        child_process.execFile('scripts/dataupgrades/005-test-users/001-update.sh');
        res.send(200);
      });

      app.get('/testdata/newUser', function(req, res) {
        var name = 'testuser-' + uuid.v4();
        var options = {
          displayName: 'Mr ' + name,
          email: name+'@troupetest.local',
        };

        userService.findOrCreateUserForEmail(options)
          .then(userConfirmationService.confirmSignup)
          .then(function(user) {
              user.userId = user._id;
              user.password = 'password';
              user.username = name;
              return userService.updateProfile(user);
          })
          .then(function(user) { res.send(user); })
          .fail(function(err) { res.send(500, err); });

      });

      app.get('/testdata/newTroupeForUser', function(req, res) {
        var id = req.body.id || req.query.id;
        userService.findById(id)
        .then(function(user) {
          return troupeService.createNewTroupeForExistingUser({
            user: user,
            name: 'test troupe'
          });
        })
        .then(function(troupe) { res.send(troupe); })
        .fail(function(err) { res.send(500, err); });
      });

      app.get('/testdata/confirmationCodeForEmail', function(req, res/*, next */) {
        var forEmail = req.body.email || req.query.email;

        userService.findByEmail(forEmail, function(e, user) {
          if (e || !user) return res.send(404, "No user with that email signed up.");

          res.send(user.confirmationCode);
        });
      });

      app.get('/testdata/confirmationCodeForSecondary', function(req, res) {
        var forEmail = req.body.email || req.query.email;

        userService.findByUnconfirmedEmail(forEmail, function(e, user) {
          if (e || !user) return res.send(404, "No user with that email signed up.");

          var confirmationCode = user.unconfirmedEmails.filter(function(e) { return e.email == forEmail; })[0].confirmationCode;
          console.log("sending confirmationCode" + confirmationCode);

          res.send(confirmationCode);
        });

      });

      app.get('/testdata/confirmationLink', function(req, res, next) {

        persistence.User.findOne({ email:  req.query.email }, null, { sort: { '_id': -1 } }, function(err, user) {
          if(err) return next(err);
          if(!user) return next(404);

          res.send("/confirm/" + user.confirmationCode);

        });
      });

      app.get('/testdata/inviteAcceptLink', function(req, res, next) {

        userService.findByEmail(req.query.email, function(err, user) {
          if (user) {
            res.redirect('/testdata/inviteAcceptLinkByUserId?userId=' + user.id);
          }
          else {
            persistence.Invite.findOne({ email: req.query.email }, null, { sort: { '_id': -1 } }, function(err, invite) {
              if(err) return next(err);
              if(!invite) return next(404);

              persistence.Troupe.findById(invite.troupeId, function(err, troupe) {
                if(err) return next(err);
                if(!troupe) return next(404);

                res.send("/" + troupe.uri + "/accept/" + invite.code);
              });
            });
          }
        });

      });

      app.get('/testdata/inviteAcceptLinkByUserId', function(req, res, next) {

        userService.findById(req.query.userId, function(err, user) {
          if(err) return next(err);
          if(!user) return next("User not found");

          persistence.Invite.findOne({ userId: req.query.userId }, null, { sort: { '_id': -1 } }, function(err, invite) {
            if(err) return next(err);
            if(!invite) return next("Invite not found");

            persistence.Troupe.findById(invite.troupeId, function(err, troupe) {
              if(err) return next(err);
              if(!troupe) return next("Troupe not found");

              res.send("/" + troupe.uri + "/accept/" + ((invite.code) ? invite.code : ''));
            });
          });
        });

      });

      app.get('/testdata/oneToOneLink', function(req, res, next) {
        persistence.User.findOne({ email:  req.query.email }, function(err, user) {
          if(err) return next(err);
          if(!user) return next(404);

          res.send("/one-one/" + user.id);
        });
      });

    }
  };
}
