'use strict';

var testRequire = require('../test-require');
var restful = testRequire('./services/restful');
var userService = testRequire('./services/user-service');
var fixtureLoader = require('gitter-web-test-utils/lib/test-fixtures');
var assert = require('assert');
var env = require('gitter-web-env');
var nconf = env.config;


var counter = 0;

// identities need providerKey and it has to be unique
function generateId() {
  return '' + (++counter) + Date.now();
}

// for some tests it specifically has to be a github user
function generateGithubUsername() {
  return 'github' + (++counter) + Date.now();
}
// for some tests it specifically has to be a non-github user
function generateNonGithubUsername() {
  return ''+(++counter) + Date.now()+'_google';
}

// I need to make sure that a gitter user that is a github user returns the
// right stuff and therefore I have to make sure that a gitter account exists
// for a github account that is known to exist. But I can't just hack the
// fixtures because it will fail if you try and create the user and it already
// exists and if your tests ever fail, then it won't be cleaned up, so next
// time around it will throw an error when it tries to create it.
var hardcodedGitHubUser = {
  githubId: 69737,
  username: 'lerouxb',
  displayName: 'Le Roux Bodenstein'
};
// this can only come from github has we don't store it in the db. If I ever
// change my location, then our tests will break ;)
var hardcodedLocation = 'Cape Town';
function ensureGitHubUser(options) {
  return userService.findOrCreateUserForGithubId(options);
}

