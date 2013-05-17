/*jshint unused:true, browser:true */

define([
  'jquery',
  'underscore',
  'views/base',
  'hbs!./tmpl/createTroupeView',
  'log!create-troupe-view',
  'utils/validate-wrapper',
  'jquery-placeholder' // no ref
], function($, _, TroupeViews, template, log, validation) {
  var View = TroupeViews.Base.extend({
    template: template,

    initialize: function(options) {
      _.bindAll(this, 'onFormSubmit');
      if (!options) return;
      this.upgradeOneToOne = options.upgradeOneToOne;
      this.existingUser = options.existingUser;

      if (window.troupeContext) {
        this.isOneToOne = window.troupeContext.troupe.oneToOne;
      } else {
        this.isOneToOne = false;
      }
    },

    events: {
      "submit form": "onFormSubmit"
    },

    getRenderData: function() {
      var data = {
        existingUser: this.existingUser,
        isOneToOne: this.isOneToOne,
        upgradeOneToOne: this.upgradeOneToOne
      };

      if (window.userId) {
        data.userId = window.userId;
      }
      else if (window.troupeContext) {
        data.userId = window.troupeContext.user.id;
      }

      return data;
    },

    afterRender: function() {
      this.validateForm();
      this.$el.find('#troupeName').placeholder();
      this.$el.find('#email').placeholder();
    },

    validateForm : function () {
      var validationConfig = {
        rules: {
          troupeName: validation.rules.troupeName(),
          email: validation.rules.userEmail()
        },

        messages: {
          troupeName: validation.messages.troupeName(),
          email: validation.messages.troupeName()
        },

        showErrors: function(errorMap, errorList) {
          if (errorList.length > 0) {
            $('.signup-failure').show();
          }
          else {
            $('.signup-failure').hide();
          }
          var errors = "";
          $.each(errorList, function () { errors += this.message + "<br>"; });
          $('#failure-text').html(errors);
        }
      };

      this.$el.find('#signup-form').validate(validationConfig);
    },

    onFormSubmit: function(e) {
      if(e) e.preventDefault();
      var that = this;
      var form = this.$el.find('form');
      var serializedForm = {
        troupeName: form.find('input[name=troupeName]').val(),
        userId: form.find('input[name=userId]').val()
      };

      if (window.troupeContext.troupe.oneToOne && this.upgradeOneToOne) {
        serializedForm.oneToOneTroupeId = window.troupeContext.troupe.id;
      }

      that.collection.create(serializedForm, {
        url: '/troupes/',
        wait: true,
        success: function(troupe /*, resp, options*/) {
          log('response from upgrading one to one troupe', troupe);
          window.location.href = "/" + troupe.get('uri') + "#|share";
        }
      });
    }

  });

var Modal = TroupeViews.Modal.extend({
    initialize: function(options) {
      TroupeViews.Modal.prototype.initialize.apply(this, arguments);
      this.view = new View(options);
    }
  });

  return {
    View: View,
    Modal: Modal
  };

});
