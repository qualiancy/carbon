var should = require('chai').should();

var http = require('http')
  , request = require('superagent');

var carbon = require('..')

describe('Carbon#ProxyRequest', function () {

  it('should be an event listener', function (done) {
    var p = new carbon.ProxyRequest();
    p.on('test event', function (opts) {
      opts.should.eql({ hello: 'universe' });
      done();
    });
    p.emit('test event', { hello: 'universe' });
  });

  describe('basic http routing', function () {
    var p;

    var h1Req = function (req, res) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.write('Hello Universe');
      res.end();
    }

    var h2Req = function (req, res) {
      p = new carbon.ProxyRequest(req, res);
      p.proxy({ host: 'localhost', 'port': 6786 });
    }

    var h1 = http.createServer(h1Req)
      , h2 = http.createServer(h2Req);

    before(function (done) {
      h1.listen(6786, function () {
        h2.listen(6785, done);
      });
    });

    after(function (done) {
      var c = 1;
      function a () { --c || done() }
      h1.on('close', a);
      h2.on('close', a);
      h1.close();
      h2.close();
    });

    it('should allow for basic routing', function (done) {
      request
        .get('localhost:6785/')
        .end(function (res) {
          res.should.have.status(200);
          res.should.have.header('content-type', 'text/plain');
          res.text.should.equal('Hello Universe');
          done();
        });
    });

  });

});