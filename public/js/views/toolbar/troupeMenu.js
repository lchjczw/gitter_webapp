/*jshint strict:true, undef:true, unused:strict, browser:true *//* global define:false */
define([
  'jquery',
  'underscore',
  'marionette',
  'collections/instances/troupes',
  'views/toolbar/troupeCollectionView',
  'hbs!views/toolbar/tmpl/troupeListItemEmpty',
  'hbs!views/toolbar/tmpl/privateTroupeListItemEmpty',
  'views/app/invitesView',
  'hbs!./tmpl/troupeMenu',
  './searchView',
  "nanoscroller" // No ref!
], function($, _, Marionette, troupeCollections, TroupeCollectionView, troupeListItemEmpty, privateTroupeListItemEmpty, InvitesView, template, SearchView) {
  "use strict";

  return Marionette.Layout.extend({
    template: template,
    tagName: 'span',
    selectedListIcon: "icon-mega",

    regions: {
      unread: "#left-menu-list-unread",
      invites: "#left-menu-list-invites",
      recent: "#left-menu-list-recent",
      favs: "#left-menu-list-favourites",
      troupes: "#left-menu-list",
      people: "#left-menu-list-users",
      search: "#left-menu-list-search"
    },

    events: {
     "click .left-menu-icon":    "onLeftMenuListIconClick"
    },

    initialize: function() {
      this.initHideListeners = _.once(_.bind(this.initHideListeners, this));

      var self = this;
      $(window).on('showSearch', function() {
        self.showSearch();
      });
    },

    onRender: function() {
      this.$el.find('.nano').nanoScroller({ preventPageScrolling: true });

      // recent troupe view
      this.recent.show(new TroupeCollectionView({ collection: troupeCollections.recentTroupes }));

      // normal troupe view
      this.troupes.show(new TroupeCollectionView({collection: troupeCollections.normalTroupes, emptyView: Marionette.ItemView.extend({ template: troupeListItemEmpty })}));

      // one to one troupe view
      this.people.show(new TroupeCollectionView({collection: troupeCollections.peopleTroupes, emptyView: Marionette.ItemView.extend({ template: privateTroupeListItemEmpty })}));

      // unread troupe view
      this.unread.show(new TroupeCollectionView({collection: troupeCollections.unreadTroupes }));

      // favourite troupe view
      this.favs.show(new TroupeCollectionView({ collection: troupeCollections.favouriteTroupes }));

      // incoming invites collection view
      this.invites.show(new InvitesView({ collection: troupeCollections.incomingInvites }));

      // search results collection view
      this.searchView = new SearchView({ troupes: troupeCollections.troupes, $input: this.$el.find('#list-search-input') });
      this.search.show(this.searchView);

      this.initHideListeners();

    },

    initHideListeners: function() {
      var self = this;

      toggler('#unreadTroupesList', troupeCollections.unreadTroupes);
      toggler('#favTroupesList', troupeCollections.favouriteTroupes);
      toggler('#recentTroupesList', troupeCollections.recentTroupes);
      toggler('#invitesList', troupeCollections.incomingInvites);

      function toggler(element, collection) {
        function toggle() {
          self.$el.find(element).toggle(collection.length > 0);
          self.$el.find('.nano').nanoScroller({ preventPageScrolling: true });
          self.toggleMegaList();
        }

        collection.on('all', toggle);
        toggle();
      }
    },

    toggleMegaList: function() {
      var c = troupeCollections;
      var invisibile = (c.unreadTroupes.length === 0 && c.favouriteTroupes.length === 0 && c.recentTroupes.length === 0 && c.incomingInvites.length === 0);

      var icon = this.$el.find('ul li:first-child');
      if (invisibile) {
        icon.hide();
        if (!this.selectedListIcon || this.selectedListIcon === 'icon-mega') {
          this.showTab('icon-troupes');
        }
      }
      else {
        icon.show();
        this.showTab('icon-mega');
      }
    },

    onLeftMenuListIconClick: function(e) {
      var selected = $(e.target).attr('id');
      this.showTab(selected);
    },

    showTab: function(selected) {
      if(selected === this.selectedListIcon) return;

      // Turn off the old selected list
      var currentSelection = this.$el.find("#"+this.selectedListIcon);
      currentSelection.removeClass('selected').fadeTo(100, 0.6);
      var listElement = currentSelection.data('list');

      this.$el.find("#" + listElement).hide();

      // TODO: We probably want to destroy the list to remove the dom elements

      // enable the new selected list
      this.selectedListIcon = selected;
      var newSelection = this.$el.find("#" + this.selectedListIcon);

      newSelection.addClass('selected');
      listElement = newSelection.data('list');

      this.$el.find("#" + listElement).show();

      // TODO: Related to the above TODO, we probably only want to populate the list now

      if (this.selectedListIcon == 'icon-search') {
        this.activateSearchList();
      }

      this.$el.find('.nano').nanoScroller({ preventPageScrolling: true });

    },

    activateSearchList: function() {
      this.$el.find('#list-search-input').focus();
    },

    showSearch: function() {
      this.showTab('icon-search');
    }

  });


});
