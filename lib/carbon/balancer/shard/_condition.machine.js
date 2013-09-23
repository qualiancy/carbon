
/*!
 * Module dependencies
 */

var contraption = require('contraption');

/*!
 * Primary Exports
 */

var Machine = module.exports = contraption('shard-condition');

/*!
 * Initial machine state
 */

Machine.set('initial', 'disabled');

/**
 * #### .enable(cb)
 *
 * Enable this shard.
 *
 * @api public
 */

Machine.method('enable', {
    from: [ 'disabled', 'fresh', 'draining' ]
  , next: 'enabled'
  , handle: function(ev) {
      this._shardStore.set('condition', 'enabled');
      return true;
    }
});

/**
 * #### .disable(cb)
 *
 * Disable this shard.
 *
 * @param {Function}
 * @cb {Error|null} if error
 * @api public
 */

Machine.method('disable', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'disabled'
  , handle: drain('disabled')
});

/**
 * #### .drain(cb)
 *
 * Drain all active connections from this shard.
 *
 * @param {Function}
 * @cb {Error|null} if error
 * @api public
 */

Machine.method('drain', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'enabled'
  , handle: drain('enabled')
});

/*!
 * How to perform a drain on a shard.
 * Will wait for hidden `_drain` event
 * then proxy that event to a primary `drain`
 * event.
 *
 * @param {Stinrg} after state
 * @cb {Error|null} if error
 * @api private
 */

function drain(after) {
  return function(ev, cb) {
    var self = this;
    var store = this._shardStore;
    var stats = this._shardStats;
    store.set('condition', 'draining');

    function drained() {
      store.set('condition', after);
      self.emit('drain');
      cb();
    }

    if (!stats.active) return drained();
    this.once('_drain', drained);
  }
}

/*!
 * Put shard into saturated mode so
 * it stops accepting new connections
 * until a certain threshold. Can be
 * replaced by drain mode.
 *
 * @cb {Error|null} error
 * @api private
 */

Machine.method('_saturated', {
    from: 'available'
  , during: 'saturated'
  , next: 'fresh'
  , handle: saturated
});

/*!
 * Saturated handler Can be cancelled
 * if shards starts draining.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @cb {Error|null}
 * @api private
 */

function saturated(ev, cb) {
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
