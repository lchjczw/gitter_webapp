/*jshint globalstrict: true, trailing: false, unused: true, node: true */
"use strict";

var Mirror = require("../../../services/github/mirrors/repo-then-user-scope-mirror");

module.exports = function(req, res, next) {
  if(!req.user) return next(403);

  var githubUri = 'repos/'+req.route.params[0];
  var mirror = new Mirror(req.user);

  mirror.get(githubUri).then(function(body) {
    res.send(body);
  }).fail(next);

};