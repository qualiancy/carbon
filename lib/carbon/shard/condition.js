
var contraption = require('contraption');
var Machine = module.exports = contraption('shard-condition');

Machine.set('initial', 'disabled');

Machine.method('enable', {
    from: [ 'disabled', 'fresh', 'draining' ]
  , next: 'enabled'
  , handle: function(ev) {
      this._shardStore.set('condition', 'enabled');
      return true;
    }
});

Machine.method('disable', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'disabled'
  , handle: drain('disabled')
});

Machine.method('drain', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'enabled'
  , handle: drain('enabled')
});

function drain(after) {
  return function(ev, cb) {
    var store = this._shardStore;
    var stats = this._shardStats;
    store.set('condition', 'draining');

    function drained() {
      store.set('condition', after);
      cb();
    }

    if (!stats.active) return drained();
    this.once('_drain', drained);
  }
}

Machine.method('_saturated', {
    from: 'available'
  , during: 'saturated'
  , next: 'fresh'
  , handle: function(ev, cb) {
      function clean() {
        this.removeListener('_fresh', listener);
      }

      function listener() {
        clean();
        cb();
        this.enable();
      }

      this._shardStore.set('condition', 'saturated');
      this.on('_fresh', listener);
      this.once('draining', clean);
    }
});
