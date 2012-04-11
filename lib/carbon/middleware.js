/*!
 * Carbon - default middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/**
 * # init
 *
 * Initialize "middleware" ran before each stack.
 * Used to map interconnectedness between req, res,
 * and constructed proxy. Allows middleware access to
 * the proxy.
 *
 * @param {Function} proxy (constructed)
 * @return {Function} middlware stack
 * @attr https://github.com/visionmedia/express/blob/master/lib/middleware.js
 */

exports.init = function proxyInit (proxy) {
  return function (req, res, next) {
    req.proxy = res.proxy = proxy;
    req.res = res;
    res.req = res;
    next();
  };
};

/**
 * # defaultHttp
 *
 * Default HTTP(s) responder.
 *
 * @param {Request} req
 * @param {Response} res
 */

exports.defaultHttp = function defaultHttp (req, res) {
  req.emit('proxy miss');
  res.writeHead(501);
  res.end();
};

/**
 * # defaultHttpError
 *
 * Default HTTP(s) error responder.
 *
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 */

exports.defaultHttpError = function defaultHttpError (err, req, res) {
  req.emit('proxy error');
  res.writeHead(500);
  res.end();
};

/**
 * # defaultWs
 *
 * Default WS(s) responder.
 *
 * @param {Request} req
 * @param {Socket} socket
 */

exports.defaultWs = function defaultWs (req, socket) {
  req.emit('proxy ws miss');
  socket.end();
};

/**
 * # defaultWsError
 *
 * Default WS(s) error responder.
 *
 * @param {Error} err
 * @param {Request} req
 * @param {Socket} socket
 */

exports.defaultWsError = function defaultWsError (err, req, socket) {
  req.emit('proxy ws error');
  socket.end();
};
