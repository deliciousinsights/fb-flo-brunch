# Dead-simple live injection of Brunch-built CSS/JS files in the browser

[![Build Status](https://travis-ci.org/deliciousinsights/fb-flo-brunch.svg)](https://travis-ci.org/deliciousinsights/fb-flo-brunch)
[![Dependency status](https://david-dm.org/deliciousinsights/fb-flo-brunch.svg)](https://david-dm.org/deliciousinsights/fb-flo-brunch)
[![Dev Dependency status](https://david-dm.org/deliciousinsights/fb-flo-brunch/dev-status.svg)](https://david-dm.org/deliciousinsights/fb-flo-brunch#info=devDependencies&view=table)
[![Code Climate](https://codeclimate.com/github/deliciousinsights/fb-flo-brunch/badges/gpa.svg)](https://codeclimate.com/github/deliciousinsights/fb-flo-brunch)
[![Test Coverage](https://codeclimate.com/github/deliciousinsights/fb-flo-brunch/badges/coverage.svg)](https://codeclimate.com/github/deliciousinsights/fb-flo-brunch)

[![NPM](https://nodei.co/npm/fb-flo-brunch.png)](https://nodei.co/npm/fb-flo-brunch/)

## Brunch?  fb-flo?  What?

* **[Brunch](http://brunch.io)** is a kickass front-end app assets builder; basically it's what most people trod through the swamps of Grunt, Gulp or what-have-you for, only much, much better and far, far, simpler to use.
* **[fb-flo](https://facebook.github.io/fb-flo/)** is a great little system by Facebook to let you live update CSS or JS files inside an open browser page (instead of just reloading the whole thing).  As it depends on JS runtime's hotswap capabilities, it's not available everywhere yet; but for Chrome, it kinda rules.

The only thing is, you need to write your own fb-flo server, which is a tiny Node.js program; most of the time, that just means copy-pasting the (small) example code from their homepage, and then running it.  But for Brunch users, the ideal way would be through a plugin that auto-starts and auto-stops the server, and figures out automatically what to watch (the final results of the build pipeline).

So we made fb-flo-brunch: your lovely Brunch plugin to have automatic fb-flo capability over your watched build!

## Installing

Get in your Brunch-using project's root directory, and just install the plugin:

```sh
$ npm install --save-dev fb-flo-brunch
```

## Configuring

As most Brunch plugins do, this one Just Works™ out of the box.  But we're just as nerdy as the next developer when it comes to customization… and fb-flo itself offers quite a few options.  So you can tweak the plugin's behavior to your heart's content inside Brunch's `config.plugins.fbFlo` main key.

In the table below, the “fb-flo?” column states whether this is just an fb-flo option, directly forward to the *server* or *resolver*.  For full details on their default values and behavior, check out [the fb-flo doc](https://github.com/facebook/fb-flo#usage).

| Option    | fb-flo? | Description | Default |
| --------- |:-------:| ----------- |:-------:|
| `enabled` |         | Whether the plugin is enabled or not | `true` |
| `host`    | server  | What network interface to listen to | *see fb-flo* |
| `message` |         | The message to log on the client-side (browser) when a resource just got updated live.  The `%s` code will be replaced by the resource's name.  The presence of this automatically defines fb-flo’s `update` resolver option. | “%s has just been updated with new content” |
| `messageColor` | | A CSS color name for displaying the `message` | `black` |
| `messageLevel` | | What console level to display `message` on | `log` |
| `messageResourceColor` | | A CSS color name for the resource name in `message` | |
| `pollingInterval` | server | *see fb-flo* | *see fb-flo* |
| `port`    | server | What port to listen to | 8888 |
| `resolverMatch` | resolver (`match`) | *see fb-flo* | *see fb-flo* |
| `resolverReload` | resolver (`reload`) | Extends fb-flo's boolean-only values with [anymatch sets](https://www.npmjs.com/package/anymatch), allowing for tremendous flexibility | `false` |
| `fuzzyMatch` | resolver | Fuzzy match to cater for resources with hashes in URL | `false` |
| `useFilePolling` | server | *see fb-flo* | *see fb-flo* |
| `useWatchman` | server | *see fb-flo* | *see fb-flo* |
| `verbose` | server | Whether to output everything on the wire… | `false` |
| `watchDotFiles` | server | *see fb-flo* | *see fb-flo* |

## Contributing

We welcome all contributions, most importantly bug fixes, augmented test coverage and extended docs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details and guidelines on how to help.

## License

This work is MIT-licensed and © 2015 Christophe Porteneuve.

Check [LICENSE](LICENSE) for full details.
