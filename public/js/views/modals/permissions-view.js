'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var fuzzysearch = require('fuzzysearch');
var urlJoin = require('url-join');
var avatars = require('gitter-web-avatars');
var toggleClass = require('../../utils/toggle-class');
var apiClient = require('../../components/apiClient');

var ModalView = require('./modal');
var Typeahead = require('../controls/typeahead');
var userSearchModels = require('../../collections/user-search');
var userSearchItemTemplate = require('../app/tmpl/userSearchItem.hbs');
var PermissionsPeopleListView = require('./permissions/permisions-people-list-view');
var requestingSecurityDescriptorStatusConstants = require('./permissions/requesting-security-descriptor-status-constants');
var submitSecurityDescriptorStatusConstants = require('./permissions/requesting-security-descriptor-status-constants');
var template = require('./tmpl/permissions-view.hbs');

require('../behaviors/isomorphic');


var PermissionsView = Marionette.LayoutView.extend({
  template: template,

  ui: {
    peopleInput: '.js-permissions-people-input',
    permissionsOptionsWrapper: '.js-permissions-options-wrapper',
    permissionsOptionsSelect: '.js-permissions-options-select',
    permissionsOptionsSpinner: '.js-permissions-options-spinner',
    permissionsOptionsErrorIcon: '.js-permissions-options-error-icon',
    modelError: '.js-permissions-model-error',
    submissionError: '.js-permissions-submission-error'
  },

  behaviors: {
    Isomorphic: {
      adminListView: { el: '.js-permissions-admin-list-root', init: 'initAdminListView' }
    },
  },

  initAdminListView: function(optionsForRegion) {
    this.adminListView = new PermissionsPeopleListView(optionsForRegion({
      collection: this.model.adminCollection
    }));

    this.listenTo(this.adminListView, 'user:remove', this.onAdminRemoved, this);
    return this.adminListView;
  },

  events: {
    'change @ui.permissionsOptionsSelect': 'onPermissionsOptionsSelectChange'
  },

  modelEvents: {
    'change:entity': 'onEntityChange',
    'change:securityDescriptor': 'onSecurityDescriptorChange',
    'change:requestingSecurityDescriptorStatus': 'onRequestingSecurityDescriptorStatusChange',
    'change:submitSecurityDescriptorStatus': 'onSubmitSecurityDescriptorStatusChange'
  },

  initialize: function(/*attrs, options*/) {
    this.initializeForEntity();
    this.listenTo(this, 'menuItemClicked', this.menuItemClicked);
    this.listenTo(this.model.adminCollection, 'add remove', this.onAdminCollectionChange);
  },

  menuItemClicked: function(button) {
    switch(button) {
      case 'switch-to-group-entity':
        var entity = this.model.get('entity');
        var groupId = entity && entity.get('groupId');

        var group = null;
        if(groupId) {
          group = this.model.groupCollection.get(groupId);
        }

        this.model.set({
          entity: group
        })
        break;
      case 'done':
        this.submitNewSecurityDescriptor();
        break;
    }
  },

  serializeData: function() {
    var data = this.model.toJSON();
    data.entity = data.entity && data.entity.toJSON();

    data.groupAvatarUrl = avatars.getForGroupId(data.entity.groupId || data.entity.id);
    data.permissionOpts = this.getPermissionOptions();

    //console.log('data', data);
    return data;
  },

  onRender: function() {
    this.typeahead = new Typeahead({
      collection: new userSearchModels.Collection(),
      itemTemplate: userSearchItemTemplate,
      el: this.ui.peopleInput[0],
      autoSelector: function(input) {
        return function(m) {
          var displayName = (m.get('displayName') || '').toLowerCase();
          var username = (m.get('username') || '').toLowerCase();

          return fuzzysearch(input.toLowerCase(), displayName) ||
            fuzzysearch(input.toLowerCase(), username);
        };
      },
      fetch: function(input, collection, fetchSuccess) {
        this.collection.fetch({
          data: {
            q: input
          }
        }, {
          add: true,
          remove: true,
          merge: true,
          success: fetchSuccess
        });
      }
    });

    this.listenTo(this.typeahead, 'selected', this.onAdminSelected);

    this.onRequestingSecurityDescriptorStatusChange();
  },


  onPermissionsOptionsSelectChange: function() {
    var currentSd = this.model.get('securityDescriptor');
    var selectValue = this.ui.permissionsOptionsSelect.val();

    this.model.set({
      securityDescriptor: _.extend({}, currentSd, {
        type: selectValue === 'null' ? null : selectValue
      })
    });
  },

  onAdminCollectionChange: function() {
    this.updateModelErrors();
  },

  onAdminSelected: function(user) {
    this.ui.peopleInput.val('');
    this.model.adminCollection.add([user]);
    this.typeahead.dropdown.hide();
  },

  onAdminRemoved: function(user) {
    this.model.adminCollection.remove(user);
  },


  initializeForEntity: function() {
    this.fetchSecurityDescriptor();
    this.fetchAdminUsers();
  },

  onEntityChange: function() {
    this.model.adminCollection.reset();
    this.initializeForEntity();
    this.render();
  },

  onSecurityDescriptorChange: function() {
    var sd = this.model.get('securityDescriptor');
    var permissionOpts = this.getPermissionOptions();

    this.ui.permissionsOptionsSelect.html('');
    permissionOpts.forEach(function(opt) {
      this.ui.permissionsOptionsSelect.append('<option value="' + opt.value + '" ' + (opt.selected ? 'selected' : '') + '>' + opt.label + '</option>');
    }.bind(this));

    toggleClass(this.ui.permissionsOptionsWrapper[0], 'disabled', !sd || (sd && sd.type === null));

    this.updateModelErrors();
  },

  onRequestingSecurityDescriptorStatusChange: function() {
    var state = this.model.get('requestingSecurityDescriptorStatus');
    if(this.ui.permissionsOptionsSpinner.length > 0) {
      toggleClass(this.ui.permissionsOptionsSpinner[0], 'hidden', state !== requestingSecurityDescriptorStatusConstants.PENDING);
    }
    if(this.ui.permissionsOptionsErrorIcon.length > 0) {
      toggleClass(this.ui.permissionsOptionsErrorIcon[0], 'hidden', state !== requestingSecurityDescriptorStatusConstants.ERROR);
    }
  },

  onSubmitSecurityDescriptorStatusChange: function() {
    var status = this.model.get('submitSecurityDescriptorStatus');
    var statusString = '';

    if(status === submitSecurityDescriptorStatusConstants.ERROR) {
      statusString = 'Problem submitting security descriptor';
    }

    this.ui.submissionError.text(statusString);
  },

  updateModelErrors: function() {
    var modelIsValid = this.model.isValid();
    var errors = !modelIsValid && this.model.validationError;

    var errorStrings = (errors || []).map(function(error) {
      return error.message;
    });
    var errorMessage = errorStrings.join('\n');

    this.ui.modelError.text(errorMessage);
  },


  getPermissionOptions: function() {
    var entity = this.model.get('entity');
    var sd = this.model.get('securityDescriptor');
    var permissionOpts = [];

    if(sd && sd.type === 'GH_ORG') {
      permissionOpts.push({
        value: 'GH_ORG',
        label: 'Members of GitHub\'s' + sd.linkPath,
        selected: sd.type === 'GH_ORG'
      });
    }
    else if(sd && sd.type === 'GH_REPO') {
      permissionOpts.push({
        value: 'GH_REPO',
        label: 'People with push access to GitHub\'s' + sd.linkPath,
        selected: sd.type === 'GH_REPO'
      });
    }

    var hasGitHubOpts = permissionOpts.length > 0;

    permissionOpts.unshift({
      value: 'null',
      label: 'Only people you manually add below can admin',
      selected: sd.type === null
    });

    var groupId = entity.get('groupId');
    var group = null;
    if(groupId) {
      group = this.model.groupCollection.get(groupId);
    }

    permissionOpts.unshift({
      value: 'GROUP',
      label: 'Admins of the ' + (group ? (group.get('name') + ' ') : '') + 'community',
      selected: !hasGitHubOpts
    });

    return permissionOpts;
  },

  getBaseApiEndpointForEntity: function() {
    var entity = this.model.get('entity');
    var baseEntityApiUrl = '/v1/groups';
    // TODO: Better way to tell if it is a room or how to determine associated endpoint???
    var isRoom = entity && entity.get('groupId');
    if(isRoom) {
      baseEntityApiUrl = '/v1/rooms';
    }

    return baseEntityApiUrl;
  },

  getApiEndpointForEntity: function() {
    var entity = this.model.get('entity');
    if(entity) {
      return urlJoin(this.getBaseApiEndpointForEntity(), entity.get('id'));
    }
  },

  fetchSecurityDescriptor: function() {
    this.model.set('requestingSecurityDescriptorStatus', requestingSecurityDescriptorStatusConstants.PENDING);
    var securityApiUrl = urlJoin(this.getApiEndpointForEntity(), 'security');
    //return apiClient.get(securityApiUrl)
    return Promise.resolve({ type: null })
      .bind(this)
      .then(function(sd) {
        // TODO: Verify works once API is in place
        this.model.set({
          securityDescriptor: sd,
          requestingSecurityDescriptorStatus: requestingSecurityDescriptorStatusConstants.COMPLETE
        });
      })
      .catch(function(err) {
        //console.log('err', err, err.stack);
        this.model.set('requestingSecurityDescriptorStatus', requestingSecurityDescriptorStatusConstants.ERROR);
      });
  },

  fetchAdminUsers: function() {
    var entity = this.model.get('entity');

    if(entity) {
      this.model.adminCollection.url = urlJoin(this.getApiEndpointForEntity(), 'security/extraAdmins');
        // TODO: Verify works once API is in place
      this.model.adminCollection.fetch();
    }
  },

  submitNewSecurityDescriptor: function() {
    var modelIsValid = this.model.isValid();
    var errors = !modelIsValid && this.model.validationError;

    if(errors) {
      this.updateModelErrors();
      return;
    }

    var securityApiUrl = urlJoin(this.getApiEndpointForEntity(), 'security');
    var sd = this.model.get('securityDescriptor');
    sd.extraAdmins = this.model.adminCollection.map(function(user) {
      return user.get('id');
    });

    this.model.set('submitSecurityDescriptorStatus', submitSecurityDescriptorStatusConstants.PENDING);
    return apiClient.put(securityApiUrl)
      .bind(this)
      .then(function(updatedSd) {
        //console.log('updatedSd', updatedSd);
        this.model.set('submitSecurityDescriptorStatus', submitSecurityDescriptorStatusConstants.COMPLETE);
      })
      .catch(function(err) {
        //console.log('err', err, err.stack);
        this.model.set('submitSecurityDescriptorStatus', submitSecurityDescriptorStatusConstants.ERROR);
      });
  }

});


