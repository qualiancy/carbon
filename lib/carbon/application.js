
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
 * Constants
 */

var ENV = process.env.NODE_ENV || 'development';

/*!
 * Primary exports
 */

module.exports = Application;

function Application() {
  if (!(this instanceof Application)) return new Application();
  EventEmitter.call(this, { delimeter: ':' });
  this.set('env', ENV);
  this.set('strategies', [ 'random', 'round robin' ]);
  this.balancers = new Balancers(this);
  this.servers = new Servers(this);
}

/*!
 * Inherits from EventEmitter
 */

inherits(Application, EventEmitter);

/*!
 * Settings mixin
 */

facet(Application.prototype);

Application.prototype.createBalancer = function(type, name, opts, cb) {
  return this.balancers.findOrCreate(type, name, opts, cb);
};
