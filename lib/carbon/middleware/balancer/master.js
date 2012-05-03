/*!
 * Carbon - balancer middleware (master)
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var Drip = require('drip')
  , util = require('util')
  , os = require('os')
  , fs = require('fs')
  , env = process.env.NODE_ENV
  , debug = require('debug')('carbon-balancer:master')
  , Worker = require('./worker');

/*!
 * Main exports
 */

module.exports = Master;

/**
 * Master (constructor)
 *
 * The master object watches over all of the works
 * and will restart them if need.
 *
 * @param {Server} node http compatible server (connect, express)
 * @param {Options} options
 */

function Master (server, options) {
  Drip.call(this);
  options = options || {};
  this.server = server;
  this.workers = [];
  this.maxWorkers = options.maxWorkers || os.cpus().length
  this.host = options.host || 'localhost';
  this.port = options.port;
  this.optWatch = ('boolean' === typeof options.watch)
    ? options.watch
    : true;
  this.lastWorker = 0;
}

/**
 * Master is an event emitter
 */

util.inherits(Master, Drip);

/**
 * # spawnWorker
 *
 * Spawns a new worker for the provided server
 *
 * @param {Function} callback upon working spawn
 * @api public
 */

Master.prototype.spawnWorker = function (cb) {
  var self = this
    , worker = new Worker(this.server);

  function done () {
    worker.off('register', done);
    debug('worker %d registered', worker.pid);
    cb(null, worker);
  }

  worker.once('register', done);
  worker.spawnWorker(function (err)  {
    if (err) {
      worker.off('register', done);
      cb(err);
    }
  });
};

/**
 * # spawnWorkers
 *
 * Ensures that the number of active or spawning
 * workers matches maxWorkers.
 *
 * If the master is restarting it will an empty array
 * for the new workers. Once restart is complete it
 * will switch the active set of workers. Allows for
 * zero-downtime restarts.
 *
 * @param {Array} array of workers
 * @param {Function} callback on all workers spawned
 * @api public
 */

Master.prototype.spawnWorkers = function (arr, cb) {
  // default to this.workers
  if ('function' == typeof arr) {
    cb = arr;
    arr = this.workers;
  }

  // defaults
  var self = this
    , max = this.maxWorkers;
  cb = cb || function() {}; // noop
  arr = arr || this.workers;

  // spawn single worker callback checks
  function spawn() {
    if (max - arr.length == 0) {
      self.watchServer();
      return cb(null);
    }
    self.spawnWorker(function (err, worker) {
      if (err) return cb(err);
      arr.push(worker);
      spawn();
    });
  };

  spawn();
};

/**
 * # watchServer
 *
 * (re)Register node watchFile thread on the current
 * server file. Executed after all servers have started.
 *
 * @api public
 */

Master.prototype.watchServer = function () {
  if (!this.optWatch) return;
  var self = this
    , file = this.server;

  fs.unwatchFile(file);

  fs.watchFile(file, function (curr, prev) {
    if (prev.mtime < curr.mtime) {
      debug('server change registered');
      self.emit('changed');
      self.restartWorkers();
    }
  });
};

/**
 * # restartWorkers
 *
 * Starts the zero-downtime psuedo-cluster restart
 * process. Will swap out old workers for new upon
 * completion.
 *
 * @api public
 */

Master.prototype.restartWorkers = function () {
  var self = this
    , oldWorkers = this.workers
    , newWorkers = []

  this.spawnWorkers(newWorkers, function (err) {
    if (err) return;
    self.workers = newWorkers;
    oldWorkers.forEach(function (worker) {
      worker.close();
    });
  });
};

/**
 * # getNextWorker
 *
 * Returns the necissary information to proxy a request
 * to the next worker in line. Also, will ensure to delay
 * response if the server is currently starting.
 *
 * @param {Function} callback
 * @return {Number} port
 * @api public
 */

Master.prototype.getNextWorker = function (cb) {
  var self = this
    , last = this.lastWorker
    , len = this.workers.length
    , index = (last == (len - 1)) ? 0 : last + 1;

  if (this.workers[index] && this.workers[index].port) {
    this.lastWorker = index;
    cb(null, this.workers[index].port);
  } else {
    // this prevents race conditions if it takes
    // a few seconds for first worker to start up
    setTimeout(function () {
      self.getNextWorker(function (err, port) {
        if (err) return cb(err);
        self.lastWorker = index;
        cb(null, port);
      });
    }, 100);
  }
};
