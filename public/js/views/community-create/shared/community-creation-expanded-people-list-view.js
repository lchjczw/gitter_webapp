'use strict';

var _ = require('underscore');
var Marionette = require('backbone.marionette');
var urlJoin = require('url-join');
var clientEnv = require('gitter-client-env');
var toggleClass = require('../../../utils/toggle-class');
var peopleToInviteStatusConstants = require('../people-to-invite-status-constants');
var CommunityCreationPeopleListTemplate = require('./community-creation-expanded-people-list-view.hbs');
var CommunityCreationPeopleListItemTemplate = require('./community-creation-expanded-people-list-item-view.hbs');
var CommunityCreationPeopleListEmptyTemplate = require('./community-creation-expanded-people-list-empty-view.hbs');
var CreateCommunityModel = require('../community-create-model');

// Consider all constraints except a customError because we use
// this to add a custom message on what to do to satisfy
function isFormElementInvalid(el, useCustomError) {
  return (
    el.validity.badInput ||
    (useCustomError ? el.validity.customError : false) ||
    el.validity.patternMismatch ||
    el.validity.rangeOverflow ||
    el.validity.rangeUnderflow ||
    el.validity.stepMismatch ||
    el.validity.tooLong ||
    el.validity.typeMismatch ||
    //el.validity.valid ||
    el.validity.valueMissing
  );
}

function getStatusClassStates(type, inviteStatus, allowTweetBadger) {
  var hasValidEmail = inviteStatus === peopleToInviteStatusConstants.READY_VALID_EMAIL;
  var isTwitter = type === 'twitter';
  var canShowTwitterStatus = isTwitter && allowTweetBadger;

  return {
    needsAttention: !hasValidEmail && !canShowTwitterStatus,
    usingTweetBadger: canShowTwitterStatus && !hasValidEmail,
    isValid: hasValidEmail
  };
}

var CommunityCreationPeopleListItemView = Marionette.ItemView.extend({
  template: CommunityCreationPeopleListItemTemplate,
  tagName: 'li',
  className: 'community-create-expanded-people-list-item',

  ui: {
    link: '.community-create-expanded-people-list-item-link',
    emailInput: '.js-community-create-expanded-people-list-item-email-input',
    twitterStatusIcon: '.js-community-create-expanded-people-list-item-status-twitter',
    needsAttentionStatusIcon:
      '.js-community-create-expanded-people-list-item-status-needs-attention',
    isValidStatusIcon: '.js-community-create-expanded-people-list-item-status-is-valid'
  },

  events: {
    'click @ui.link': 'onLinkClick',
    'input @ui.emailInput': 'onEmailInputChange'
  },

  modelEvents: {
    'change:inviteStatus': 'onInviteStatusChange'
  },

  triggers: {},

  initialize: function(options) {
    this.communityCreateModel = options.communityCreateModel;

    if (this.communityCreateModel) {
      this.listenTo(
        this.communityCreateModel,
        'change:allowTweetBadger',
        this.onAllowTweetBadgerChange,
        this
      );
    }
  },

  serializeData: function() {
    var data = this.model.toJSON();

    var githubUsername = data.githubUsername;
    var gitlabUsername = data.gitlabUsername;
    var twitterUsername = data.twitterUsername;
    var username = githubUsername || gitlabUsername || twitterUsername || data.username;
    data.vendorUsername = username;
    data.absoluteUri = urlJoin(clientEnv.basePath, username);
    var statusStates = getStatusClassStates(
      data.type,
      data.inviteStatus,
      this.communityCreateModel.get('allowTweetBadger')
    );
    data = _.extend({}, data, statusStates);

    data.isTwitter = data.type === 'twitter';
    data.shouldShowOnHover = data.isTwitter;

    return data;
  },

  onRender: function() {
    this.onInviteStatusChange();
  },

  onActiveChange: function() {
    toggleClass(this.$el[0], 'active', this.model.get('active'));
  },

  onInviteStatusChange: function() {
    var inviteStatus = this.model.get('inviteStatus');

    toggleClass(this.$el[0], 'pending', inviteStatus === peopleToInviteStatusConstants.PENDING);
    // We don't use this state to differentiate
    //toggleClass(this.$el[0], 'ready', inviteStatus === peopleToInviteStatusConstants.READY);
    toggleClass(
      this.$el[0],
      'needs-email',
      inviteStatus === peopleToInviteStatusConstants.NEEDS_EMAIL
    );
    toggleClass(
      this.$el[0],
      'ready-valid-email',
      inviteStatus === peopleToInviteStatusConstants.READY_VALID_EMAIL
    );

    this.updateStatusIcons();
  },

  onLinkClick: function(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  onEmailInputChange: function() {
    var emailInputText = this.ui.emailInput.val();
    var isEmailValid = !isFormElementInvalid(this.ui.emailInput[0]);
    if (isEmailValid) {
      this.model.set('inviteStatus', peopleToInviteStatusConstants.READY_VALID_EMAIL);
    } else {
      this.model.set('inviteStatus', peopleToInviteStatusConstants.NEEDS_EMAIL);
    }

    this.model.set('emailAddress', emailInputText);
  },

  onAllowTweetBadgerChange: function() {
    this.updateStatusIcons();
  },

  updateStatusIcons: function() {
    var statusStates = getStatusClassStates(
      this.model.get('type'),
      this.model.get('inviteStatus'),
      this.communityCreateModel.get('allowTweetBadger')
    );

    toggleClass(this.ui.emailInput[0], 'should-show-on-hover', statusStates.usingTweetBadger);
    toggleClass(this.ui.twitterStatusIcon[0], 'hidden', !statusStates.usingTweetBadger);
    toggleClass(this.ui.needsAttentionStatusIcon[0], 'hidden', !statusStates.needsAttention);
    toggleClass(this.ui.isValidStatusIcon[0], 'hidden', !statusStates.isValid);
  }
});

var CommunityCreationPeopleListEmptyView = Marionette.ItemView.extend({
  template: CommunityCreationPeopleListEmptyTemplate
});

var ExpandedPeopleListView = Marionette.CompositeView.extend({
  className: 'community-create-expanded-people-list-root-inner',
  template: CommunityCreationPeopleListTemplate,
  childView: CommunityCreationPeopleListItemView,
  emptyView: CommunityCreationPeopleListEmptyView,
  childViewContainer: '.community-create-expanded-people-list',
  reorderOnSort: true,
  filter: CreateCommunityModel.inviteNeedsEmailPredicate,
  childViewOptions: function() {
    return {
      communityCreateModel: this.options.communityCreateModel
    };
  }
});

module.exports = ExpandedPeopleListView;
