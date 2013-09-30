
/*!
 * Module dependencies
 */

var async = require('breeze-async');
var contraption = require('contraption');
var extend = require('tea-extend');
var sherlock = require('sherlock');

/*!
 * Primary exports
 */

var Machine = module.exports = contraption('balancer');

/*!
 * Initial machine state
 */

Machine.set('initial', 'inactive');

/*!
 * #### .initialize(opts)
 *
 * Initialize the balancer. This is called on
 * construction. Any error's thrown will be
 * cause the machine to enter an error deadlock
 * state. Must be syncronous.
 *
 * @param {MachineEvents}
 * @api private
 */

Machine.method('initialize', {
    from: 'inactive'
  , next: 'stopped'
  , handle: initialize
});

/*!
 * Take the passed options and attempt
 * to validate them against the schema. Then
 * invoke the user's `_init` method.
 *
 * @param {MachineEvents}
 * @api private
 */

function initialize(ev) {
  var state = this._balancerState;
  var store = this._balancerStore;
  var schema = store.schema;
  var opts = schema.cast(ev.args[0] || {});

  if (!opts.valid) {
    var err = new Error('Found ' + opts.errors.length + ' error(s) when validating options.');
    err.errors = opts.errors;
    throw err;
  }

  store.set(opts.casted);
  state.ns = this.get('type') + '-state';
  state.debug = sherlock('carbon:balancer:' + this.get('type') + '-state');
  this.strategy(this.get('strategy') || 'random');
  this._init();
}

/**
 * #### .start(cb)
 *
 * Start this balancer by starting underlying
 * socket resources then routing traffic. Will
 * emit `started` on completion.
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @api public
 */

Machine.method('start', {
    from: 'stopped'
  , during: 'starting'
  , next: 'started'
  , handle: start
});

/*!
 * Start handle for machine runs pre-start hook,
 * starts underlying ip handles, then finalizes
 * with post-start hook.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @api private
 */

function start(ev, cb) {
  async.series([
      this._preStart.bind(this)
    , manageIPs('start').bind(this)
    , this._postStart.bind(this)
  ], cb);
}

/**
 * #### .stop(cb)
 *
 * Stop this load balancer by removing
 * hooks to underlying socket resources
 *
 * @param {Function} callback
 * @cb {Error|null} if error
 * @api public
 */

Machine.method('stop', {
    from: [ 'started' ]
  , during: 'stopping'
  , next: 'stopped'
  , handle: stop
});

/*!
 * Stop handle for machine runs pre-stop hook,
 * stops underlying ip handles, then finalizes
 * with post-stop hook.
 *
 * @param {MachineEvent} event
 * @param {Function} callback
 * @api private
 */

function stop(ev, cb) {
  async.series([
      this._preStop.bind(this)
    , this.drainShards.bind(this)
    , manageIPs('stop').bind(this)
    , this._postStop.bind(this)
  ], cb);
}

/*!
 * Generalize utiltity to start or stop
 * all underlying ip handles.
 *
 * @param {String} action
 * @return {Function}
 * @api private
 */

function manageIPs(action) {
  var ipp = extend.include('address', 'protocol');
  return function(cb) {
    var self = this;
    var ips = this.get('ips');
    var port = this.get('port');
    async.forEach(ips, function(ip, next) {
      var opts = extend({}, ipp(ip), { port: port });
      self['_' + action + 'VirtualIP'](opts, next);
    }, cb);
  }
}