var env = require('gitter-web-env');
var assert = require('assert');
var Promise = require('bluebird');
var persistence = require('gitter-web-persistence');
var mongoUtils = require('gitter-web-persistence-utils/lib/mongo-utils');
var processMarkdown = require('../utils/markdown-processor');

var errorReporter = env.errorReporter;

function findMetaByTroupeId(troupeId) {
  assert(mongoUtils.isLikeObjectId(troupeId));
  troupeId = mongoUtils.asObjectID(troupeId);
  return persistence.TroupeMeta.findOne({ troupeId: troupeId }).exec();
}

//Rename as this upserts
function createNewMetaRecord(troupeId, data) {
  assert(mongoUtils.isLikeObjectId(troupeId));
  troupeId = mongoUtils.asObjectID(troupeId);

  data = (data || {});
  data.welcomeMessage = (data.welcomeMessage || '');

  //should this be sanitised? JP 20/5/16 ... probably
  return processMarkdown(data.welcomeMessage)
    .then(function(parsedWelcomeMessage) {

      var data = {
        $set: {
          welcomeMessage: {
            html: parsedWelcomeMessage.html,
            text: parsedWelcomeMessage.text
          }
        }
      };

      return Promise.fromCallback(function(callback) {
        persistence.TroupeMeta.findOneAndUpdate({ troupeId: troupeId }, data, { upsert: true }, callback);
      });

    })
    .catch(function(err) {
      //TODO Error Reporting
      //console.log(err.message);
    });

}

module.exports = {
  findMetaByTroupeId: findMetaByTroupeId,
  createNewMetaRecord: createNewMetaRecord
};
