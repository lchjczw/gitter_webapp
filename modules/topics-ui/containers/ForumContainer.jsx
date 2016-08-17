'use strict';

var React = require('react');
var CategoryList = require('./components/forum/category-list.jsx');
var {dispatch} = require('gitter-web-topics-ui/shared/dispatcher');
var navigateToCategory = require('gitter-web-topics-ui/shared/action-creators/forum/navigate-to-category');
var {UPDATE_ACTIVE_CATEGORY} = require('gitter-web-topics-ui/shared/constants/forum-categories');

module.exports = React.createClass({

  displayName: 'ForumContainer',

  propTypes: {
    groupName: React.PropTypes.string.isRequired,
    categoryStore: React.PropTypes.shape({
      models: React.PropTypes.array.isRequired,
      getCategories: React.PropTypes.func.isRequired
    }).isRequired
  },

  getInitialState(){
    const { categoryStore } = this.props;
    return {
      categories: categoryStore.getCategories()
    };
  },

  componentDidMount(){
    const { categoryStore } = this.props;
    categoryStore.on(UPDATE_ACTIVE_CATEGORY, this.onCategoryUpdate);
  },

  componentWillUnmount(){
    const { categoryStore } = this.props;
    categoryStore.off(UPDATE_ACTIVE_CATEGORY, this.onCategoryUpdate);
  },

  render() {
    const { categories } = this.state;
    const { groupName } = this.props;
    return (
      //Search header ...
      <CategoryList
        categories={ categories }
        groupName={ groupName }
        onCategoryClicked={ this.onCategoryClicked } />
    );
  },

  onCategoryClicked(category){
    //TODO Replace payload generation with an action-creator
    dispatch(navigateToCategory(category));
  },

  onCategoryUpdate(){
    const { categoryStore } = this.props;
    this.setState({
      categories: categoryStore.getCategories()
    })
  }

});
