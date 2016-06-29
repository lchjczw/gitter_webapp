"use strict";

var Promise = require('bluebird');
var restful = require("../../../services/restful");
var StatusError = require('statuserror');
var groupService = require('gitter-web-groups/lib/group-service');
var restSerializer = require('../../../serializers/rest-serializer');
var policyFactory = require('gitter-web-permissions/lib/policy-factory');
var GroupWithPolicyService = require('../../../services/group-with-policy-service');

module.exports = {
  id: 'group',

  index: function(req) {
    if (!req.user) {
      throw new StatusError(401);
    }

    return restful.serializeGroupsForUserId(req.user._id);
  },

  create: function(req) {
    var user = req.user;

    if (!req.user) {
      throw new StatusError(401);
    }

    if (!req.authInfo || !req.authInfo.clientKey === 'web-internal') {
      // This is a private API
      throw new StatusError(404);
    }

    var uri = req.body.uri ? String(req.body.uri) : undefined;
    var name = req.body.name ? String(req.body.name) : undefined;
    var groupOptions = { uri: uri, name: name };
    if (req.body.security) {
      // for GitHub and future group types that are backed by other services
      groupOptions.type = req.body.security.type ? String(req.body.security.type) : undefined;
      groupOptions.linkPath = req.body.security.linkPath ? String(req.body.security.linkPath) : undefined;
    }

    var group;

    return groupService.createGroup(user, groupOptions)
      .then(function(_group) {
        group = _group
        return policyFactory.createPolicyForGroupId(req.user, group._id);
      })
      .then(function(userGroupPolicy) {
        var groupWithPolicyService = new GroupWithPolicyService(group, req.user, userGroupPolicy);

        var defaultRoomName = req.body.defaultRoomName || 'Lobby';
        var roomOptions = {
          name: defaultRoomName,
          // default rooms are always public
          security: 'PUBLIC',
          // use the same backing object for the default room
          type: group.sd.type,
          linkPath: group.sd.linkPath
        };

        return groupWithPolicyService.createRoom(roomOptions);
      })
      .then(function(room) {
        var groupStrategy = new restSerializer.GroupStrategy();
        var troupeStrategy = new restSerializer.TroupeStrategy({
          currentUserId: req.user.id,
          includeTags: true,
          includePermissions: true,
          includeProviders: true
        });

        return Promise.join(
            restSerializer.serializeObject(group, groupStrategy),
            restSerializer.serializeObject(room, troupeStrategy),
            function(serializedGroup, serializedRoom) {
              serializedGroup.defaultRoom = serializedRoom;
              return serializedGroup;
            }
          );
      });
  },

  show: function(req) {
    var group = req.params.group;
    var user = req.user;
    var userId = user && user._id;

    var strategy = new restSerializer.GroupStrategy({ currentUserId: userId, currentUser: user });
    return restSerializer.serializeObject(group, strategy);
  },

  load: function(req, id) {
    return policyFactory.createPolicyForGroupId(req.user, id)
      .then(function(policy) {
        // TODO: middleware?
        req.userGroupPolicy = policy;

        return req.method === 'GET' ?
          policy.canRead() :
          policy.canWrite();
      })
      .then(function(access) {
        if (!access) return null;

        return groupService.findById(id);
      });
  },

  subresources: {
    'rooms': require('./rooms'),
  }

};
