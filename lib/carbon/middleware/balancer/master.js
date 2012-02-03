/*!
 * Carbon - balancer middleware (master)
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var Drip = require('drip')
  , util = require('util')
  , os = require('os')
  , env = process.env.NODE_ENV
  , debug = require('debug')('carbon-balancer:master')
  , Worker = require('./worker');

/*!
 * Main exports
 */

exports = module.exports = Master;

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
  Drip.call(this, { delimeter: ' ' });
  options = options || {};
  this.server = server;
  this.workers = [];
  this.maxWorkers = options.maxWorkers || os.cpus().length
  this.host = options.host || 'localhost';
  this.port = options.port;
  this.lastWorker = 0;
}

/**
 * Master is an event emitter
 */

util.inherits(Master, Drip);

/**
 * spawnWorker
 *
 * Spawns a new worker for the provided server
 *
 */

Master.prototype.spawnWorker = function (cb) {
  var self = this
    , worker = new Worker(this.server);

  worker.spawn(function (err)  {
    if (err) return cb(err);
  });

  worker.on('register', function () {
    debug('worker %d registered', worker.pid);
    cb();
  });

  self.workers.push(worker);
};

/**
 * spawnWorkers
 *
 * Ensures that the number of active or spawning
 * workers matches maxWorkers.
 *
 * @param {Function} callback
 */

Master.prototype.spawnWorkers = function (cb) {
  var self = this
    , max = this.maxWorkers;

  function start () {
    if (max - self.workers.length == 0) return;
    self.spawnWorker(start);
  };

  start();
};

/**
 * getNextWorker
 *
 * returns the necissary information to proxy a request
 * to the next worker in line
 *
 * @returns {Number} port
 */

Master.prototype.getNextWorker = function () {
  var last = this.lastWorker
    , len = this.workers.length
    , index = (last == (len - 1)) ? 0 : last + 1;
  this.lastWorker = index;
  return this.workers[index].port;
};
