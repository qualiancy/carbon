/*!
 * Carbon - balancer middleware (worker)
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var Drip = require('drip')
  , util = require('util')
  , _ = require('../../utils')
  , fork = require('child_process').fork
  , env = process.env.NODE_ENV
  , debug = require('debug')('carbon-balancer:worker');

/*!
 * Main exports
 */

module.exports = Worker;

/**
 * Worker (constructor)
 *
 * Creates a worker process wrapper that will
 * act as intermediary with master.
 *
 * @param {String} server script to require on spawn
 */

function Worker (server) {
  this.server = server;
  this.port = null;
  this.pid = null;
  this.closed = false;
  this.retryCount = 0;
  this.retryDelay = 100;
  this.maxRetries = 10;
};

/*!
 * Inherits from Drip
 */

util.inherits(Worker, Drip);

/**
 * # .spawnWorker([callback]);
 *
 * Finds an open port and starts the spawn. Upon
 * starting will handle events.
 *
 * @param {Function} callback
 * @api public
 */

Worker.prototype.spawnWorker = function (cb) {
  var self = this
    , env = {};
  cb = cb || function () {};
  _.findPort(function (err, port) {
    if (err) return cb(err);
    for (var e in process.env) env[e] = process.env[e];
    self.spawn = fork(
        __dirname + '/spawn.js'
      , [ self.server, port ]
      , { env: env }
    );
    self.spawn.on('message', messageHandler.bind(self));
    self.spawn.on('exit', exitHandler.bind(self));
    self.port = port;
    self.pid = self.spawn.pid;

    debug('Spawned worker with pid [%d] on port [%d] for %s', self.pid, port, self.server);
    cb(null);
  });
};

/**
 * # .send(command, [data])
 *
 * Send command to the spawn.
 *
 * @param {String} command
 * @param {Object} data to be JSON.stringify
 */

Worker.prototype.send = function (command, data) {
  if (!this.spawn) return;
  var message = {
    command: command
  };
  if (data) command.data = data;
  debug('worker sending message', message);
  this.spawn.send(JSON.stringify(message));
};

/**
 * # close
 *
 * Force the worker to shutdown.
 *
 * @api public
 */

Worker.prototype.close = function () {
  this.closed = true;
  this.send('shutdown');
};

/*!
 * # .messageHandler
 *
 * Handler mounted upon spawn to parse incoming messages.
 *
 * @param {String} message from spawn
 * @api private
 */

function messageHandler (msg) {
  var message = JSON.parse(msg);
  debug('message received', message);
  switch (message.command) {
    case 'active':
      this.retryCount = 0;
      this.emit('register');
      break;
    case 'ping':
      this.send('pong');
      break;
    case 'error':
      this.send('shutdown');
      this.emit('death');
      break;
    default:
      break;
  }
};


/*!
 * # .exitHandler
 *
 * Handler mounted upon spawn to triger on spawn exit.
 *
 * @param {Number} exit code
 * @api private
 */

function exitHandler (code) {
  var self = this;
  debug('worker with pid %d exitted with code %d', this.pid, code);
  if (!this.closed && (this.retryCount < this.maxRetries)) {
    debug('worker restart attempt');
    this.retryCount++;
    setTimeout(function () {
      self.spawnWorker();
    }, this.retryDelay);
  } else if (!this.closed && (this.retryCount >= this.maxRetries)) {
    debug('worker restart cycle failed');
    throw new Error('Unable to start worker at script ' + this.script);
    process.exit(1);
  }
};
