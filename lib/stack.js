var util = require('util')
  , Drip = require('drip')
  , tea = require('tea');

var logger = new tea.Logger({
    namespace: 'carbon'
  , levels: 'syslog'
  , transports: [ 'console' ]
});

var debug = logger.debug;

module.exports = Stack;

function Stack (server) {
  Drip.call(this);
  var self = this;
  this.server = server;

  this._stack = {
      http: {
          all: [ this.defaultHttp ]
        , err: [ this.defaultHttpError ] }
    , ws: {
          all: [ this.defaultWs ]
        , err: [ this.defaultWsError ] }
  };

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

