var http = require('http')
  , fs = require('fs')
  , join = require('path').join
  , carbon = require('../..');

var proxy = carbon.listen(4500);

proxy.use(function (req, res, next) {
  next(4501);
});

proxy.ws.use(function (req, sock, next) {
  next(4501);
});

function serve (req, res) {
  res.writeHead(200, { 'content-type': 'text/html' });
  fs.readFile(join(__dirname, 'index.html'), 'utf8', function (err, data) {
    if (err) throw err;
    res.write(data);
    res.end();
  });
};

var app = http.createServer(serve)
  , io = require('socket.io').listen(app);

io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  var interval = setInterval(function () {
    console.log('ping');
    socket.emit('ping');
  }, 3000);

  socket.on('pong', function () {
    console.log('pong');
  });

  socket.on('disconnect', function () {
    clearTimeout(interval);
  });
});

app.listen(4501);
