"use strict";

var anymatch = require('anymatch');
var defaults = require('amp-defaults');
var extend   = require('amp-extend');
var flo      = require('fb-flo');
var fs       = require('fs');
var path     = require('path');
var pick     = require('amp-pick');

function FbFloBrunch(config) {
  this.setOptions(config);

  if (!config || !config.persistent || false === this.config.enabled) {
    return;
  }

  this.resolver = this.resolver.bind(this);
  this.startServer();
}

var FB_FLO_OPTIONS = ['host', 'message', 'pollingInterval', 'port',
  'useFilePolling', 'useWatchman', 'verbose', 'watchDotFiles'];
var OPTIONS = FB_FLO_OPTIONS.concat(
  ['enabled', 'messageColor', 'messageLevel', 'messageResourceColor',
   'resolverMatch', 'resolverReload']);

FbFloBrunch.DEFAULTS = {
  host:         'localhost',
  message:      '%s has just been updated with new content',
  messageLevel: 'log',
  verbose:      false
};

extend(FbFloBrunch.prototype, {
  brunchPlugin: true,

  resolver: function resolver(filePath, callback) {
    var fullPath = path.join(this.config.publicPath, filePath);
    var options = {
      resourceURL: filePath,
      contents: fs.readFileSync(fullPath).toString()
    };

    if (this.update) {
      options.update = this.update;
    }
    if (this.config.resolverMatch) {
      options.match = this.config.resolverMatch;
    }
    if (this.config.resolverReload) {
      options.reload = this.config.resolverReload(filePath);
    }

    callback(options);
  },

  setOptions: function setOptions(config) {
    var cfg = config && config.plugins && config.plugins.fbFlo || {};

    this.config = defaults(pick(cfg, OPTIONS), FbFloBrunch.DEFAULTS);

    this.config.publicPath = config && config.paths && config.paths.public ||
      path.join(process.cwd(), 'public');

    if (this.config.resolverReload) {
      this.config.resolverReload = true === this.config.resolverReload
        ? function() { return true; }
        : anymatch(this.config.resolverReload);
    }

    if (this.config.message) {
      var msg = this.config.message.toString().replace(/"/g, '\\"');
      var suffix = ['_resourceURL'];
      if (this.config.messageResourceColor) {
        msg = msg.replace('%s', '%c%s%c');
        suffix.unshift('"color: ' + this.config.messageResourceColor + '"');
        suffix.push('"color: ' + (this.config.messageColor || 'black') + '"');
      }
      if (this.config.messageColor) {
        msg = '%c' + msg;
        suffix.unshift('"color: ' + this.config.messageColor + '"');
      }
      suffix = suffix.join(', ');
      var level = this.config.messageLevel || 'log';
      var code = 'console.' + level + '("' + msg + '", ' + suffix + ');';
      this.update = new Function('_window', '_resourceURL', code);
    }
  },

  startServer: function startServer() {
    this._flo = flo(
      this.config.publicPath,
      extend(
        pick(this.config, FB_FLO_OPTIONS),
        { glob: ['**/*.js', '**/*.css'] }
      ),
      this.resolver
    );
  },

  teardown: function tearDownFbFlo() {
    if (this._flo) {
      this._flo.close();
    }
  },

  update: function update(window, resourceURL) {
    console.log(this.config.message, resourceURL);
  }
});

module.exports = FbFloBrunch;
