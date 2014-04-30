/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var winston = require('../../utils/winston');
var pushNotificationService = require('../../services/push-notification-service');

module.exports = {
  create: function(req, res, next) {
    var deviceId = req.body.deviceId;
    var deviceName = req.body.deviceName;
    var deviceType = req.body.deviceType;
    //var deviceToken = new Buffer(req.body.deviceToken, 'base64'); // mongoose 3.6.x
    var deviceToken = req.body.deviceToken; // mongoose 3.8.x
    var appVersion = req.body.version || null;
    var appBuild = req.body.build || null;

    // Backwards compatiblity, remove later
    if(!deviceType) {
      deviceType = 'APPLE-DEV';
    }

    winston.info("APN device registration", { deviceId: deviceId, deviceName: deviceName, deviceType: deviceType });
    pushNotificationService.registerDevice(deviceId, deviceType, deviceToken, deviceName, appVersion, appBuild, function(err) {
      if(err) return next(err);

      res.send({ success: true });
    });
  }

};
