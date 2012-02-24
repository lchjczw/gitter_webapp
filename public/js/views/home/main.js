// Filename: views/home/main
define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/home/main.mustache'
], function($, _, Backbone, Mustache, template){
  var MainHomeView = Backbone.View.extend({    
    render: function() {
      var compiledTemplate = Mustache.render(template, { });
      $(this.el).html(compiledTemplate);
      return this;
    }
    
  });

  return MainHomeView;
});
