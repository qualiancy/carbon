/*!
 * Carbon - balancer middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var cohesion = require('cohesion')
  , debug = require('debug')('carbon:balancer')
  , harbor = require('harbor');

/*!
 * Constants
 */

var CHILD = require('path').join(__dirname, 'balancer', 'child.js');

/*!
 * Main exports
 */

module.exports = balancer;

/**
 * # balancer
 *
 * Mounts the provided server to master and begins
 * the startup sequence.
 *
 * @param {Server} node http compatible server (connect, express)
 * @param {Options} options
 */

function balancer (host, file, opts) {
  opts = opts || {};
  debug('balancer route registered', host);

  var finder = new harbor.Harbor(opts.min, opts.max)
    , master = new cohesion.Master(CHILD)
    , names = []
    , lastWorker = 0;

  // provide a round-robin style balancing technique
  // TODO: allow for custom techniques
  function getNextWorker (cb) {
    var workers = master.workers
      , len = master.workers.length
      , index = lastWorker == (len - 1)
        ? 0
        : lastWorker + 1;

    // if a worker is ready
    if (workers[index] && workers[index].serverRunning) {
      lastWorker = index;
      return cb(null, workers[index].config.port);
    }

    // this prevents race conditions if it takes
    // a few seconds for first worker to start up
    setTimeout(function () {
      getNextWorker(function (err, port) {
        if (err) return cb(err);
        lastWorker = index;
        cb(null, port);
      });
    }, 100);
  }

  // Before hook for cohesion. Build the configuration
  // for the worker, including reserving a port.
  master.beforeEach(function (config, done) {
    var name = getName(host, names);
    names.push(name);

    config.name = name;
    config.server = file;

    finder.claim(name, function (err, port) {
      if (err) return done(err);
      config.port = port;
      debug('%n attached to port %d', name, port);
      done();
    });
  });

  // After hook for cohesion worker. Release the
  // port that was reserved for this worker instance.
  master.afterEach(function (config, done) {
    var name = config.name
      , ind = names.indexOf(name);
    finder.release(name);
    names.splice(ind, 1);
  });

  // Master event listener for new worker. Bind all
  // events needed to determine if a server is running.
  master.on('worker', function (worker) {
    worker.serverRunning = false;

    // flag server as listening so we can balance to it
    worker.on('listening', function () {
      worker.serverRunning = true;
    });
  });

  // provide a middleware handler for the carbon
  // framework. Will route to next server if hosts match.
  master.handle = function (req, res, next) {
    var address = prepareHost(req.headers.host);
    if (!address) return next();

    var req_host = address[0]
      , req_port = address[1] || 80;

    if (host == req_host || host == '*') {
      return getNextWorker(function (err, port) {
        debug('balancer routing to port %d', port);
        next(port);
      });
    }

    next();
  };

  // start all of the workers
  master.spawnWorkers();

  // return the master so user can manually restart if needed
  return master;
}

function getName (host, names) {
  var name = null
    , count = 1;

  do {
    name = !~names.indexOf(host + '-' + count)
      ? host + '-' + count
      : null;
    count++;
  } while (!name);

  return name;
}

function prepareHost (str) {
  if (!str || str.length === 0) return null;
  return str.split(':');
}
