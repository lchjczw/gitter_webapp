'use strict';

var GithubRepo = require('gitter-web-github').GitHubRepoService;

module.exports = function starredRepos(user) {
  var ghRepo = new GithubRepo(user);

  return ghRepo.getRecentlyStarredRepos()
    .then(function(starredRepos) {
      return starredRepos
        .filter(function(repo) {
          // dont suggest forks as when the urls are shortened in the client,
          // they look identical to the originals and people get angry

          return !repo.fork;
        })
        .map(function(repo) {
          return {
            uri: repo.full_name,
            githubRepo: repo,
            githubType: 'REPO',
            language: repo.language,
            is_starred_by_user: true
          };
        });
    });
};