describe('restful #slow', function() {
  var fixture = {};
  before(fixtureLoader(fixture, {
    // user1 is a google (non-github) user
    user1: {
      id: 1,
      username: generateNonGithubUsername()
    },
    identity1: {
      user: 'user1',
      provider: 'google',
      providerKey: generateId()
    },
    // user2 is a github-backed user that doesn't actually exist on github
    // (which is only useful in testing edge cases)
    user2: {
      id: 2,
      username: generateGithubUsername()
    },
    group1: { },
    troupe1: {
      group: 'group1',
      users: ['user1']
    }
  }));

  after(function() {
    fixture.cleanup();
  });

  it('returns a github-backed profile #slow', function(done) {
    return ensureGitHubUser(hardcodedGitHubUser)
      .then(function() {
        return restful.serializeProfileForUsername(hardcodedGitHubUser.username);
      })
      .then(function(profile) {
        assert(profile.id);
        assert.equal(profile.username, hardcodedGitHubUser.username);
        assert.equal(profile.displayName, hardcodedGitHubUser.displayName);
        assert.equal(profile.location, hardcodedLocation);
      })
      .nodeify(done);
  });

  it('returns a google-backed profile', function(done) {
    return restful.serializeProfileForUsername(fixture.user1.username)
      .then(function(profile) {
        assert(profile.id);
        assert.equal(profile.username, fixture.user1.username);
        assert.equal(profile.displayName, fixture.user1.displayName);
      })
      .nodeify(done);
  });

  it('returns a github user that is not on gitter yet #slow', function(done) {
    // this will be useless if defunkt ever manages to get an account on our
    // test environment..
    return restful.serializeProfileForUsername('defunkt')
      .then(function(profile) {
        // github-only users don't have github ids
        assert(!profile.id);
        assert(profile.username);
        assert(profile.displayName);
        // github-only users get the avatar url from their API rather than our DB
        assert(profile.gravatarImageUrl);
        // assuming this is never 0 ;)
        assert(profile.github.followers);
      })
      .nodeify(done);
  });

  // github users that don't exist in our db will be checked against github
  it('returns a 404 for a github user that does not exist on github #slow', function(done) {
    return restful.serializeProfileForUsername(fixture.user2.username)
      .then(function() {
        assert.ok(false, 'Expected a throw');
      }, function(err) {
        assert.strictEqual(err.status, 404);
      })
      .nodeify(done);
  });

  // non-github users that don't exist in our db don't get any further
  // processing
  it('returns a 404 for a google user that does not exist in our database', function(done) {
    return restful.serializeProfileForUsername('thisshouldnotexist_google')
      .then(function() {
        assert.ok(false, 'Expected a throw');
      }, function(err) {
        assert.strictEqual(err.status, 404);
      })
      .nodeify(done);
  });

  it('serializes orgs', function(done) {
    return restful.serializeOrgsForUserId(fixture.user1.id)
      .nodeify(done);
  });

  it('serializes orgs', function() {
    return restful.serializeOrgsForUserId(fixture.user1.id);
  });


  describe('serializeGroupsForUserId', function() {
    it('should do what it says on the tin', function() {
      return restful.serializeGroupsForUserId(fixture.user1.id)
        .then(function(result) {
          assert.deepEqual(result, [{
            id: fixture.group1.id,
            name: fixture.group1.name,
            uri: fixture.group1.uri,
            backedBy: {
              type: null,
              linkPath: null
            },
            avatarUrl: nconf.get('avatar:officialHost') + '/group/i/' + fixture.group1.id,
            hasAvatarSet: undefined,
            forumId: undefined
          }]);
        });
    });
  });

  describe('serializeAdminGroupsForUser', function() {
    it('should do what it says on the tin', function() {
      return restful.serializeAdminGroupsForUser(fixture.user1)
        .then(function(result) {
          assert.deepEqual(result, []);
        });
    });
  });

  describe('serializeRoomsForGroupId', function() {
    var fixture = fixtureLoader.setup({
      group1: {},
      user1: { },
      troupe1: { group: 'group1', users: ['user1'] },
      troupe2: { group: 'group1', security: 'PRIVATE' },
    });

    it('should serialize the rooms for a group', function() {
      return restful.serializeRoomsForGroupId(fixture.group1._id, fixture.user1._id)
        .then(function(result) {
          assert.strictEqual(result.length, 1);
          var v1 = result[0];
          assert.strictEqual(v1.roomMember, true);
        });
    });
  });

  describe('topics-related restful serializers', function() {
    var fixture = fixtureLoader.setup({
      user1: {
        accessToken: 'web-internal'
      },
      forum1: {
        securityDescriptor: {
          extraAdmins: ['user1']
        }
      },
      category1: {
        forum: 'forum1'
      },
      topic1: {
        user: 'user1',
        forum: 'forum1',
        category: 'category1'
      },
      reply1: {
        user: 'user1',
        forum: 'forum1',
        topic: 'topic1'
      },
      comment1: {
        user: 'user1',
        forum: 'forum1',
        topic: 'topic1',
        reply: 'reply1',
      }
    });

    describe('serializeTopicsForForumId', function() {
      it('should serialize topics in a forum', function() {
        return restful.serializeTopicsForForumId(fixture.forum1._id)
          .then(function(topics) {
            var topic = topics.find(function(t) {
              return t.id === fixture.topic1.id;
            });
            assert.strictEqual(topic.id, fixture.topic1.id);
            assert.strictEqual(topic.repliesTotal, 1);
            assert.strictEqual(topic.replies.length, 1);
          });
      });
    });

    describe('serializeRepliesForTopicId', function() {
      it('should serialize replies in a topic', function() {
        return restful.serializeRepliesForTopicId(fixture.topic1._id)
          .then(function(replies) {
            var reply = replies.find(function(r) {
              return r.id === fixture.reply1.id;
            });
            assert.strictEqual(reply.id, fixture.reply1.id);
            assert.strictEqual(reply.commentsTotal, 1);
            assert.strictEqual(reply.comments.length, 1);
          });
      });
    });

    describe('serializeCommentsForReplyId', function() {
      it('should serialize comments in a reply', function() {
        return restful.serializeCommentsForReplyId(fixture.reply1._id)
          .then(function(comments) {
            var comment = comments.find(function(c) {
              return c.id === fixture.comment1.id;
            });
            assert.strictEqual(comment.id, fixture.comment1.id);
          });
      });
    });

  });
});
