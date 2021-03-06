'use strict';

var _ = require('underscore');
var toggleClass = require('../../../utils/toggle-class');
var context = require('../../../utils/context');
var slugger = require('../../../utils/slugger');

var fuzzysearch = require('fuzzysearch');
var SimpleFilteredCollection = require('gitter-realtime-client/lib/simple-filtered-collection');
var getRoomNameFromTroupeName = require('gitter-web-shared/get-room-name-from-troupe-name');
var scopeUpgrader = require('../../../components/scope-upgrader');

var stepConstants = require('../step-constants');
var template = require('./community-creation-github-projects-view.hbs');
var CommunityCreateBaseStepView = require('../shared/community-creation-base-step-view');
var CommunityCreationOrgListView = require('./community-creation-org-list-view');
var CommunityCreationRepoListView = require('./community-creation-repo-list-view');

require('../../behaviors/isomorphic');

require('@gitterhq/styleguide/css/components/headings.css');
require('@gitterhq/styleguide/css/components/buttons.css');

var _super = CommunityCreateBaseStepView.prototype;

module.exports = CommunityCreateBaseStepView.extend({
  template: template,
  nextStep: stepConstants.MAIN,
  prevStep: stepConstants.MAIN,
  behaviors: {
    Isomorphic: {
      orgListView: { el: '.community-create-org-list-root', init: 'initOrgListView' },
      repoListView: { el: '.community-create-repo-list-root', init: 'initRepoListView' }
    }
  },

  initOrgListView: function(optionsForRegion) {
    this.orgListView = new CommunityCreationOrgListView(
      optionsForRegion({
        collection: this.communityCreateModel.orgs
      })
    );
    this.listenTo(this.orgListView, 'org:activated', this.onOrgSelectionChange, this);
    this.listenTo(this.orgListView, 'org:cleared', this.onOrgSelectionChange, this);
    return this.orgListView;
  },

  initRepoListView: function(optionsForRegion) {
    this.repoListView = new CommunityCreationRepoListView(
      optionsForRegion({
        collection: this.filteredRepos
      })
    );
    this.listenTo(this.repoListView, 'repo:activated', this.onRepoSelectionChange, this);
    this.listenTo(this.repoListView, 'repo:cleared', this.onRepoSelectionChange, this);
    return this.repoListView;
  },

  className: 'community-create-step-wrapper community-create-github-projects-step-wrapper',

  ui: _.extend({}, _super.ui, {
    orgsToggle: '.js-community-create-github-projects-toggle-orgs',
    reposToggle: '.js-community-create-github-projects-toggle-repos',
    orgsArea: '.js-community-create-github-projects-orgs-area',
    reposArea: '.js-community-create-github-projects-repos-area',
    repoFilterInput: '.primary-community-repo-name-filter-input',
    repoScopeMissingNote: '.community-create-repo-missing-note',
    upgradeGitHub: '.js-upgrade-github'
  }),

  events: _.extend({}, _super.events, {
    'click @ui.orgsToggle': 'onOrgsAreaToggle',
    'click @ui.reposToggle': 'onReposAreaToggle',
    'input @ui.repoFilterInput': 'onRepoFilterInputChange',
    'click @ui.upgradeGitHub': 'onUpgradeGitHub'
  }),

  modelEvents: _.extend({}, _super.modelEvents, {
    'change:isOrgAreaActive change:isRepoAreaActive': 'onAreaActiveChange',
    'change:repoFilter': 'onRepoFilterChange'
  }),

  initialize: function() {
    _super.initialize.apply(this, arguments);

    this.filteredRepos = new SimpleFilteredCollection([], {
      collection: this.communityCreateModel.repos
    });

    this.debouncedApplyFilterToRepos = _.debounce(this.applyFilterToRepos.bind(this), 200);
  },

  serializeData: function() {
    var data = this.model.toJSON();
    var user = context.getUser();
    data.isUserMissingPrivateRepoScope = user && user.scopes && !user.scopes.private_repo;

    return data;
  },

  onRender: function() {
    this.onAreaActiveChange();
  },

  setSelectedGitHubProjectCommunityState: function() {
    if (this.model.get('isOrgAreaActive')) {
      var selectedOrgId = this.model.get('selectedOrgId');
      var selectedOrgName = this.model.get('selectedOrgName') || '';
      this.communityCreateModel.set({
        communityName: selectedOrgName,
        communitySlug: slugger(selectedOrgName),
        isUsingCustomSlug: false,
        githubOrgId: selectedOrgId,
        githubRepoId: null,
        isUsingExplicitGitHubProject: !!selectedOrgName
      });
    } else if (this.model.get('isRepoAreaActive')) {
      var selectedRepoId = this.model.get('selectedRepoId');
      var selectedRepoName = getRoomNameFromTroupeName(this.model.get('selectedRepoName') || '');
      this.communityCreateModel.set({
        communityName: selectedRepoName,
        communitySlug: slugger(selectedRepoName),
        isUsingCustomSlug: false,
        githubOrgId: null,
        githubRepoId: selectedRepoId,
        isUsingExplicitGitHubProject: !!selectedRepoId
      });
    }
  },

  onOrgsAreaToggle: function() {
    this.setAreaActive('isOrgAreaActive');
  },

  onReposAreaToggle: function() {
    this.setAreaActive('isRepoAreaActive');
  },

  onAreaActiveChange: function() {
    var isOrgAreaActive = this.model.get('isOrgAreaActive');
    var isRepoAreaActive = this.model.get('isRepoAreaActive');

    toggleClass(this.ui.orgsToggle[0], 'active', isOrgAreaActive);
    toggleClass(this.ui.reposToggle[0], 'active', isRepoAreaActive);

    toggleClass(this.ui.orgsArea[0], 'active', isOrgAreaActive);
    toggleClass(this.ui.reposArea[0], 'active', isRepoAreaActive);
  },

  setAreaActive: function(newActiveAreaKey) {
    this.model.set({
      isOrgAreaActive: newActiveAreaKey === 'isOrgAreaActive',
      isRepoAreaActive: newActiveAreaKey === 'isRepoAreaActive'
    });
  },

  onOrgSelectionChange: function(activeModel) {
    var selectedOrgId = null;
    var selectedOrgName = null;
    if (activeModel) {
      selectedOrgId = activeModel.get('id');
      selectedOrgName = activeModel.get('name');
    }

    // Set any repo item that may be selected inactive
    var previousActiveRepoModel = this.communityCreateModel.repos.findWhere({ active: true });
    if (previousActiveRepoModel) {
      previousActiveRepoModel.set('active', false);
    }

    this.model.set({
      selectedOrgId: selectedOrgId,
      selectedOrgName: selectedOrgName,
      selectedRepoId: null,
      selectedRepoName: null
    });

    this.setSelectedGitHubProjectCommunityState();
    // Clicking a org moves you onto the next step and fills in the data
    if (activeModel) {
      this.onStepNext();
    }
  },

  onRepoSelectionChange: function(activeModel) {
    var selectedRepoId = null;
    var selectedRepoName = null;
    if (activeModel) {
      selectedRepoId = activeModel.get('id');
      selectedRepoName = activeModel.get('name');
    }

    // Set any org item that may be selected inactive
    var previousActiveOrgModel = this.communityCreateModel.orgs.findWhere({ active: true });
    if (previousActiveOrgModel) {
      previousActiveOrgModel.set('active', false);
    }

    this.model.set({
      selectedOrgId: null,
      selectedOrgName: null,
      selectedRepoId: selectedRepoId,
      selectedRepoName: selectedRepoName
    });

    this.setSelectedGitHubProjectCommunityState();
    // Clicking a repo moves you onto the next step and fills in the data
    if (activeModel) {
      this.onStepNext();
    }
  },

  onRepoFilterInputChange: function() {
    var filterInput = this.ui.repoFilterInput[0].value;
    this.model.set('repoFilter', filterInput.length > 0 ? filterInput : null);
  },

  onRepoFilterChange: function() {
    this.debouncedApplyFilterToRepos();
  },

  applyFilterToRepos: function() {
    var filterString = (this.model.get('repoFilter') || '').toLowerCase();

    this.filteredRepos.setFilter(function(model) {
      var shouldShow = true;
      if (filterString && filterString.length > 0) {
        shouldShow = fuzzysearch(filterString, model.get('name').toLowerCase());
      }

      return shouldShow;
    });
  },

  onUpgradeGitHub: function(e) {
    e.preventDefault();

    var self = this;
    scopeUpgrader('repo')
      .then(function() {
        self.ui.repoScopeMissingNote.hide();
        return self.communityCreateModel.refreshGitHubCollections({ repos: true });
      })
      .then(function() {
        self.applyFilterToRepos();
      });

    return false;
  }
});
