import React, {PropTypes} from 'react';
import Modal from '../modal.jsx';
import Input from '../forms/input.jsx';
import TextTypeAhead from '../forms/text-type-ahead.jsx';
import H1 from '../text/h-1.jsx';
import Editor from '../forms/editor.jsx';
import Submit from '../forms/submit.jsx';
import Select from '../forms/select.jsx';

export default React.createClass({

  displayName: 'CreateTopicModal',
  propTypes: {

    active: PropTypes.bool.isRequired,
    tagValues: PropTypes.arrayOf(PropTypes.string).isRequired,

    categories: PropTypes.arrayOf(PropTypes.shape({
      selected: PropTypes.bool.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string,
    })).isRequired,

    newTopic: PropTypes.shape({
      title: PropTypes.string.isRequired,
      body: PropTypes.string.isRequired,
      categoryId: PropTypes.string.isRequired,
    }).isRequired,

    tags: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })),

    onSubmit: PropTypes.func.isRequired,
    onTitleChange: PropTypes.func.isRequired,
    onBodyChange: PropTypes.func.isRequired,
    onCategoryChange: PropTypes.func.isRequired,
    onTagsChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  },

  render(){
    const { active, categories, tagValues, newTopic } = this.props;
    const { title, body, categoryId } = newTopic;

    return (
      <Modal active={active} onClose={this.onClose}>
        <form name="create-topic" onSubmit={this.onSubmit}>
          <H1 className="create-topic__heading">New Topic</H1>
          <Input
            className="create-topic__input--name"
            name="title"
            placeholder="Add title ..."
            value={title}
            onChange={this.onTitleChange}/>

          <div className="create-topic__details-row">
            <Select
              options={categories}
              className="select--create-topic-category"
              defaultValue={categoryId}
              onChange={this.onCategoryChange}/>
            <TextTypeAhead
              name="test"
              placeholder="Add tags ..."
              className="create-topic__input--tags"
              onSubmit={this.onTagsChange}
              completions={tagValues} />
          </div>
          {this.getTagsRow()}
          <Editor
            className="create-topic__editor--body"
            name="body"
            value={body}
            placeholder="Type here. Use Markdown, BBCode, or html to format."
            onChange={this.onBodyChange}/>

          <div className="create-topic__control-row">
            <Submit className="create-topic__submit">Create Topic</Submit>
          </div>
        </form>
      </Modal>
    );
  },

  getTagsRow(){
    const {tags} = this.props;
    if(!tags.length) { return; }
    return (
      <div className="create-topic__details-row">
        <ul className="create-topic__tags">
          {tags.map(this.getTagRowChild)}
        </ul>
      </div>
    );
  },

  getTagRowChild(tag, i){
    return (
      <li key={`tag-row-child-${tag.value}-${i}`}>
        <button className="create-topic__tags__child">
          {tag.label}
        </button>
      </li>
    );
  },

  onTitleChange(title){
    this.props.onTitleChange(title);
  },

  onBodyChange(body){
    this.props.onBodyChange(body);
  },

  onSubmit(e){
    e.preventDefault();
    this.props.onSubmit();
  },

  onClose(){
    this.props.onClose();
  },

  onCategoryChange(val){
    this.props.onCategoryChange(val);
  },

  onTagsChange(tag){
    this.props.onTagsChange(tag);
  }


});