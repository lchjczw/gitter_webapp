import _ from 'lodash';

const onReactionsUpdate = function({ entityId, replyId, commentId, reactionKey, isReacting }) {
  const id = entityId || replyId || commentId;
  const entity = this.collection.get(id);
  if(!entity) { return; }

  const ownReactions = entity.get('ownReactions') || {};

  entity.set({
    // `reactionCounts` is handled in the live-collection
    ownReactions: _.extend({}, ownReactions, {
      [reactionKey]: isReacting
    })
  });
}


export default function dipatchOnChangeMixin(Constructor, onReactionsUpdateCallbackName = 'onReactionsUpdate') {
  Constructor.prototype[onReactionsUpdateCallbackName] = onReactionsUpdate;

  return Constructor;

}
