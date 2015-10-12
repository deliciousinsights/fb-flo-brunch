"use strict";

/* global describe,it,before */

var chai       = require('chai');
var extend     = require('amp-extend');
var fs         = require('fs');
var os         = require('os');
var path       = require('path');
var pick       = require('amp-pick');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');
var sinonChai  = require('sinon-chai');

describe('the plugin', function() {
  var flo;
  var Plugin;

  before(function() {
    chai.should();
    chai.use(sinonChai);
  });

  beforeEach(function() {
    flo = sinon.stub().returns({ close: function() {} });
    Plugin = proxyquire('../index.js', { 'fb-flo': flo });
  });

  describe('when building its options', function() {
    it('should ignore any options outside the whitelist', function() {
      var valid = Plugin.OPTIONS.reduce(function(acc, prop) {
        acc[prop] = 'demo';
        return acc;
      }, {});
      var invalid = { foo: 'bar', answer: 42, version: 12 };
      var obj = callWithConfig(valid, invalid);

      for (var prop in valid) {
        obj.config.should.have.property(prop);
      }
      for (var prop in invalid) {
        obj.config.should.not.have.property(prop);
      }
    });

    it('should use proper defaults', function() {
      var obj = callWithConfig();
      for (var prop in Plugin.DEFAULTS) {
        obj.config.should.have.property(prop, Plugin.DEFAULTS[prop]);
      }
    });

    it('should correctly assign the watched path', function() {
      var obj = callWithConfig();
      obj.config.publicPath.should.equal(path.join(process.cwd(), 'public'));

      obj = {};
      Plugin.prototype.setOptions.call(obj, { paths: { public: 'yolo' } });
      obj.config.publicPath.should.equal('yolo');
    });

    it('should properly handle resolverReload: true', function() {
      var obj = callWithConfig({ resolverReload: true });
      obj.config.resolverReload.should.be.a('function');
      obj.config.resolverReload().should.be.true;
    });

    it('should properly handle advanced resolverReload values', function() {
      var obj = callWithConfig({ resolverReload: 'app.js' });
      obj.config.resolverReload.should.be.a('function');
      obj.config.resolverReload('app.js').should.be.true;
      obj.config.resolverReload('scripts/app.js').should.be.false;
      obj.config.resolverReload('app.css').should.be.false;

      obj = callWithConfig({ resolverReload: /app\.js$/ });
      obj.config.resolverReload.should.be.a('function');
      obj.config.resolverReload('app.js').should.be.true;
      obj.config.resolverReload('scripts/app.js').should.be.true;
      obj.config.resolverReload('app.css').should.be.false;

      obj = callWithConfig({ resolverReload: ['app.js', 'app.css'] });
      obj.config.resolverReload.should.be.a('function');
      obj.config.resolverReload('app.js').should.be.true;
      obj.config.resolverReload('scripts/app.js').should.be.false;
      obj.config.resolverReload('app.css').should.be.true;

      var spy = sinon.spy(checkForReload);
      obj = callWithConfig({ resolverReload: spy });
      obj.config.resolverReload.should.be.a('function');
      obj.config.resolverReload('app.js').should.be.true;
      spy.should.have.been.calledOnce;
      spy.should.have.been.calledWithExactly('app.js');

      function checkForReload(str) {
        return 'app.js' === str;
      }
    });

    it('should build a proper update based on message-related options', function() {
      var obj = callWithConfig();
      checkUpdate('.log("%s has just been updated with new content", _resourceURL)');

      obj = callWithConfig({ message: 'Yolo' });
      checkUpdate('.log("Yolo", _resourceURL)');

      obj = callWithConfig({ message: 'Yolo', messageColor: 'green' });
      checkUpdate('.log("%cYolo", "color: green", _resourceURL)');

      obj = callWithConfig({ message: 'Yo %s!', messageResourceColor: 'red' });
      checkUpdate('.log("Yo %c%s%c!", "color: red", _resourceURL, "color: black")');

      obj = callWithConfig({
        message: 'Yo %s!',
        messageColor: 'green',
        messageResourceColor: 'red'
      });
      checkUpdate('.log("%cYo %c%s%c!", "color: green", "color: red", _resourceURL, "color: green")');

      obj = callWithConfig({ messageLevel: 'info' });
      checkUpdate('.info("%s');

      obj = callWithConfig({
        message: 'Yo %s!',
        messageColor: 'green',
        messageLevel: 'debug',
        messageResourceColor: 'red'
      });
      checkUpdate('.debug("%cYo %c%s%c!", "color: green", "color: red", _resourceURL, "color: green")');


      function checkUpdate(str) {
        obj.update.should.be.a('function');
        obj.update.toString().should.include(str);
      }
    });
  });

  it('should not start if disabled', sinon.test(function() {
    var startServer = sinon.stub(Plugin.prototype, 'startServer');
    newWithConfig({ enabled: false });
    startServer.should.not.have.been.called;
  }));

  describe('when starting the server', function() {
    it('should forward all untouched fb-flo options', function() {
      var opts = Plugin.OPTIONS.reduce(function(acc, prop) {
        acc[prop] = 'demo';
        return acc;
      }, {});
      var obj = newWithConfig(opts);
      flo.should.have.been.calledOnce;
      flo.should.have.been.calledWithMatch(
        obj.config.publicPath,
        pick(opts, Plugin.FB_FLO_OPTIONS),
        sinon.match.func
      );
    });

    it('should not pass any non-fb-flo option', function() {
      var obj = newWithConfig({ foo: 'bar' });
      flo.should.have.been.calledOnce;
      flo.should.not.have.been.calledWithMatch(
        obj.config.publicPath,
        { foo: 'bar' },
        sinon.match.func
      );
    });
  });

  describe('when starting the server', function() {
    it('should not attempt to shutdown fb-flo if not started earlier', function() {
      var obj = newWithConfig({ enabled: false });
      chai.expect(obj._flo).to.be.undefined;
      obj.teardown();
    });

    it('should shutdown fb-flo if started earlier', function() {
      var obj = newWithConfig();
      obj._flo.should.exist;
      obj._flo.close = sinon.spy();
      obj.teardown();
      obj._flo.close.should.have.been.called;
    });
  });

  describe('when running the resolver', function() {
    var publicPath, fileName = 'foo.js', contents = 'alert("yo");';

    before(function(done) {
      publicPath = path.join(os.tmpdir(), 'public');
      fs.mkdir(publicPath, function(err) {
        if (err && err.code !== 'EEXIST') return done(err);

        var fullPath = path.join(publicPath, fileName);
        fs.writeFile(fullPath, contents, 'utf-8', done);
      });
    });

    it('should properly define resourceURL and contents', function() {
      var obj = new Plugin({ paths: { public: publicPath } });
      var spy = sinon.spy();
      obj.resolver(fileName, spy);
      spy.should.have.been.calledWithMatch({
        resourceURL: fileName,
        contents: contents
      });
    });

    it('should pass update only if defined', function() {
      var obj = new Plugin({ paths: { public: publicPath } });
      var spy = sinon.spy();
      obj.resolver(fileName, spy);
      spy.should.have.been.calledWithMatch({
        update: sinon.match.func
      });

      obj = new Plugin({
        paths: { public: publicPath },
        plugins: { fbFlo: { message: false } }
      });
      spy = sinon.spy();
      obj.resolver(fileName, spy);
      spy.should.not.have.been.calledWithMatch({
        update: sinon.match.func
      });
    });

    it('should forward match, if defined in resolverMatch', function() {
      var obj = new Plugin({
        paths: { public: publicPath },
        plugins: { fbFlo: { resolverMatch: 'equal' } }
      });
      var spy = sinon.spy();
      obj.resolver(fileName, spy);
      spy.should.have.been.calledWithMatch({
        match: 'equal'
      });
    });

    it('should properly define reload if resolverReload is there', function() {
      var obj = new Plugin({
        paths: { public: publicPath },
        plugins: { fbFlo: { resolverReload: true } }
      });
      var spy = sinon.spy();
      obj.resolver(fileName, spy);
      spy.should.have.been.calledWithMatch({
        reload: true
      });
    });

    it('should pass the proper regex if fuzzyMatch is set', function() {
      var obj = new Plugin({
        paths: { public: publicPath },
        plugins: { fbFlo: { fuzzyMatch: true } }
      });
      var spy = sinon.spy();
      var expectedRE = new RegExp('.*foo.*\\.js');
      obj.resolver(fileName, spy);
      spy.should.have.been.calledWithMatch({
        match: expectedRE
      });
    });
  });

  function callWithConfig() {
    var args = Array.prototype.slice.call(arguments, 0);
    var cfg = extend.apply(null, [{}].concat(args));
    cfg = { persistent: true, plugins: { fbFlo: cfg } };
    var obj = {};
    Plugin.prototype.setOptions.call(obj, cfg);
    return obj;
  }

  function newWithConfig() {
    var args = Array.prototype.slice.call(arguments, 0);
    var cfg = extend.apply(null, [{}].concat(args));
    cfg = { persistent: true, plugins: { fbFlo: cfg } };
    var obj = {};
    return new Plugin(cfg);
  }
});
