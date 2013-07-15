/*jshint strict:true, undef:true, unused:strict, browser:true *//* global define:false */
define([
  'marionette',
  'utils/context',
  'views/base',
  'hbs!./tmpl/peopleItemView',
  'hbs!./tmpl/peopleCollectionView'
], function(Marionette, context, TroupeViews, peopleItemViewTemplate, peopleCollectionViewTemplate) {
  "use strict";

  var PeopleItemView = TroupeViews.Base.extend({
    tagName: 'span',
    template: peopleItemViewTemplate,

    initialize: function(/*options*/) {
      this.setRerenderOnChange();
    }
  });

  return TroupeViews.Base.extend({
    template: peopleCollectionViewTemplate,

    initialize: function(/*options*/) {
      this.data = { isOneToOne: window.troupeContext.troupe.oneToOne };
      this.collectionView = new Marionette.CollectionView({
        tagName: "span",
        collection: this.collection,
        itemView: PeopleItemView
      });
    },

    afterRender: function() {
      this.$el.find('.frame-people').append(this.collectionView.render().el);
    }

  });

});
