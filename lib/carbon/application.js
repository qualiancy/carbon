
var debug = require('sherlock')('carbon:app');
var EventEmitter = require('drip').EnhancedEmitter;
var facet = require('facet');
var inherits = require('util').inherits;

/*!
 * Internal dependencies
 */

var Balancers = require('./collections/balancers');
var Servers = require('./collections/servers');

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

Application.prototype.configure = function() {
  var args = [].slice.call(arguments);
  var env = this.get('env');
  var fn = args.pop();

  if (!args.length || ~args.indexOf(env)) {
    fn.call(this);
  }

  return this;
};

Application.prototype.use = function(host, fn) {

};
