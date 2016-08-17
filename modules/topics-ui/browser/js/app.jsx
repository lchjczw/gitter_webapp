'use strict';

const React = require('react');
const Backbone = require('backbone');
const ForumContainer = require('gitter-web-topics-ui/containers/ForumContainer.jsx');
const CategoryStore = require('./stores/forum-category-store');
const navConstatnts = require('gitter-web-topics-ui/shared/constants/navigation');

module.exports = React.createClass({

  displayName: 'App',

  propTypes: {
    //System router
    router: React.PropTypes.shape({
      get: React.PropTypes.func.isRequired,
      set: React.PropTypes.func.isRequired,
    })
  },

  getInitialState(){
    const { router } = this.props;
    switch(router.get('route')) {
      case navConstatnts.FORUM_ROUTE: return this.getForumState();
    }
  },

  render(){
    const { route } = this.state;
    switch(route) {
      case navConstatnts.FORUM_ROUTE: return <ForumContainer {...this.state} />
    }
  },

  getDefaultState(){
    const { router } = this.props;
    return { route: router.get('route') };
  },

  getForumState(){
    const categoryStore = (window.context.categoryStore || {});
    const { router } = this.props;
    return Object.assign(this.getDefaultState(), {
      groupName: router.get('groupName'),
      categoryStore: new CategoryStore(categoryStore.models, { router: router }),
    });
  }

});
