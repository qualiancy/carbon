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
    , proxy = carbon.attach(h)
    , io = sio.listen(wh);

  proxy.ws.use(function (req, sock, next) {
    console.log('proxy ws req');
    next(6542);
  });

  io.on('connection', function (socket) {
    console.log('connect');
    socket.on('test event', function (data) {
      console.log('event');
      socket.emit('test reply', { hello: 'universe' });
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
    //var ioclient = new ws('ws://localhost:6543/socket.io/websocket/');
    //ioclient.on('open', function () {
      //console.log('client connect');
      //ioclient.emit('test event');
    //});

    //ioclient.on('message', function (data) {
      //console.log('client reply');
      //data.should.eql({ hello: 'universe' });
      //ioclient.disconect();
      //done();
    //});
  //});
});
