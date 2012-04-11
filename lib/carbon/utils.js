/*!
 * Carbon - utilities
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var net = require('net')
  , debug = require('debug')('carbon:util');

/**
 * Provides a buffer pausing mechanism. Similar to connect.
 */

exports.buffer = function (obj) {
  var events = []
    , onData
    , onEnd;

  obj.on('data', onData = function (data, encoding) {
    events.push([ 'data', data, encoding ]);
  });

  obj.on('end', onEnd = function (data, encoding) {
    events.push([ 'end', data, encoding ]);
  });

  return {
      end: function () {
        obj.removeListener('data', onData);
        obj.removeListener('end', onEnd);
      }
    , resume: function () {
        this.end()
        for (var i = 0, len = events.length; i < len; i++) {
          obj.emit.apply(obj, events[i]);
        }
      }
    , destroy: function () {
        this.end();
        this.resume = function () {}
        onData = onEnd = events = obj = null;
      }
  }
};

/**
 * # findPort
 *
 * Will attempt to connect to a given port. If success,
 * will disconnect and pass that number to a callback.
 *
 * @param {Object} range min/max
 * @param {Function} callback
 */

exports.findPort = function (range, cb) {
  if ('function' == typeof range) {
    cb = range;
    range = {};
  }

  var min = range.min || 1227
    , max = range.max || 12227
    , last = min;

  function checkPort (num) {
    var server = new net.Server();
    debug('checking port %d', num);

    // if error, we don't want this server
    server.on('error', function (err) {
      if (last == max) {
        return cb(new Error('No ports available in range.'));
      }
      checkPort(++last);
    });

    // if listening, we want to disconnect and pass back port
    server.listen(num, function () {
      server.on('close', function () {
        debug('port found: %d', last);
        cb(null, last);
      });
      server.close();
    });
  }

  // this prevents race conditions for now.
  process.nextTick(function () {
    checkPort(last);
  });
}

/**
 * # isPathAbsolute
 *
 * Cross platform method to determin if a path
 * is absolute or relative.
 *
 * @param {String} path
 */

exports.isPathAbsolute = function (_path) {
  var abs = false;
  if ('/' == _path[0]) abs = true;
  if (':' == _path[1] && '\\' == _path[2]) abs = true;
  return abs;
};
