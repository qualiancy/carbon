var utils = module.exports = {};

utils.buffer = function (obj) {
  var events = []
    , onData
    , onEnd;

  obj.on('data', onData = function (data, encoding) {
    events.push([ 'data', data, encoding ]);
  });

  obj.on('end', onEnd = function (data, enconding) {
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
    , destroy: function ()
        this.end();
        this.resume = function () {}
        onData = onEnd = events = obj = null;
      }
  }
}