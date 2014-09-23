/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var Q = require('q');
var wrap = require('./github-cache-wrapper');
var createClient = require('./github-client');
var badCredentialsCheck = require('./bad-credentials-check');

function GitHubRepoService(user) {
  this.user = user;
  this.client = createClient.full(user);
  this.firstPageClient = createClient.full(user, { firstPageOnly: true });
}


/**
 * Returns the information about the specified repo
 * @return the promise of information about a repo
 */
 GitHubRepoService.prototype.getRepo = function(repo) {
  var ghrepo = this.client.repo(repo);
  var d = Q.defer();
  ghrepo.info(createClient.makeResolver(d));
  return d.promise
    .fail(badCredentialsCheck)
    .fail(function(err) {
      if(err.statusCode == 404) return;
      throw err;
    });
};

/**
 *
 */
 GitHubRepoService.prototype.getCollaborators = function(repo) {
  var ghrepo = this.client.repo(repo);
  var d = Q.defer();
  ghrepo.collaborators(createClient.makeResolver(d));
  return d.promise
    .fail(badCredentialsCheck)
    .fail(function(err) {
      if(err.statusCode == 404) return;
      throw err;
    });
};

/**
 * 
 */
 GitHubRepoService.prototype.getCommits = function(repo, options) {
  options = options || {};
  var ghrepo = (options.firstPage ? this.firstPageClient : this.client).repo(repo, options);
  var d = Q.defer();
  ghrepo.commits(createClient.makeResolver(d));
  return d.promise
    .fail(badCredentialsCheck)
    .fail(function(err) {
      if(err.statusCode == 404) return;
      throw err;
    });
};


/**
 *  Returns repo stargazers
 */
 GitHubRepoService.prototype.getStargazers = function(repo) {
  var ghrepo = this.client.repo(repo);
  var d = Q.defer();
  ghrepo.stargazers(createClient.makeResolver(d));
  return d.promise
    .fail(badCredentialsCheck)
    .fail(function(err) {
      if(err.statusCode == 404) return;
      throw err;
    });
};



function getIssuesWithState(repo, state) {
  var d = Q.defer();

  repo.issues({ state: state }, function(err, body) {
    if(err) return d.reject(err);

    d.resolve(body);
  });

  return d.promise
    .fail(badCredentialsCheck);
}

/**
 * Returns a promise of the issues for a repo
 */
 GitHubRepoService.prototype.getIssues = function(repoName) {
  var repo = this.client.repo(repoName);
  return Q.all([
    getIssuesWithState(repo, 'open'),
    getIssuesWithState(repo, 'closed')
    ]).spread(function(openIssues, closedIssues) {
      var issues = [];
      openIssues.forEach(function(issue) {
        issues[issue.number] = issue;
      });
      closedIssues.forEach(function(issue) {
        issues[issue.number] = issue;
      });
      return issues;
    })
    .fail(badCredentialsCheck);

};


GitHubRepoService.prototype.getRecentlyStarredRepos = function() {
  var d = Q.defer();

  var ghme = this.firstPageClient.me();
  ghme.starred(createClient.makeResolver(d));

  return d.promise
    .fail(badCredentialsCheck);

};

GitHubRepoService.prototype.getWatchedRepos = function() {
  var d = Q.defer();

  var ghme = this.client.me();
  ghme.watched(createClient.makeResolver(d));

  return d.promise
    .fail(badCredentialsCheck);
};

GitHubRepoService.prototype.getRepos = function() {
  var d = Q.defer();

  var ghme = this.client.me();
  ghme.repos(createClient.makeResolver(d));

  return d.promise
    .fail(badCredentialsCheck);
};


GitHubRepoService.prototype.getReposForUser = function(username, options) {
  var d = Q.defer();
  options = options || {};

  var ghme = (options.firstPage ? this.firstPageClient : this.client).user(username);
  ghme.repos(createClient.makeResolver(d));

  return d.promise
    .fail(badCredentialsCheck);
};


// module.exports = GitHubRepoService;
module.exports = wrap(GitHubRepoService, function() {
  return [this.user && (this.user.githubToken || this.user.githubUserToken) || ''];
});
