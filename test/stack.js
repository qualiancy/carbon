var should = require('chai').should()
  , http = require('http');

var carbon = require('..');

describe('Carbon#Stack', function () {

  it('should have a valid version', function () {
    carbon.version.should.match(/^\d+\.\d+\.\d$/);
  });

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
});
