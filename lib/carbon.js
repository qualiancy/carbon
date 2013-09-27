/*!
 * Carbon
 * Copyright (c) 2012-2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Internal constructors
 */

var Supervisor = require('./carbon/supervisor');

/*!
 * Primary exports
 */

var exports = module.exports = createSupervisor;

/*!
 * Version
 */

exports.version = '1.0.0-pre';

/**
 * #### .createApp([name])
 *
 * Create a proxy / load balancing application.
 * This is also the primary export.
 *
 * @param {String} name
 * @return {Supervisor} application
 * @api public
 */

exports.createSupervisor = createSupervisor;

/*!
 * Factory
 */

function createSupervisor(name) {
  return new Supervisor(name);
}

/**
 * #### .createServer(protocol, options)
 *
 * Create a proxy server for a supported
 * protocol. Each server type may require different
 * options.Can be used without an `Supervisor`.
 *
 * @param {String} protocol
 * @param {Object} options
 * @return {Server} proxy server
 * @api public
 */

exports.createServer = function(type, opts, cb) {
  return exports.server.create(type, opts, cb);
};

/**
 * #### .servers
 *
 * A collection of the available proxy servers.
 * Servers are loaded internally from this collection
 * so adding a server here will make it available
 * within applications.
 *
 * @api public
 */

exports.server = require('./carbon/server');
