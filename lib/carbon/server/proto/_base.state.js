
/*!
 * Module dependencies
 */

var async = require('breeze-async');
var contraption = require('contraption');
var sherlock = require('sherlock');

/*!
 * Primary Exports
 */

var State = module.exports = contraption('server');

/*!
 * Initial machine state
 */

State.set('initial', 'inactive');

/*!
 * #### .initialize(opts)
 *
 * Validate options against the schema and set
 * the initial state. Cannot be called more
 * than once and is called upon construction.
 *
 * @param {Object} options
 * @api private
 */

State.method('initialize', {
    from: 'inactive'
  , next: 'ready'
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
  var state = this._serverState;
  var store = this._serverStore;
  var schema = store.schema;
  var opts = schema.cast(ev.args[0] || {});

  function clean() {
    self.removeListener('error', clean);
    state.removeListener('ready', clean);
  }

  this.on('error', clean);
  state.on('ready', clean);

  if (!opts.valid) {
    var err = new Error('Found ' + opts.errors.length + ' error(s) when validating options.');
    err.errors = opts.errors;
    throw err;
  }

  store.set(opts.casted);
  state.ns = this.get('type') + '-state';
  state.debug = sherlock('carbon:server:' + this.get('type') + '-state');
  this._init();
}

/**
 * #### .listen(address, port[, cb])
 *
 * Start the listening sequence for this
 * server. Can provide custom `address` and
 * `port` to replace the embedded options.
 *
 * @param {String} address
 * @param {Number} port
 * @cb {Error|null} if error
 * @api public
 */

State.method('listen', {
    from: [ 'close', 'ready', 'restarted' ]
  , during: 'starting'
  , next: 'listening'
  , handle: listen
});

/*!
 * Listen handle.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @cb {Error|null}
 * @api private
 */

function listen(ev, cb) {
  var args = ev.args;
  var debug = ev.debug;
  var opts = {};
  var store = this._serverStore;

  opts.address = args[1] || store.get('address');
  opts.port = args[0] || store.get('port');

  this._listen(opts, function done(err) {
    if (err) return cb(err);
    store.set(opts);
    debug('listening: %s:%d', opts.address, opts.port);
    cb(null, opts.port, opts.address);
  });
}

/**
 * #### .stop([cb])
 *
 * Stop this server.
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @api public
 */

State.method('close', {
    from: 'listening'
  , during: 'closing'
  , next: 'close'
  , handle: close
});

/*!
 * Close handle.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @cb {Error|null}
 * @api private
 */

function close(ev, cb) {
  this._close(cb);
}

/**
 * #### .restart([cb])
 *
 * Restart this server.
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @api public
 */

State.method('restart', {
    from: 'listening'
  , during: 'restarting'
  , next: 'restarted'
  , handle: restart
});

/*!
 * Restart handle.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @cb {Error|null}
 * @api private
 */

function restart(ev, cb) {
  var self = this;
  var debug = ev.debug;
  var done = function (err) { cb(err); };
  var opts = {};
  var store = this._serverStore;

  opts.address = store.get('address');
  opts.port = store.get('port');

  function state() {
    var args = [ opts.port, opts.address ];
    ev.machine.setState('listening', args, true);
  }

  function announce(next) {
    debug('listening: %s:%d', opts.address, opts.port);
    setImmediate(state);
    next();
  }

  async.series([
      this._close.bind(this)
    , this._listen.bind(this, opts)
    , announce
  ], done);
}