var Modal = ModalView.extend({
  disableAutoFocus: true,

  modelEvents: {
    'change:entity': 'onEntityChange'
  },

  initialize: function(options) {
    options = options || {};
    options.title = this.getModalTitle();
    this.options = options;

    options.menuItems = new Backbone.Collection(this.generateMenuItems().concat(options.menuItems || []));

    ModalView.prototype.initialize.call(this, options);
    this.view = new PermissionsView(_.extend({}, options, {
      menuItemCollection: options.menuItems
    }));
  },

  onEntityChange: function() {
    this.updateModalTitle();
    this.updateMenuItems();
  },

  updateModalTitle: function() {
    this.ui.title.text(this.getModalTitle());
  },

  updateMenuItems: function() {
    this.options.menuItems.set(this.generateMenuItems(), { merge: true });
  },

  getModalTitle: function() {
    var model = this.model;
    var entity = model && model.get('entity');

    var title = 'Community Permissions';

    if(entity) {
      title = entity.get('name') + ' Permissions';
    }

    return title;
  },

  generateMenuItems: function() {
    var model = this.model;
    var entity = model && model.get('entity');

    var items = [];

    if(entity) {
      var groupId = entity.get('groupId');
      if(groupId) {
        items.push({
          action: 'switch-to-group-entity',
          pull: 'left',
          text: 'Edit Community Permissions',
          className: 'modal--default__footer__link'
        });
      }
    }

    items.push({
      action: 'done',
      pull: 'right',
      text: 'Done',
      className: 'modal--default__footer__btn'
    });


    return items;
  }
});


module.exports = {
  View: PermissionsView,
  Modal: Modal
};
