"use strict";

var loadTroupeFromParam = require('./load-troupe-param');
var SecurityResourceExtraAdminsRoute = require('../common/create-security-extra-admins-resource');
var sdWithPolicyFactory = require('../../../services/security-descriptor-with-policy-service');

module.exports = new SecurityResourceExtraAdminsRoute({
  id: 'roomSecurityExtraAdmin',
  getSecurityDescriptor: function(req) {
    return loadTroupeFromParam(req)
      .then(function(troupe) {
        return sdWithPolicyFactory.createForRoom(troupe._id, troupe.sd, req.userRoomPolicy);
      });
  },
})
