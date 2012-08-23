var should = require('chai').should()
  , http = require('http')
  , join = require('path').join
  , request = require('superagent')
  , carbon = require('..');

function after(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
}

describe('Middleware#proxyTable', function () {

  describe('simple table', function () {
    var serv = http.createServer()
      , proxy = carbon.listen(serv);

    var app = http.createServer(function (req, res) {
      res.writeHeader(200, { 'content-type' : 'text/plain' });
      res.end('app 4568');
    });

    proxy.use(carbon.proxyTable([
      { hostname: 'localhost:4567'
      , port: 4568 }
    ]));

    before(function (done) {
      var next = after(2, done);
      serv.listen(4567, next);
      app.listen(4568, next);
    });

    after(function (done) {
      var next = after(2, done);
      serv.once('close', next);
      app.once('close', next);
      serv.close();
      app.close();
    });

    it('should make the appropriate request', function (done) {
      request
        .get('localhost:4567')
        .end(function (res) {
          res.text.should.equal('app 4568');
          done();
        });
    });

    it('should make the appropriate request a second time', function (done) {
        request
        .get('localhost:4567')
        .end(function (res) {
          res.text.should.equal('app 4568');
          done();
        });
    });
  });

  describe('balanced table', function () {
    var serv = http.createServer()
      , proxy = carbon.listen(serv);

    var app = http.createServer(function (req, res) {
      res.writeHeader(200, { 'content-type' : 'text/plain' });
      res.end('app 4456');
    });

    var app2 = http.createServer(function (req, res) {
      res.writeHeader(200, { 'content-type' : 'text/plain' });
      res.end('app 4457');
    });

    proxy.use(carbon.proxyTable([
      { hostname: 'localhost:4454'
      , dest: [ 4456, 'localhost:4457' ] }
    ]));

    before(function (done) {
      var next = after(3, done);
      serv.listen(4454, next);
      app.listen(4456, next);
      app2.listen(4457, next);
    });

    after(function (done) {
      var next = after(3, done);
      serv.once('close', next);
      app.once('close', next);
      app2.once('close', next);
      serv.close();
      app.close();
      app2.close();
    });

    it('should make the appropriate request', function (done) {
      request
        .get('localhost:4454')
        .end(function (res) {
          var last = res.text;
          request
            .get('localhost:4454')
            .end(function (res) {
              res.text.should.not.equal(last);
              done();
            });
        });
    });

    it('should make the appropriate request a second time', function (done) {
      request
        .get('localhost:4454')
        .end(function (res) {
          var last = res.text;
          request
            .get('localhost:4454')
            .end(function (res) {
              res.text.should.not.equal(last);
              done();
            });
        });
    });

  });
});
