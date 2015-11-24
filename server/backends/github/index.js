'use strict';

var gitHubEmailAddressService = require('./github-email-address-service');
var restSerializer = require("../../serializers/rest-serializer");
var GithubMe = require('gitter-web-github').GitHubMeService;

function GitHubBackend(user, identity) {
  this.user = user;
  this.identity = identity;
}

GitHubBackend.prototype.getEmailAddress = function(preferStoredEmail) {
  return gitHubEmailAddressService(this.user, preferStoredEmail);
};

GitHubBackend.prototype.getSerializedOrgs = function() {
  var user = this.user;
  var ghUser = new GithubMe(user);
  return ghUser.getOrgs()
    .then(function(ghOrgs) {
      var strategyOptions = { currentUserId: user.id };
      var strategy = new restSerializer.GithubOrgStrategy(strategyOptions);
      return restSerializer.serializeExcludeNulls(ghOrgs, strategy);
    });
};

module.exports = GitHubBackend;