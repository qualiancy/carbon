var chai = require('chai')
  , chaihttp = require('chai-http')
  , should = chai.should();

chai.use(chaihttp);

var http = require('http')
  , https = require('https')
  , fs = require('fs')
  , join = require('path').join
  , ws = require('ws')
  , request = require('superagent');

var carbon = require('..')

function after(n, fn) {
  return function () {
    --n || fn.apply(null, arguments);
  }
}

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
      if (req.method == 'GET') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write('Hello Universe');
        res.end();
      } else if (req.method == 'POST') {
        // parse
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          if ('{' != buf[0] && '[' != buf[0]) return next(utils.error(400));
          try {
            req.body = JSON.parse(buf);
            res.writeHead(200, { 'content-type': 'application/json' });
            res.write(JSON.stringify(req.body));
            res.end();
          } catch (err){
            err.status = 400;
            res.statusCode = 400;
            res.end();
          }
        });
      }
    }

    var h2Req = function (req, res) {
      p = new carbon.ProxyRequest(req, res);
      p.proxyHTTP({ host: 'localhost', 'port': 6786 });
    }

    var h1 = http.createServer(h1Req)
      , h2 = http.createServer(h2Req);

    before(function (done) {
      var next = after(2, done);
      h1.listen(6786, next);
      h2.listen(6785, next);
    });

    after(function (done) {
      var a = after(2, done);
      h1.on('close', a);
      h2.on('close', a);
      h1.close();
      h2.close();
    });

    it('should allow for basic routing GET', function (done) {
      request
        .get('localhost:6785/')
        .end(function (res) {
          res.should.have.status(200);
          res.should.have.header('content-type', 'text/plain');
          res.text.should.equal('Hello Universe');
          done();
        });
    });

    it('should allwo for basic routing POST', function (done) {
      request
        .post('localhost:6785/')
        .send({ hello: 'universe' })
        .end(function (res) {
          res.should.have.status(200);
          res.body.should.have.property('hello', 'universe');
          done();
        });
    });
  });

  describe('https routing', function () {
    var p;

    var h1Req = function (req, res) {
      if (req.method == 'GET') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write('Hello Universe');
        res.end();
      } else if (req.method == 'POST') {
        // parse
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          if ('{' != buf[0] && '[' != buf[0]) return next(utils.error(400));
          try {
            req.body = JSON.parse(buf);
            res.writeHead(200, { 'content-type': 'application/json' });
            res.write(JSON.stringify(req.body));
            res.end();
          } catch (err){
            err.status = 400;
            res.statusCode = 400;
            res.end();
          }
        });
      }
    }

    var h2Req = function (req, res) {
      p = new carbon.ProxyRequest(req, res);
      p.proxyHTTP({ host: 'localhost', 'port': 6790, secure: true });
    };

    var opts = {
        key: fs.readFileSync(join(__dirname, 'fixtures/keys/agent-key.pem'), 'utf8')
      , cert: fs.readFileSync(join(__dirname, 'fixtures/keys/agent-cert.pem'), 'utf8')
    };

    var h1 = https.createServer(opts, h1Req)
      , h2 = https.createServer(opts, h2Req);

    before(function (done) {
      var next = after(2, done);
      h1.listen(6790, next);
      h2.listen(6791, next);
    });

    after(function (done) {
      var a = after(2, done);
      h1.on('close', a);
      h2.on('close', a);
      h1.close();
      h2.close();
    });

    it('should allow for basic routing GET', function (done) {
      request
        .get('https://localhost:6791/')
        .end(function (res) {
          res.should.have.status(200);
          res.should.have.header('content-type', 'text/plain');
          res.text.should.equal('Hello Universe');
          done();
        });
    });

    it('should allwo for basic routing POST', function (done) {
      request
        .post('https://localhost:6791/')
        .send({ hello: 'universe' })
        .end(function (res) {
          res.should.have.status(200);
          res.body.should.have.property('hello', 'universe');
          done();
        });
    });
  });

  describe('websocket routing', function () {
    var p
      , serv = http.createServer();

    var wsServ = new ws.Server({ server: serv });
    var proxServ = http.createServer();

    proxServ.on('upgrade', function (req, sock, head) {
      p = new carbon.ProxyRequest(req, sock);
      p.proxyWS({ host: 'localhost', port: 6787 , head: head });
    });

    before(function (done) {
      var next = after(2, done);
      serv.listen(6787, next);
      proxServ.listen(6788, next);
    });

    after(function (done) {
      var next = after(2, done);
      serv.on('close', next);
      proxServ.on('close', next);
      serv.close();
      proxServ.close();
    });

    it('should allow for websocket request to proxy', function (done) {
      wsServ.on('connection', function (ws) {
        ws.on('message', function (txt) {
          txt.should.equal('ping');
          ws.send('pong');
        });
      });

      var wsclient = new ws('ws://localhost:6788');
      wsclient.on('open', function () {
        wsclient.send('ping');
      });
      wsclient.on('message', function (txt) {
        txt.should.equal('pong');
        wsclient.close();
        done();
      });
    });
  });


});
