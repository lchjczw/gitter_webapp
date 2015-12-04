'use strict';

var Marionette = require('backbone.marionette');
var template   = require('./search-input-view.hbs');
var RAF        = require('utils/raf');

module.exports = Marionette.ItemView.extend({
  className: 'search-input-container',
  template: template,

  modelEvents: {
    'change:state': 'onModelChangeState'
  },

  events: {
    'input': 'onInputChange',
  },

  onModelChangeState: function(model, val) { /*jshint unused: true */
    RAF(function(){
      this.$el.toggleClass('active', (val === 'search'));
    }.bind(this));
    if (val === 'search') { this.$el.focus(); }
  },

  onInputChange: function(e) {
    e.preventDefault();
    this.model.set('searchTerm', e.target.value);
  }

});
