var util = require('util')
  , http = require('http')
  , Drip = require('drip');

module.exports = Request;

function Request (req, res, opts) {
  Drip.call(this);
  this.req = req;
  this.res = res;
}

util.inherits(Request, Drip);

Request.prototype.proxy = function (opts) {
  this.proxyHTTP(opts);
};

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
    if (head['x-forward-for']) xff = head['x-forward-for'] + ',' + xff;
    if (head['x-forward-port']) xfp = head['x-forward-port'] + ',' + xfp;
    if (head['x-forward-proto']) xfr = head['x-forward-proto'] + ',' + xfr;
    head['x-forward-for'] = xff;
    head['x-forward-port'] = xfp;
    head['x-forward-proto'] = xfr;
  }

  // prepare our outgoing request
  outgoing.host = opts.host;
  outgoing.port = opts.port;
  outgoing.method = req.method;
  outgoing.path = req.url;
  outgoing.headers = head;

  this.emit('start', req, res, outgoing);

  // creating our proxy request to the destination
  var proxy = http.request(outgoing, function (proxyRes) {
    if (proxyRes.headers.connection) {
      if (req.headers.connection) {
        proxyRes.headers.connection = req.headers.connection
      } else {
        proxyRes.headers.connection = 'close';
      }
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.on('data', function (chunk) {
      var flushed = res.write(chunk);
      if (!flushed) {
        proxyRes.pause();
        res.once('drain', function() {
          proxyRes.resume();
        });
      }
    });

    proxyRes.on('end', function () {
      res.end();
      self.emit('end', req, res);
    });
  });

  // proxy error callback specific to this request
  proxy.once('error', function (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    if (req.method != 'HEAD') {
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
    proxy.close();
  });

  if (buffer) return buffer.resume();
}
