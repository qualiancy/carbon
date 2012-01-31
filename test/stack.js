var should = require('chai').should()
  , request = require('superagent')
  , http = require('http');

var carbon = require('..')
  , defaults = {
        port: 8978
      , opts: {
            nolog: true
        }
    };

function url(p) {
  return 'localhost:' + defaults.port + p;
}

function after(n, fn) {
  var c = 0;
  return function () {
    c++;
    if (c==n) fn.apply(null, arguments);
  }
}

describe('Carbon#Stack', function () {

  it('should be an event emitter', function (done) {
    var h = http.createServer().listen(6789)
      , s = new carbon.Stack(h);
    s.on('test event', function (opts) {
      opts.should.eql({ hello: 'universe' });
      done();
    });
    s.emit('test event', { hello: 'universe' });
  });

  it('should throw an error if no server provided' , function () {
    var f = function () { return new carbon.Stack; };
    should.throw(f, Error);
  });

  describe('http routing', function () {
    var h = http.createServer()
      , proxy = carbon.attach(h, defaults.opts);

    var univ = http.createServer(function (req, res) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.write('Universe says Hello');
      res.end();
    });

    proxy.use(function (req, res, next) {
      switch (req.url) {
        case '/hello':
          res.writeHead(200, { 'content-type': 'text/plain' });
          res.write('Hello Universe');
          res.end();
          next();
          break;
        default:
          next();
          break;
      }
    });

    proxy.use(function (req, res, next) {
      switch (req.url) {
        case '/universe':
          next(defaults.port + 1);
          break;
        default:
          next();
          break;
      }
    });

    before(function (done) {
      var next = after(2, done);
      h.listen(defaults.port, next);
      univ.listen(defaults.port + 1, next);
    });

    after(function (done) {
      var next = after(2, done);
      h.on('close', next);
      univ.on('close', next);
      h.close();
      univ.close();
    });

    it('should store use function in the _stack', function () {
      proxy._stack.http.all.should.be.instanceof(Array);
      proxy._stack.http.all.should.have.length(3);
    });

    it('should return a 501 if an invalid request is made', function (done) {
      request
        .get(url('/badpath'))
        .end(function (res) {
          res.should.have.status(501);
          done();
        });
    });

    it('should allow for direct res writing', function (done) {
      request
        .get(url('/hello'))
        .end(function (res) {
          res.should.have.status(200);
          res.should.have.header('content-type', 'text/plain');
          res.text.should.equal('Hello Universe');
          done();
        });
    });

    it('should port forward it next(port) is called', function (done) {
      request
        .get(url('/universe'))
        .end(function (res) {
          res.should.have.status(200);
          res.should.have.header('content-type', 'text/plain');
          res.text.should.equal('Universe says Hello');
          done();
        });
    });
  });
});
