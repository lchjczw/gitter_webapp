import Backbone from 'backbone';
import {subscribe} from '../../../shared/dispatcher';
import {SUBMIT_NEW_TOPIC, TOPIC_CREATED} from '../../../shared/constants/create-topic';
import parseTag from '../../../shared/parse/tag';
import {getRealtimeClient} from './realtime-client';
import LiveCollection from './live-collection';
import dispatchOnChangeMixin from './mixins/dispatch-on-change';
import {getForumId} from './forum-store';
import {BaseModel} from './base-model';

export const TopicModel = BaseModel.extend({
  url(){
    return this.get('id') ? null : `/api/v1/forums/${getForumId()}/topics`;
  },

  toJSON() {
    var data = this.attributes;
    data.tags = (data.tags || []);
    return Object.assign({}, data, {
      tags: data.tags.map(parseTag)
    });
  },

  getDataToSave(){
    const data = this.toJSON();
    const tags = (data.tags || []);
    //Tags are parsed on the server during a pre-render
    //but not on an update from the realtime connection
    //need to sort this out. Below is a temp fix.
    const parsedTags = tags[0].label ?
      tags : tags.map((t) => t.label);

    return Object.assign({}, data, {
      tags: parsedTags
    });
  }

});

export const TopicsStore = LiveCollection.extend({

  model: TopicModel,
  client: getRealtimeClient(),
  urlTemplate: '/v1/forums/:forumId/topics',

  getContextModel(){
    return new Backbone.Model({
      forumId: getForumId()
    });
  },

  initialize(){
    subscribe(SUBMIT_NEW_TOPIC, this.creatNewTopic, this);
  },

  getTopics() {
    return this.models.map(model => model.toJSON());
  },

  getById(id){
    const model = this.get(id);
    if(!model){ return; }
    return model.toJSON();
  },

  creatNewTopic(data){

    const model = this.create({
      title: data.title,
      text: data.body,
      categoryId: data.categoryId,
      tags: data.tags
    }, { wait: true });

    model.once('add', () => {
      this.trigger(TOPIC_CREATED, {
        topicId: model.get('id'),
        slug: model.get('slug')
      });
    });
  }

});

dispatchOnChangeMixin(TopicsStore);

const serverStore = (window.context.topicsStore || {});
const serverData = (serverStore.data || []);
let store;
export function getTopicsStore(data){
  if(!store) { store = new TopicsStore(serverData); }
  if(data) { store.set(data); }
  return store;
}
