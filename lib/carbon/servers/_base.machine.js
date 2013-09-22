
var async = require('breeze-async');
var contraption = require('contraption');
var Machine = module.exports = contraption('server');

Machine.set('initial', 'inactive');

Machine.method('listen', {
    from: [ 'close', 'error', 'inactive', 'restarted' ]
  , during: 'starting'
  , next: 'listening'
  , handle: listen
});

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

Machine.method('close', {
    from: 'listening'
  , during: 'closing'
  , next: 'close'
  , handle: close
});

function close(ev, cb) {
  this._close(cb);
}

Machine.method('restart', {
    from: 'listening'
  , during: 'restarting'
  , next: 'restarted'
  , handle: restart
});

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