/*
 * fb-flo-brunch -- A seamless plugin for using fb-flo on top of Brunch.
 *
 * http://brunch.io
 * https://facebook.github.io/fb-flo/
 */

"use strict";

var anymatch = require('anymatch');
var defaults = require('amp-defaults');
var extend   = require('amp-extend');
var flo      = require('fb-flo');
var fs       = require('fs');
var path     = require('path');
var pick     = require('amp-pick');

// Plugin constructor.  Takes Brunch's complete config as argument.
function FbFloBrunch(config) {
  this.setOptions(config);

  // This plugin only makes sense if we're in watcher mode
  // (`config.persistent`).  Also, we honor the plugin-specific `enabled`
  // setting, so users don't need to strip the plugin or its config to
  // disable it: just set `enabled` to `false`.
  if (!config || !config.persistent || false === this.config.enabled) {
    return;
  }

  this.resolver = this.resolver.bind(this);
  this.startServer();
}

// These options are passed untouched to fb-flo.  See
// https://github.com/facebook/fb-flo#1-configure-fb-flo-server for details.
var FB_FLO_OPTIONS = FbFloBrunch.FB_FLO_OPTIONS = Object.freeze([
  'host', 'pollingInterval', 'port',
  'useFilePolling', 'useWatchman', 'verbose', 'watchDotFiles']);

// This is a superset of options, including all plugin-specific options.
// See https://deliciousinsights.github.io/fb-flo-brunch for details.
var OPTIONS = FbFloBrunch.OPTIONS = Object.freeze(FB_FLO_OPTIONS.concat(
  ['enabled', 'message', 'messageColor', 'messageLevel',
   'messageResourceColor', 'resolverMatch', 'resolverReload']));

// Default values for options.
FbFloBrunch.DEFAULTS = {
  // The message logged in the browser console when the fb-flo extension
  // has live-injected the resource.  `%s` is replaced by the resource name.
  message:      '%s has just been updated with new content',
  // The console level at which to output the message.  Can be any valid
  // console method, but will usually be one of `log`, `info`, or `debug`.
  messageLevel: 'log'
};

extend(FbFloBrunch.prototype, {
  // This is the marker that makes Brunch acknowledge this as a plugin.
  brunchPlugin: true,

  // The fb-flo resolver, triggered everytime fb-flo wants to send a change
  // notification to connected browser extensions.
  resolver: function resolver(filePath, callback) {
    var fullPath = path.join(this.config.publicPath, filePath);
    var options = {
      resourceURL: filePath,
      contents: fs.readFileSync(fullPath).toString()
    };

    // If we defined a custom browser-side message system, use it.
    if (this.update) {
      options.update = this.update;
    }
    // If we specified a `match` option for fb-flo notifications, use it.
    if (this.config.resolverMatch) {
      options.match = this.config.resolverMatch;
    }
    // If we defined an advanced reload mechanism (fb-flo only has true/false,
    // we also allow anymatch sets), use it.
    if (this.config.resolverReload) {
      options.reload = this.config.resolverReload(filePath);
    }

    // Hand the notification over to the fb-flo server.
    callback(options);
  },

  // Configuration interpretation logic: defaults, method generation, etc.
  setOptions: function setOptions(config) {
    // We expect config at `config.plugins.fbFlo`.
    var cfg = config && config.plugins && config.plugins.fbFlo || {};

    this.config = defaults(pick(cfg, OPTIONS), FbFloBrunch.DEFAULTS);

    // We're using the configuration's public path, or its Brunch default,
    // to know what directory fb-flo should watch.
    this.config.publicPath = config && config.paths && config.paths.public ||
      path.join(process.cwd(), 'public');

    // Allow for basic, fb-flo supported true/false values for the resolver's
    // `reload` setting, but also allow anymatch sets (way more flexible).
    if (this.config.resolverReload) {
      if (true === this.config.resolverReload) {
        this.config.resolverReload = function alwaysReload() { return true; };
      } else {
        this.config.resolverReload = anymatch(this.config.resolverReload);
      }
    }

    // If a client-side message is defined, build the `update` resolver method.
    if (this.config.message) {
      var msg = this.config.message.toString().replace(/"/g, '\\"');
      var suffix = ['_resourceURL'];
      // We allow custom colors for the resource name and overall text
      // (this currently only works in Chrome DevTools; but so does fb-flo…).
      // Any valid CSS color syntax is usable.
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
      var level = this.config.messageLevel;
      var code = 'console.' + level + '("' + msg + '", ' + suffix + ');';
      // Closures won't marshal over to the browser, hence the autonomous
      // function code generation.
      /* jshint evil:true */
      this.update = new Function('_window', '_resourceURL', code);
    }
  },

  // Starts the fb-flo server.  Launched from the constructor unless the
  // plugin is disabled.
  startServer: function startServer() {
    this._flo = flo(
      // The path to watch (see `setOptions(…)`).
      this.config.publicPath,
      // The config-provided fb-flo options + a generic watch glob
      // (all JS/CSS, at any depth) inside the watched path.
      extend(
        pick(this.config, FB_FLO_OPTIONS),
        { glob: this.config.glob | ['**/*.js', '**/*.css'] }
      ),
      // Our resolver method (it was properly bound upon construction).
      this.resolver
    );
  },

  // Stops the fb-flo server when Brunch shuts down.
  teardown: function tearDownFbFlo() {
    // If the plugin was disabled, we didn't start the server, so check.
    if (this._flo) {
      this._flo.close();
    }
  }
});

// A Brunch plugin's default export must be the constructor.
module.exports = FbFloBrunch;
