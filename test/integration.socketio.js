var should = require('chai').should()
  , http = require('http')
  , sio = require('socket.io')
  , ws = require('ws')
  , carbon = require('..');

function after(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
}

describe('Socket.io Integration', function () {
  var h = http.createServer()
    , wh = http.createServer()
    , proxy = carbon.listen(h)
    , io = sio.listen(wh);

  //io.set('log level', -1);
  io.set('transports', ['websocket']);

  proxy.ws.use(function (req, sock, next) {
    console.log('proxy ws req');
    next(6542);
  });

  io.on('connection', function (socket) {
    console.log('connect');
    socket.on('message', function (data) {
      console.log('event');
      console.log(data);
      socket.send(JSON.stringify({ hello: 'universe' }));
    });
  });

  before(function (done) {
    var next = after(2, done);
    h.listen(6543, next);
    wh.listen(6542, next);
  });

  after(function (done) {
    var next = after(2, done);
    h.once('close', next);
    wh.once('close', next);
    h.close();
    wh.close();
  });

  //it('should work', function (done) {
    //var ioclient = new ws('ws://localhost:6543/socket.io/websocket/websocket/');
    //ioclient.on('open', function () {
      //console.log('client connect');
      //ioclient.send('test event');
    //});

    //ioclient.on('message', function (data) {
      //console.log(data);
    //});
  //});
});
