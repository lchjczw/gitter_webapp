import React, {PropTypes, createClass} from 'react';
import TopicHeader from './components/topic/topic-header.jsx';
import TopicBody from './components/topic/topic-body.jsx';
import SearchHeader from './components/search/search-header.jsx';
import TopicReplyEditor from './components/topic/topic-reply-editor.jsx';
import TopicReplyListHeader from './components/topic/topic-reply-list-header.jsx';
import TopicReplyList from './components/topic/topic-reply-list.jsx';
import {dispatch} from '../dispatcher';
import updateReplyBody from '../action-creators/create-reply/body-update';

export default createClass({

  displayName: 'TopicContainer',
  propTypes: {

    topicId: PropTypes.string.isRequired,
    groupName: PropTypes.string.isRequired,

    topicsStore: PropTypes.shape({
      models: PropTypes.array.isRequired,
      getById: PropTypes.func.isRequired,
    }).isRequired,

    repliesStore: PropTypes.shape({
      getReplies: PropTypes.func.isRequired
    }).isRequired,

    categoryStore: PropTypes.shape({
      getCategories: PropTypes.func.isRequired,
    }).isRequired,

    currentUserStore: PropTypes.shape({
      getCurrentUser: PropTypes.func.isRequired
    }).isRequired

  },

  render(){

    const { topicId, topicsStore, groupName, repliesStore, categoryStore, currentUserStore } = this.props;
    const topic = topicsStore.getById(topicId)
    const replies = repliesStore.getReplies();
    const currentUser = currentUserStore.getCurrentUser();
    //TODO Improve this
    const category = categoryStore.getCategories()[1];

    return (
      <main>
        <SearchHeader groupName={groupName}/>
        <article>
          <TopicHeader topic={topic} category={category} groupName={groupName}/>
          <TopicBody topic={topic} />
        </article>
        <TopicReplyListHeader replies={replies}/>
        <TopicReplyList replies={replies} />
        <TopicReplyEditor user={currentUser} onChange={this.onEditorUpdate}/>
      </main>
    );
  },

  onEditorUpdate(val){
    dispatch(updateReplyBody(val));
  }
});
