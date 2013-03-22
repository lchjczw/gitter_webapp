/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var winston = require('winston');
var pushNotificationService = require('../../services/push-notification-service');

module.exports = {
  create: function(req, res, next) {
    var deviceId = req.body.deviceId;
    var deviceName = req.body.deviceName;
    var deviceToken = new Buffer(req.body.deviceToken, 'base64');

    winston.info("APN device registration", { deviceId: deviceId, deviceName: deviceName });
    pushNotificationService.registerDevice(deviceId, 'APPLE', deviceToken, deviceName, function(err) {
      if(err) return next(err);
      res.send({ success: true });
    });
  }

};