/*jshint globalstrict:true, trailing:false */
/*global console:false, require: true, module: true */
"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema, 
    ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/troupe');

var UserSchema = new Schema({
  displayName: { type: String }, 
  email: { type: String },
  confirmationCode: {type: String },
  status: { type: String, enum: ['UNCONFIRMED', 'ACTIVE'], default: 'UNCONFIRMED'},
  passwordHash: { type: String },   
  avatarUrlSmall: String,
  avatarUrlMedium: String
});

UserSchema.methods.narrow = function() {
  return {
    id: this.id,
    displayName: this.displayName,
    avatarUrl: this.getAvatarUrl()
  };
};

UserSchema.methods.getAvatarUrl = function() {
  if(this.avatarUrlSmall) {
    return this.avatarUrlSmall;
  }

  return "/avatar/" + this.id;
};

var TroupeSchema = new Schema({
  name: { type: String },
  uri: { type: String },
  status: { type: String, enum: ['INACTIVE', 'ACTIVE'], default: 'INACTIVE'},
  users: [ObjectId]
});

TroupeSchema.methods.narrow = function () {
  return {
    id: this._id,
    name: this.name,
    uri: this.uri
  };
};

var InviteSchema = new Schema({
  troupeId: ObjectId,
  displayName: { type: String },
  email: { type: String },
  code: { type: String },
  status: { type: String, enum: ['UNUSED', 'USED'], default: 'UNUSED'}
});

InviteSchema.methods.narrow = function () {
  return {
    id: this._id,
    displayName: this.displayName,
    email: this.email
  };
};

var ChatMessageSchema = new Schema({
  fromUserId: ObjectId,
  toTroupeId: ObjectId,
  text: String,
  sent: { type: Date, default: Date.now }
});


ChatMessageSchema.methods.narrow = function (user, troupe) {
  return {
    id: this._id,
    text: this.text,
    sent: this.sent,
    fromUser: user ? user.narrow() : null,
    toTroupe: troupe ? troupe.narrow() : null
  };
};

var EmailAttachmentSchema = new Schema({
  fileId: ObjectId,
  version: Number
});

var EmailSchema = new Schema({
  from: { type: String },
  fromName: { type: String},
  troupeId: ObjectId,
  subject: { type : String },
  date: {type: Date },
  preview: {type: String},
  mail: { type: String},
  attachments: [EmailAttachmentSchema]
});

EmailSchema.methods.narrow = function () {
  return {
    id: this.id,
    from: this.from,
    fromName: this.fromName,
    subject: this.subject,
    date: this.date,
    preview: this.preview
  };

};

var FileVersionSchema = new Schema({
  creatorUserId: ObjectId,
  createdDate: { type: Date },
  deleted: { type: Boolean, default: false },

  /* In future, this might change, but for the moment, use a URI-type source */
  source: { type: String }
});

FileVersionSchema.methods.narrow = function () {
  return {
    creatorUserId: this.creatorUserId,
    createdDate: this.createdDate,
    source: this.source,
    deleted: this.deleted
  };
};

var FileSchema = new Schema({
  troupeId: ObjectId,
  fileName: {type: String},
  mimeType: { type: String},
  versions: [FileVersionSchema]
});

FileSchema.methods.narrow = function () {
  return {
    id: this._id,
    fileName: this.fileName,
    mimeType: this.mimeType,
    versions: this.versions.narrow(),
    url: '/troupes/' + encodeURIComponent(this.troupeId) + '/downloads/' + encodeURIComponent(this.fileName),
    embeddedUrl: '/pdfjs/web/viewer.html?file=/troupes/' + encodeURIComponent(this.troupeId) + '/embedded/' + encodeURIComponent(this.fileName)
  };
};

var User = mongoose.model('User', UserSchema);
var Troupe = mongoose.model('Troupe', TroupeSchema);
var Email = mongoose.model('Email', EmailSchema);
var EmailAttachment = mongoose.model('EmailAttachment', EmailAttachmentSchema);
var Invite = mongoose.model('Invite', InviteSchema);
var ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
var File = mongoose.model('File', FileSchema);
var FileVersion = mongoose.model('FileVersion', FileVersionSchema);


module.exports = {
  User: User,
  Troupe: Troupe,
	Email: Email,
  EmailAttachment: EmailAttachment,
	Invite: Invite,
	ChatMessage: ChatMessage,
  File: File,
  FileVersion: FileVersion
};