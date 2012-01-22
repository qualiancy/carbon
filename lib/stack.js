var util = require('util')
  , Drip = require('drip')
  , tea = require('tea');

module.exports = Stack;

function Stack (server, opts) {
  Drip.call(this);
  this.server = server;

  if (!opts) opts = {};

  this.log = new tea.Logger({
      namespace: 'carbon'
    , levels: 'syslog'
    , transports: [ 'console' ]
  });

  this.debug = this.log.debug;

  var self = this;
  server.on('request', function (req, res) {
    self.handleRequest(req, res);
  });
};

util.inherits(Stack, Drip);

Stack.prototype.use = function (fn) {

};

Stack.prototype.handleRequest = function (req, res) {
  this.debug('handling request');
};

