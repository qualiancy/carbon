
var contraption = require('contraption');
var Machine = module.exports = contraption('shard-condition');

Machine.set('initial', 'disabled');

Machine.method('enable', {
    from: [ 'disabled', 'fresh' ]
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
  , handle: function(ev, cb) {
      var store = this._shardStore;
      var stats = this._shardStats;
      store.set('condition', 'draining');

      function drained() {
        store.set('condition', 'disabled');
        cb();
      }

      if (!stats.active) return drained();
      this.once('_drain', drained);
    }
});

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
