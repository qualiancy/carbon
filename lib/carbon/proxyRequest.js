/*!
 * Carbon - proxyRequest
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('sherlock')('carbon:proxyRequest')
  , EventEmitter = require('drip').EventEmitter
  , http = require('http')
  , https = require('https')
  , env = process.env.NODE_ENV || 'development'
  , util = require('util');

/*!
 * Main exports
 */

module.exports = Request;

/**
 * # Request (constructor)
 *
 * The primary purpose of the proxy request constructor
 * is to provide an event emitter framework seperate from the
 * primary proxy that is unique for each request, response proxy
 * pair.
 *
 * @param {http.Request} node request object
 * @param {http.Response} node response object
 */

function Request (req, res) {
  EventEmitter.call(this);
  this.req = req;
  this.res = res;
}

/**
 * Inherits from Drip event emitter
 */

util.inherits(Request, EventEmitter);

/**
 * # proxyHTTP(options)
 *
 * Proxy http requests
 *
 * Options:
 * - `buffer`
 * - `host`
 * - `port`
 *
 * **Attribution**
 * - This is slight refactor of `nodejitsu/node-http-proxy`. Primary
 *   difference is the timing of events emitted during proxy request.
 * - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/node-http-proxy/http-proxy.js
 * - Licensed MIT
 *
 * @param {Object} options
 * @api public
 */

Request.prototype.proxyHTTP = function (opts) {
  var self = this
    , req = this.req
    , res = this.res
    , outgoing = {}
    , head = req.headers
    , buffer = opts.buffer;

  // Add in forward proxy headers
  if (req.connection && req.socket) {
    var xff = req.connection.remoteAddress || req.socket.remoteAddress
      , xfp = req.connection.remotePort || req.socket.remotePort
      , xfr = req.connection.pair ? 'https' : 'http';
    if (head['x-forwarded-for']) xff = head['x-forwarded-for'] + ',' + xff;
    if (head['x-forwarded-port']) xfp = head['x-forwarded-port'] + ',' + xfp;
    if (head['x-forwarded-proto']) xfr = head['x-forwarded-proto'] + ',' + xfr;
    head['x-forwarded-for'] = xff;
    head['x-forwarded-port'] = xfp;
    head['x-forwarded-proto'] = xfr;
  }

  // prepare our outgoing request
  outgoing.host = opts.host;
  outgoing.port = opts.port;
  outgoing.method = req.method;
  outgoing.path = req.url;
  outgoing.headers = head;
  outgoing.agent = opts.secure
    ? new https.Agent({ host: opts.host, port: opts.port })
    : new http.Agent({ host: opts.host, port: opts.port });

  debug('proxy http start', outgoing.host, outgoing.port, outgoing.path);
  this.emit('start', req, res, outgoing);

  var reqstr = opts.secure ? https : http;

  // creating our proxy request to the destination
  var proxy = reqstr.request(outgoing, function (proxyRes) {
    if (proxyRes.headers.connection) {
      if (req.headers.connection) {
        proxyRes.headers.connection = req.headers.connection
      } else {
        proxyRes.headers.connection = 'close';
      }
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.on('data', function (chunk) {
      if (req.method !== 'HEAD' && res.writable) {
        var flushed = res.write(chunk);
        if (!flushed) {
          proxyRes.pause();
          res.once('drain', function() {
            proxyRes.resume();
          });
        }
      }
    });

    proxyRes.on('end', function () {
      debug('proxy response end', outgoing.host, outgoing.port, outgoing.path);
      res.end();
      self.emit('end', req, res);
    });
  });

  // proxy error callback specific to this request
  proxy.once('error', function (err) {
    debug('proxy error', err.message);
    res.writeHead(500, { 'content-type': 'text/plain' });
    if (req.method !== 'HEAD') {
      res.write('500 error');
      res.end();
    }
  });

  // stream incoming data from the original request
  req.on('data', function (chunk) {
    var flushed = proxy.write(chunk);
    if (!flushed) {
      req.pause();
      proxy.once('drain', function () {
        req.resume();
      });
    }
  });

  req.on('end', function () {
    proxy.end();
  });

  req.on('close', function () {
    proxy.abort();
  });

  if (buffer) return buffer.resume();
};

/**
 * # proxyWs(options)
 *
 * Proxy websocket requests
 *
 * Options:
 * - `buffer`
 * - `host`
 * - `port`
 *
 * **Attribution**
 * - This is slight refactor of `nodejitsu/node-http-proxy`. Primary
 *   difference is the timing of events emitted during proxy request.
 * - https://github.com/nodejitsu/node-http-proxy/blob/master/lib/node-http-proxy/http-proxy.js
 * - Licensed MIT
 *
 * @param {Object} options
 * @api public
 */

Request.prototype.proxyWS = function (opts) {
  var self = this
    , req = this.req
    , socket = this.res
    , head = req.headers
    , outgoing = {};

  if (req.method != 'GET' || req.headers.upgrade.toLowerCase() != 'websocket') {
    return socket.destroy();
  }

  // Add in forward proxy headers
  if (req.connection && req.socket) {
    var xff = req.connection.remoteAddress || req.socket.remoteAddress
      , xfp = req.connection.remotePort || req.socket.remotePort
      , xfr = req.connection.pair ? 'wss' : 'ws';
    if (head['x-forwarded-for']) xff = head['x-forwarded-for'] + ',' + xff;
    if (head['x-forwarded-port']) xfp = head['x-forwarded-port'] + ',' + xfp;
    if (head['x-forwarded-proto']) xfr = head['x-forwarded-proto'] + ',' + xfr;
    head['x-forwarded-for'] = xff;
    head['x-forwarded-port'] = xfp;
    head['x-forwarded-proto'] = xfr;
  }

  // prepare our outgoing request
  outgoing.host = opts.host;
  outgoing.port = opts.port;
  outgoing.method = req.method;
  outgoing.path = req.url;
  outgoing.headers = head;

  debug('proxy ws start', outgoing.host, outgoing.port, outgoing.path);
  this.emit('start', req, socket, outgoing);

  var reqstr = opts.secure ? https : http
    , proxy = http.request(outgoing);

  proxy.on('upgrade', function (proxyRequest, proxySocket, proxyHeader) {
    debug('proxy requrest upgrade');

    socket.on('data', function (data) {
      var flushed = proxySocket.write(data);
      if (!flushed) {
        socket.pause();
        proxySocket.once('drain', function () {
          socket.resume();
        });
      }
    });

    proxySocket.on('data', function (data) {
      var flushed = socket.write(data);
      if (!flushed) {
        proxySocket.pause();
        socket.once('drain', function () {
          proxySocket.resume();
        });
      }
    });

    socket.on('close', function () {
      proxySocket.end();
    });

    proxySocket.on('close', function () {
      socket.end();
    });

  });

  proxy.once('socket', function (sock) {
    debug('proxy socket');
    sock.on('data', function handshake (data) {
      debug('proxy ws handshake');
      // socket.io compat
      var sdata = data.toString();
      sdata = sdata.substr(0, sdata.search('\r\n\r\n'));
      data = data.slice(Buffer.byteLength(sdata), data.length);
      socket.write(sdata);
      var flushed = socket.write(data);
      if (!flushed) {
        sock.pause();
        socket.once('drain', function () {
          sock.resume();
        });
      }
      sock.removeListener('data', handshake);
    });
  });

  proxy.on('error', function (err) {
    proxy.end();
    socket.end();
  });

  proxy.write(opts.head);
  if (opts.head && opts.head.length == 0) {
    proxy._send('');
  }
};
