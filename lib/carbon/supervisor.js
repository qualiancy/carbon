
/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:app');
var EventEmitter = require('drip').EnhancedEmitter;
var facet = require('facet');
var inherits = require('util').inherits;

/*!
 * Internal dependencies
 */

var Balancers = require('./balancers');
var Servers = require('./servers');

/*!
 * Primary exports
 */

module.exports = Supervisor;

/**
 * ### Supervisor
 *
 * @param {Object} options
 * @return {Supervisor}
 * @api public
 */

function Supervisor() {
  if (!(this instanceof Supervisor)) return new Supervisor();
  EventEmitter.call(this, { delimeter: ':' });
  this.set('strategies', [ 'random', 'round robin' ]);
  this.balancers = new Balancers(this);
  this.servers = new Servers(this);
}

/*!
 * Inherits from EventEmitter
 */

inherits(Supervisor, EventEmitter);

/*!
 * Settings mixin
 */

facet(Supervisor.prototype);

Supervisor.prototype.createBalancer = function(type, name, opts, cb) {
  return this.balancers.findOrCreate(type, name, opts, cb);
};
