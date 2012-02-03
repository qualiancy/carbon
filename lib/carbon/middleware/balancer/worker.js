/*!
 * Carbon - balancer middleware (worker)
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
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

exports = module.exports = Worker;

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
};

/*!
 * Inherits from Drip
 */

util.inherits(Worker, Drip);

/**
 * # .spawn([callback]);
 *
 * Finds an open port and starts the spawn. Upon
 * starting will handle events.
 *
 * @param {Function} callback
 */

Worker.prototype.spawn = function (cb) {
  var self = this;
  _.findPort(function (err, port) {
    if (err) return cb(err);
    self.spawn = fork(__dirname + '/spawn.js', [ self.server, port ],  {});
    self.spawn.on('message', self.messageHandler.bind(self));
    self.spawn.on('exit', self.exitHandler.bind(self));
    self.port = port;
    self.pid = self.spawn.pid;
    debug('Spawned worker with pid [%d] on port [%d]', self.pid, port);
    cb();
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
 * # .messageHandler
 *
 * Handler mounted upon spawn to parse incoming messages.
 *
 * @param {String} message from spawn
 */

Worker.prototype.messageHandler = function (msg) {
  var message = JSON.parse(msg);
  debug('message received', message);
  switch (message.command) {
    case 'active':
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

/**
 * # .existHandler
 *
 * Handler mounted upon spawn to triger on spawn exit.
 */

Worker.prototype.exitHandler = function () {
  debug('worker with pid %d exitted', this.pid);
};
