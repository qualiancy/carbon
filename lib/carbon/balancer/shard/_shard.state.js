
/*!
 * Module dependencies
 */

var contraption = require('contraption');

/*!
 * Primary Exports
 */

var State = module.exports = contraption('shard-state');

/*!
 * Initial machine state
 */

State.set('initial', 'inactive');

/*!
 * Deadlocks
 */

State.deadlock('_ready');

/*!
 * #### .initialize(opts)
 *
 * Validate options against the schema and set
 * the initial state. Cannot be called more
 * than once and is called upon construction of
 * a shard.
 *
 * @param {Object} options
 * @api private
 */

State.method('initialize', {
    from: 'inactive'
  , next: '_ready'
  , handle: initialize
});

/*!
 * Handle for method `initialize`.
 *
 * @param {MachineEvent} event
 * @throws {Error} on validation error
 * @api private
 */

function initialize(ev) {
  var self = this;
  var state = this._shardState;
  var store = this._shardStore;
  var schema = store.schema;
  var opts = schema.cast(ev.args[0] || {});

  function clean() {
    self.removeListener('error', clean);
    state.removeListener('_ready', ready);
  }

  function ready() {
    clean();
    var condition = store.get('condition');
    ev.debug('(init) force state: %s', condition);
    state.setState(condition, [], true);
  }

  this.on('error', clean);
  state.on('_ready', ready);

  if (!opts.valid) {
    var err = new Error('Found ' + opts.errors.length + ' error(s) when validating options.');
    err.errors = opts.errors;
    throw err;
  }

  store.set(opts.casted);
}

/**
 * #### .enable(cb)
 *
 * Enable this shard.
 *
 * @api public
 */

State.method('enable', {
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

State.method('disable', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'disabled'
  , handle: drain
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

State.method('drain', {
    from: [ 'enabled', 'saturated' ]
  , during: 'draining'
  , next: 'enabled'
  , handle: drain
});

/*!
 * How to perform a drain on a shard.
 * Will wait for hidden `_drain` event
 * then proxy that event to a primary `drain`
 * event.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @api private
 */

function drain(ev, cb) {
  var self = this;
  var stats = this._shardStats;

  function drained() {
    self.emit('drain');
    cb();
  }

  if (!stats.active) return setImmediate(drained);
  this.once('_drain', drained);
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

State.method('_saturated', {
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
  var self = this;

  function clean() {
    self.removeListener('_fresh', listener);
    self.removeListener('draining', clean);
  }

  function listener() {
    clean();
    cb();
    self.enable();
  }

  this.on('_fresh', listener);
  this.on('draining', clean);
}
