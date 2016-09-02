export default function dipatchOnChangeMixin(Constructor){

  Constructor.prototype.events = [];
  const events = ['add', 'remove', 'reset', 'sync', 'snapshot'];

  Constructor.prototype.onChange = function(fn, ctx){
    var evts = events.concat(this.events).join(' ');
    this.listenTo(this, evts, fn, ctx);
  }

  Constructor.prototype.removeListeners = function(){
    this.stopListening();
  }

  return Constructor;

}
