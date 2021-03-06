'use strict';

process.env.DISABLE_API_LISTEN = '1';

var Promise = require('bluebird');
var assert = require('assert');
var fixtureLoader = require('gitter-web-test-utils/lib/test-fixtures');
var groupService = require('gitter-web-groups/lib/group-service');

describe('user-repos #slow', function() {
  var app, request;

  fixtureLoader.ensureIntegrationEnvironment(
    '#integrationUser1',
    '#integrationCollabUser1',
    'GITTER_INTEGRATION_REPO',
    'GITTER_INTEGRATION_REPO_WITH_COLLAB_ONLY_READ',
    '#oauthTokens'
  );

  before(function() {
    if (this._skipFixtureSetup) return;

    request = require('supertest-as-promised')(Promise);
    app = require('../../server/api');
  });

  var fixture = fixtureLoader.setup({
    deleteDocuments: {
      Group: [
        { 'sd.type': 'GH_REPO', 'sd.linkPath': fixtureLoader.GITTER_INTEGRATION_REPO_FULL },
        { lcUri: fixtureLoader.GITTER_INTEGRATION_COMMUNITY.toLowerCase() }
      ],
      Troupe: [
        { 'sd.type': 'GH_REPO', 'sd.linkPath': fixtureLoader.GITTER_INTEGRATION_REPO_FULL },
        { lcUri: fixtureLoader.GITTER_INTEGRATION_COMMUNITY.toLowerCase() + '/community' }
      ]
    },
    user1: '#integrationUser1',
    user2: '#integrationCollabUser1'
  });

  it('GET /v1/user/:userId/repos', function() {
    return request(app)
      .get('/v1/user/' + fixture.user1.id + '/repos')
      .set('x-access-token', fixture.user1.accessToken)
      .expect(200)
      .then(function(result) {
        var repos = result.body;

        assert(
          repos.some(function(repo) {
            return repo.name === fixtureLoader.GITTER_INTEGRATION_REPO_FULL;
          })
        );
      });
  });

  it('GET /v1/user/:userId/repos?type=unused', function() {
    return request(app)
      .get('/v1/user/' + fixture.user1.id + '/repos?type=unused')
      .set('x-access-token', fixture.user1.accessToken)
      .expect(200)
      .then(function(result) {
        var repos = result.body;

        assert(
          repos.some(function(repo) {
            return repo.name === fixtureLoader.GITTER_INTEGRATION_REPO_FULL;
          })
        );

        // now try and add one and see if it is still in there
        // (should we do this via the API too? Going with groupService directly
        //  as it is faster to execute and which user took the linkPath is
        //  irrelevant)
        return groupService.createGroup(fixture.user1, {
          type: 'GH_REPO',
          name: fixtureLoader.GITTER_INTEGRATION_COMMUNITY,
          uri: fixtureLoader.GITTER_INTEGRATION_COMMUNITY,
          linkPath: fixtureLoader.GITTER_INTEGRATION_REPO_FULL
        });
      })
      .then(function() {
        return request(app)
          .get('/v1/user/' + fixture.user1.id + '/repos?type=unused')
          .set('x-access-token', fixture.user1.accessToken)
          .expect(200);
      })
      .then(function(result) {
        var repos = result.body;

        assert(
          repos.every(function(repo) {
            return repo.name !== fixtureLoader.GITTER_INTEGRATION_REPO_FULL;
          })
        );
      });
  });

  it('GET /v1/user/:userId/repos?type=admin', function() {
    return request(app)
      .get('/v1/user/' + fixture.user2.id + '/repos?type=admin')
      .set('x-access-token', fixture.user2.accessToken)
      .expect(200)
      .then(function(result) {
        var repos = result.body;

        assert(
          repos.some(function(repo) {
            return repo.name !== fixtureLoader.GITTER_INTEGRATION_REPO_WITH_COLLAB_ONLY_READ;
          })
        );
      });
  });
});
