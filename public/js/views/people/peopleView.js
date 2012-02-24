// Filename: views/home/main
define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/people/people.mustache'
], function($, _, Backbone, Mustache, template){
  var PeopleView = Backbone.View.extend({    
    render: function() {
      var compiledTemplate = Mustache.render(template, { });
      $(this.el).html(compiledTemplate);
      return this;
    }
    
  });

  return PeopleView;
});
