describe('server base', function() {
  var manager = __carbon.serverManager;

  describe('_init()', function() {
    it('is invoked on construction', function(done) {
      var init = chai.spy('init', noop);
      var uid = _uid('server');
      manager.define(uid, { proto: { _init: init }});
      manager.create(uid, { port: 5000 }, function(err, server) {
        should.not.exist(err);
        init.should.have.been.called(1);
        done();
      });
    });
  });

  describe('.listen(address, port, cb)', function() {
    var listen, uid, server;

    before(function(done) {
      listen = chai.spy('listen', anoop);
      uid = _uid('server');
      manager.define(uid, { proto: { _init: noop, _listen: listen, _close: anoop }});
      manager.create(uid, { port: 5000 }, function(err, _server) {
        if (err) throw err;
        server = _server;
        done();
      });
    });

    afterEach(function(done) {
      server.close(done);
    });

    it('invokes #_listen', function(done) {
      server.listen(function(err) {
        should.not.exist(err);
        listen.should.have.been.called(1);
        listen.should.have.been.always.called.with({ port: 5000, address: '0.0.0.0' });
        done();
      });
    });

    it('emits events', function(done) {
      var starting = chai.spy('starting');
      var listening = chai.spy('listening');
      server.on('starting', starting);
      server.on('listening', listening);
      server.listen(function(err) {
        should.not.exist(err);
        starting.should.have.been.called.once;
        listening.should.have.been.called.once;
        done();
      });
    });
  });

  describe('.close(cb)', function() {
    var close, uid, server;

    before(function(done) {
      close = chai.spy('close', anoop);
      uid = _uid('server');
      manager.define(uid, { proto: { _init: noop, _listen: anoop, _close: close }});
      manager.create(uid, { port: 5000 }, function(err, _server) {
        if (err) throw err;
        server = _server;
        done();
      });
    });

    beforeEach(function(done) {
      server.listen(done);
    });

    it('invokes #_close', function(done) {
      server.close(function(err) {
        close.should.have.been.called(1);
        done();
      });
    });

    it('emits events', function(done) {
      var closing = chai.spy('closing');
      var closed = chai.spy('closed');
      server.on('closing', closing);
      server.on('close', closed);
      server.close(function(err) {
        should.not.exist(err);
        closing.should.have.been.called.once;
        closed.should.have.been.called.once;
        done();
      });
    });
  });

  describe('.restart(cb)', function() {
    var close, listen, uid, server;

    before(function(done) {
      close = chai.spy('close', anoop);
      listen = chai.spy('listen', anoop);
      uid = _uid('server');
      manager.define(uid, { proto: { _init: noop, _listen: listen, _close: close }});
      manager.create(uid, { port: 5000 }, function(err, _server) {
        if (err) throw err;
        server = _server;
        done();
      });
    });

    beforeEach(function(done) {
      server.listen(done);
    });

    afterEach(function(done) {
      server.close(done);
    });

    it('invokes #_listen and #_close', function(done) {
      server.restart(function(err) {
        should.not.exist(err);
        close.should.have.been.called(1);
        listen.should.have.been.called(2);
        listen.should.have.been.always.called.with({ port: 5000, address: '0.0.0.0' });
        done();
      });
    });

    it('emits events', function(done) {
      var listening = chai.spy('listening');
      var restarting = chai.spy('restarting');
      var restarted = chai.spy('restarted');
      server.on('listening', listening);
      server.on('restarting', restarting);
      server.on('restart', restarted);
      server.restart(function(err) {
        should.not.exist(err);
        restarting.should.have.been.called.once;
        restarted.should.have.been.called.once;
        setImmediate(function() {
          listening.should.have.been.called.once;
          done();
        });
      });
    });
  });
});
