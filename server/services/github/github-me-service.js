/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var Q = require('q');
var wrap = require('./github-cache-wrapper');
var createClient = require('./github-client');
var badCredentialsCheck = require('./bad-credentials-check');

function GitHubMeService(user) {
  this.user = user;
  this.client = createClient.user(user);
}

GitHubMeService.prototype.getUser = function() {
  var d = Q.defer();

  var ghme = this.client.me();
  ghme.info(d.makeNodeResolver());

  return d.promise
    .fail(badCredentialsCheck);
};

GitHubMeService.prototype.getEmails = function() {
  var d = Q.defer();

  var ghme = this.client.me();
  ghme.emails(d.makeNodeResolver());

  return d.promise
    .fail(badCredentialsCheck);
};

GitHubMeService.prototype.getOrgs = function() {
  var d = Q.defer();

  var ghme = this.client.me();
  ghme.orgs(d.makeNodeResolver());

  return d.promise
    .fail(badCredentialsCheck);
};

// module.exports = GitHubMeService;
module.exports = wrap(GitHubMeService, function() {
  return [this.user && (this.user.githubUserToken || this.user.githubToken) || ''];
});
