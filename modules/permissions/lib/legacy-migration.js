'use strict';

var StatusError = require('statuserror');

/**
 * This module helps migrating from the old world of permissions
 * to the new world.
 *
 * At the end of the migration process
 * (see https://github.com/troupe/gitter-webapp/milestones/New%20Permissions%20API%20and%20GitHub%20URI%20break)
 * this module should be removed
 */

function generateOneToOnePermissionsForRoom() {
  return undefined;
}

function generateOrgPermissionsForRoom(room) {
  var githubId = room.githubId;
  var uri = room.uri;

  return {
    type: 'GH_ORG',
    members: 'GH_ORG_MEMBER',
    admins: 'GH_ORG_MEMBER',
    public: false, // All existing org rooms are private
    linkPath: uri,
    externalId: githubId
  };
}

function generateRepoPermissionsForRoom(room) {
  var githubId = room.githubId;
  var uri = room.uri;
  var security = room.security;

  switch(security) {
    case 'PUBLIC':
      return {
        type: 'GH_REPO',
        members: 'PUBLIC',
        admins: 'GH_REPO_PUSH',
        public: true,
        linkPath: uri,
        externalId: githubId
      };

    case 'PRIVATE':
      return {
        members: 'GH_REPO_ACCESS',
        admins: 'GH_REPO_PUSH',
        public: false,
        linkPath: uri,
        externalId: githubId
      };

    default:
      throw new StatusError(500, 'Unknown security type: ' + security);
  }
}


function generateRepoChannelPermissionsForRoom(room, parentRoom) {
  var uri = room.uri;
  var ownerUri = uri.split(/\//).slice(0, 2).join('/');
  var security = room.security;
  var githubId = parentRoom.githubId;

  if (ownerUri !== parentRoom.uri) {
    throw new StatusError(500, 'Owner URI vs Parent URI mismatch: ' + ownerUri + ' vs. ' + parentRoom.uri);
  }

  switch(security) {
    case 'PUBLIC':
      return {
        type: 'GH_REPO',
        members: 'PUBLIC',
        admins: 'GH_REPO_PUSH',
        public: true,
        linkPath: ownerUri,
        externalId: githubId
      };

    case 'PRIVATE':
      return {
        type: 'GH_REPO',
        members: 'INVITE',
        admins: 'GH_REPO_PUSH',
        public: false,
        linkPath: ownerUri,
        externalId: githubId
      };

    case 'INHERITED':
      switch(parentRoom.security) {
        case 'PUBLIC':
          return {
            type: 'GH_REPO',
            members: 'PUBLIC',
            admins: 'GH_REPO_PUSH',
            public: true,
            linkPath: ownerUri,
            externalId: githubId
          };

        case 'PRIVATE':
          return {
            type: 'GH_REPO',
            members: 'GH_REPO_ACCESS',
            admins: 'GH_REPO_PUSH',
            public: false,
            linkPath: ownerUri,
            externalId: githubId
          };

        default:
          throw new StatusError(500, 'Unknown parent room security type: ' + security);
      }
      break;

    default:
      throw new StatusError(500, 'Unknown security type: ' + security);
  }
}

function generateOrgChannelPermissionsForRoom(room, parentRoom) {
  var uri = room.uri;
  var ownerUri = uri.split(/\//)[0]
  var githubId = parentRoom.githubId;
  var security = room.security;

  if (ownerUri !== parentRoom.uri) {
    throw new StatusError(500, 'Owner URI vs Parent URI mismatch: ' + ownerUri + ' vs. ' + parentRoom.uri);
  }

  switch(security) {
    case 'PUBLIC':
      return {
        type: 'GH_ORG',
        members: 'PUBLIC',
        admins: 'GH_ORG_MEMBER',
        public: true,
        linkPath: ownerUri,
        externalId: githubId
      };

    case 'PRIVATE':
      return {
        type: 'GH_ORG',
        members: 'INVITE',
        admins: 'GH_ORG_MEMBER',
        public: false,
        linkPath: ownerUri,
        externalId: githubId
      };

    case 'INHERITED':
      return {
        type: 'GH_ORG',
        members: 'GH_ORG_MEMBER',
        admins: 'GH_ORG_MEMBER',
        public: false,
        linkPath: ownerUri,
        externalId: githubId
      };

    default:
      throw new StatusError(500, 'Unknown security type: ' + security);
  }

}

function generateUserChannelPermissionsForRoom(room, ownerUser) {
  var uri = room.uri;
  var ownerUri = uri.split(/\//)[0];
  var security = room.security;

  if (ownerUri !== ownerUser.username) {
    throw new StatusError(500, 'Owner URI vs owner username mismatch: ' + ownerUri + ' vs. ' + ownerUser.username);
  }

  switch(security) {
    case 'PUBLIC':
      return {
        type: 'NONE',
        members: 'PUBLIC',
        admins: 'MANUAL',
        public: true,
        extraAdmins: [ownerUser.id]
      };

    case 'PRIVATE':
      return {
        type: 'NONE',
        members: 'INVITE',
        admins: 'MANUAL',
        public: false,
        extraAdmins: [ownerUser.id]
      };

    default:
      throw new StatusError(500, 'Unknown security type: ' + security);
  }
}


/**
 * Given a room, returns a `permissions` object
 */
function generatePermissionsForRoom(room, parentRoom, ownerUser) {
  var oneToOne = room.oneToOne;
  var githubType = room.githubType;

  // Do some checking of the things
  if (githubType === 'ONETOONE') {
    if (!oneToOne) {
      throw new StatusError(500, 'Github type mismatch');
    }
  } else {
    if (oneToOne) {
      throw new StatusError(500, 'Github type mismatch');
    }
  }

  switch(githubType) {
    case 'ONETOONE':
      return generateOneToOnePermissionsForRoom(room);

    case 'REPO':
      return generateRepoPermissionsForRoom(room);

    case 'ORG':
      return generateOrgPermissionsForRoom(room);

    case 'REPO_CHANNEL':
      if (!parentRoom) {
        throw new StatusError(500, 'Parent room not found: ' + room.uri);
      }

      return generateRepoChannelPermissionsForRoom(room, parentRoom);
    case 'ORG_CHANNEL':
      if (!parentRoom) {
        throw new StatusError(500, 'Parent room not found: ' + room.uri);
      }
      return generateOrgChannelPermissionsForRoom(room, parentRoom);

    case 'USER_CHANNEL':
      if (!ownerUser) {
        throw new StatusError(500, 'Owner not found: ' + room.uri);
      }
      return generateUserChannelPermissionsForRoom(room, ownerUser);

    default:
      throw new Error(500, 'Unknown room type ' + githubType);
  }
}


exports.generatePermissionsForRoom = generatePermissionsForRoom;
