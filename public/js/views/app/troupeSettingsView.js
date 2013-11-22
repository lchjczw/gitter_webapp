/*jshint strict:true, undef:true, unused:strict, browser:true *//* global define:false */
define([
  'jquery',
  'underscore',
  'utils/context',
  'views/base',
  'collections/instances/troupes',
  'collections/instances/integrated-items',
  'hbs!./tmpl/troupeSettingsTemplate',
  'log!troupe-settings-view',
  'utils/validate-wrapper',
  './integrationSettingsModal'
], function($, _, context, TroupeViews, troupeCollections, itemCollections, troupeSettingsTemplate, log, validation, IntegrationSettingsModal) {
  "use strict";


  // Stop the app router from reloading on troupe 'remove' event
  function removeTroupeCollectionRemoveListeners() {
    var troupeCollection = troupeCollections.troupes;
    troupeCollection.off("remove");
  }

  var View = TroupeViews.Base.extend({
    template: troupeSettingsTemplate,
    events: {
      'submit #troupeSettings': 'saveSettings',
      'click #cancel-troupe-settings' : 'closeSettings',
      'click #delete-troupe': 'deleteTroupe',
      'click #leave-troupe': 'leaveTroupe',
    },

    initialize: function() {
      this.model = troupeCollections.troupes.get(context.getTroupeId());
      this.userCollection = itemCollections.users;
      this.$el.toggleClass('canLeave', this.canLeave());
      this.$el.toggleClass('canDelete', this.canDelete());

      $.ajax({
        url: '/api/v1/user/' + context.getUserId() + '/troupes/' + context.getTroupeId() + '/settings/notifications',
        type: "GET",
        context: this,
        success: function(settings) {
          this.settings = settings && settings.push || "all";
          this.$el.find("#notification-options").val(this.settings);
          // this.trigger('settingsLoaded', settings);
        },
        error: function() {
          log('An error occurred while communicating with notification settings');
        }
      });

    },

    closeSettings : function () {
      this.dialog.hide();
      this.dialog = null;
    },

    afterRender: function() {
      this.validateForm();
      if (this.settings) {
        this.$el.find("#notification-options").val(this.settings);
      }
    },

    canDelete: function() {
      return this.userCollection.length == 1;
    },

    deleteTroupe: function() {
      var self = this;

      if (!this.canDelete()) {
        return window.alert("You need to be the only person in the troupe to delete it.");
      }

      var modal = new TroupeViews.ConfirmationModal({
        title: "Delete this Troupe?",
        body: "Are you sure you want to delete this troupe? This action cannot be undone.",
        menuItems: [
          { action: "yes", text: "Yes", className: "trpBtnRed" },
          { action: "no", text: "No", className: "trpBtnLightGrey"}
        ]
      });

       modal.on('menuItemClicked', function(action) {
        if (action === "yes") {
          removeTroupeCollectionRemoveListeners();
          $.ajax({
            url: '/api/v1/troupes/' + self.model.id,
            type: "DELETE",
            success: function() {
              window.location.href = '/last';
            },
            error: function(jqXHR, textStatus, e) {
              log('Error attempting to delete troupe', textStatus, e);
            }
          });
        }
        modal.off('menuItemClicked');
        modal.hide();
      });

      modal.show();
    },

    canLeave: function() {
      return this.userCollection.length > 1;
    },

    leaveTroupe: function() {
      var errMsg = "You cannot leave a troupe if you are the only member, rather delete it.";

      if (!this.canLeave()) {
        return window.alert(errMsg);
      }

      var modal = new TroupeViews.ConfirmationModal({
       title: "Leave?",
       body: "Are you sure you want to remove yourself from this troupe?",
       menuItems: [
         { action: "yes", text: "Yes", className: "trpBtnRed" },
         { action: "no", text: "No", className: "trpBtnLightGrey"}
       ]
      });

      modal.once('menuItemClicked', function(action) {
        if (action === "yes") {
          removeTroupeCollectionRemoveListeners();
          $.ajax({
            url: "/api/v1/troupes/" + context.getTroupeId() + "/users/" + context.getUserId(),
            data: "",
            type: "DELETE",
            success: function() {
              window.location = '/last';
            },
            error: function() {
              window.location = '/last';
            },
            global: false
          });
        }
        modal.hide();
      });

      modal.show();
    },

    getRenderData: function() {
      return _.extend({},
        context.getTroupe(), {
        canLeave: this.canLeave(),
        canDelete: this.canDelete(),
        isNativeDesktopApp: context().isNativeDesktopApp,
        troupeUrl: '//' + window.location.host + window.location.pathname
      });
    },

    validateForm : function () {
      var validateEl = this.$el.find('#troupeSettings');
      validateEl.validate({
        rules: {
          name: validation.rules.troupeName()
        },
        messages: {
          name: validation.messages.troupeName()
        },
        showErrors: function(errorMap) {
          var errors = "";

          _.each(_.keys(errorMap), function(key) {
            var errorMessage = errorMap[key];
            errors += errorMessage + "<br>";
          });

          $('#failure-text').html(errors);
          if(errors) {
            $('#request_validation').show();
          } else {
             $('#request_validation').hide();
          }
        }
     });
    },


    saveSettings: function(e) {
      if(e) e.preventDefault();

      var troupeName = this.$el.find('input[name=name]').val().trim();
      var self = this;

      if(context.troupe().get('name') === troupeName & this.settings == self.$el.find("#notification-options").val()) {
        self.dialog.hide();
        self.dialog = null;
        return;
      }

      context.troupe().set('name', troupeName);

      $.ajax({
        url: '/api/v1/troupes/' + context.getTroupeId(),
        contentType: "application/json",
        dataType: "json",
        type: "PUT",
        data: JSON.stringify({ name: troupeName }),
        success: function() {
          $.ajax({
            url: '/api/v1/user/' + context.getUserId() + '/troupes/' + context.getTroupeId() + '/settings/notifications',
            contentType: "application/json",
            dataType: "json",
            type: "PUT",
            data: JSON.stringify({ push: self.$el.find("#notification-options").val() }),
            success: function(data) {
              self.dialog.hide();
              self.dialog = null;
            }
          });

        }
      });
    }
  });

  return TroupeViews.Modal.extend({
      initialize: function(options) {
        options.title = "Settings";
        TroupeViews.Modal.prototype.initialize.apply(this, arguments);
        this.view = new View({ });
      }
    });
  });
