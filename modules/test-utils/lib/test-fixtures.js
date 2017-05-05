"use strict";

var env = require('gitter-web-env');
var config = env.config;
var logger = env.logger;
var Promise = require('bluebird');
var debug = require('debug')('gitter:tests:test-fixtures');
var fixtureUtils = require('./fixture-utils');
var _ = require('lodash');
var integrationFixtures = require('./integration-fixtures');

var fixtureSteps = [
  require('./delete-documents'),
  require('./create-users'),
  require('./create-identities'),
  require('./create-forums'),
  require('./create-categories'),
  require('./create-topics'),
  require('./create-replies'),
  require('./create-comments'),
  require('./create-groups'),
  require('./create-troupes'),
  require('./create-messages'),
];

function createBaseFixture() {
  return {
    // TODO: deprecate these and use fixtureUtils directly
    generateEmail: fixtureUtils.generateEmail,
    generateName: fixtureUtils.generateName,
    generateUri: fixtureUtils.generateUri,
    generateUsername: fixtureUtils.generateUsername,
    generateGithubId: fixtureUtils.generateGithubId,
    generateGithubToken: fixtureUtils.generateGithubToken,
    generateGroupUri: fixtureUtils.generateGroupUri,

    cleanup: function(callback) {
      var self = this;

      var count = 0;

      return Promise.all(Object.keys(this).map(function(key) {
          var o = self[key];
          if (typeof o.remove === 'function') {
            count++;
            return o.remove();
          }
        }))
        .timeout(10000)
        .then(function() {
          debug('Removed %s items', count);
        })
        .nodeify(callback);
    }
  };
}

function createExpectedFixtures(expected) {
  if (!expected) throw new Error('Please provide a fixture')

  return Promise.try(createBaseFixture)
    .then(function(fixture) {
      return Promise.mapSeries(fixtureSteps, function(step) {
        return step(expected, fixture);
      })
      .return(fixture);
    })
}

function fixtureLoaderManual(fixture, expected) {
  debug("Creating fixtures %j", expected);
  return function(done) {
    return createExpectedFixtures(expected)
      .then(function(data) {
         Object.keys(data).forEach(function(key) {
          fixture[key] = data[key];
         });
       })
       .asCallback(done);
   };
}

var fixtureLoader = {};
fixtureLoader.manual = fixtureLoaderManual;

fixtureLoader.setup = function(expected) {
  var fixture = {};

  before(fixtureLoaderManual(fixture, expected));
  after(function() {
    if (fixture.cleanup) {
      fixture.cleanup();
    }
  });

  return fixture;
};

fixtureLoader.ensureIntegrationEnvironment = function() {
    var requiredKeys = Array.prototype.slice.call(arguments);

    before(function() {

      var missing = requiredKeys.filter(function(key) {
        return !config.get(key);
      });

      if (!missing.length) {
        // No keys missing, continue with the test
        return;
      }

      // Do we throw an error on missing configuration?
      if (process.env.GITTER_FORCE_INTEGRATION_TESTS) {
        throw new Error('Configuration required for test is missing: ' + missing.join(', '));
      } else {
        logger.warn('Skipping this test due to missing config items', missing.join(', '))
        // Just skip these tests
        this.skip();
      }
    });

}

fixtureLoader.disableMongoTableScans = function() {
  var mongoTableScans = require('./mongo-table-scans');
  var didDisable;

  before(function() {
    return mongoTableScans.isDisabled()
      .then(function(isDisabled) {
        if (isDisabled) return;

        return mongoTableScans.disable()
          .then(function() {
            return didDisable = true;
          });
      })
  });

  after(function() {
    if (didDisable) {
      return mongoTableScans.enable()
        .then(function() {
          didDisable = false;
        })
    }
  });

};
fixtureLoader.createExpectedFixtures = createExpectedFixtures;

// TODO: deprecate these, use them from fixtureUtils
fixtureLoader.generateEmail = fixtureUtils.generateEmail;
fixtureLoader.generateGithubId = fixtureUtils.generateGithubId;
fixtureLoader.generateUri = fixtureUtils.generateUri;

_.extend(fixtureLoader, integrationFixtures);

fixtureLoader.GITTER_INTEGRATION_USER_SCOPE_TOKEN = config.get('integrationTests:test_user:user_scope_token') || '';
fixtureLoader.GITTER_INTEGRATION_USERNAME = config.get('integrationTests:test_user:username') || '';
fixtureLoader.GITTER_INTEGRATION_USER_ID = config.get('integrationTests:test_user:user_id') || '';

fixtureLoader.GITTER_INTEGRATION_COLLAB_USER_SCOPE_TOKEN = config.get('integrationTests:collab_user:user_scope_token') || '';
fixtureLoader.GITTER_INTEGRATION_COLLAB_USERNAME = config.get('integrationTests:collab_user:username') || '';
fixtureLoader.GITTER_INTEGRATION_COLLAB_USER_ID = config.get('integrationTests:collab_user:user_id') || '';

fixtureLoader.GITTER_INTEGRATION_ORG = config.get('integrationTests:org1:org_name') || '';
fixtureLoader.GITTER_INTEGRATION_ORG_ID = config.get('integrationTests:org1:org_id') || '';
fixtureLoader.GITTER_INTEGRATION_REPO = config.get('integrationTests:repo1:repo_name') || '';
fixtureLoader.GITTER_INTEGRATION_REPO_FULL = fixtureLoader.GITTER_INTEGRATION_USERNAME + '/' + fixtureLoader.GITTER_INTEGRATION_REPO;
fixtureLoader.GITTER_INTEGRATION_REPO_ID = config.get('integrationTests:repo1:repo_id') || '';

fixtureLoader.GITTER_INTEGRATION_REPO2 = config.get('integrationTests:repo2:repo_name') || '';
fixtureLoader.GITTER_INTEGRATION_REPO2_FULL = fixtureLoader.GITTER_INTEGRATION_USERNAME + '/' + fixtureLoader.GITTER_INTEGRATION_REPO2;
fixtureLoader.GITTER_INTEGRATION_REPO2_ID = config.get('integrationTests:repo2:repo_id') || '';

fixtureLoader.GITTER_INTEGRATION_COMMUNITY = '_I-heart-cats-Test-LOL';
fixtureLoader.GITTER_INTEGRATION_ROOM = 'all-about-kitty-litter';

fixtureLoader.GITTER_INTEGRATION_REPO_WITH_COLLAB = config.get('integrationTests:collabRepos:repo1') || '';
fixtureLoader.GITTER_INTEGRATION_REPO_WITH_COLLAB2 = config.get('integrationTests:collabRepos:repo2') || '';
fixtureLoader.GITTER_INTEGRATION_REPO_WITH_COLLAB_ONLY_READ = config.get('integrationTests:collabRepos:repoReadOnly') || '';


module.exports = fixtureLoader;
