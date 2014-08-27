"use strict";

var mongoose      = require('../../utils/mongoose-q');
var Schema        = mongoose.Schema;
var ObjectId      = Schema.ObjectId;

var ChatMessageSchema = new Schema({
  fromUserId: ObjectId,
  toTroupeId: ObjectId,  //TODO: rename to troupeId
  text: String,
  status: { type: Boolean, required: false },
  html: String,
  urls: Array,  // TODO: schema-ify this
  mentions: [{
    screenName: { type: String, required: true },
    userId: { type: ObjectId }
  }],
  issues: Array, // TODO: schema-ify this
  meta: Schema.Types.Mixed,
  sent: { type: Date, "default": Date.now },
  editedAt: { type: Date, "default": null },
  readBy: { type: [ObjectId] },
  _tv: { type: 'MongooseNumber', 'default': 0 },
  _md: Number,          // Meta parse version
});
ChatMessageSchema.index({ toTroupeId: 1, sent: -1 });
ChatMessageSchema.schemaTypeName = 'ChatMessageSchema';

module.exports = {
  install: function(mongooseConnection) {
    var model = mongooseConnection.model('ChatMessage', ChatMessageSchema);

    return {
      model: model,
      schema: ChatMessageSchema
    };
  }
};