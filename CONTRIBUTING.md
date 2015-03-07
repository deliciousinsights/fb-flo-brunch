So you'd like to help with fb-flo-brunch?  That's awesome!

# Spotted a bug?

* At the minimum, [report the issue](https://github.com/deliciousinsights/fb-flo-brunch/issues) (check it hasn't been reported yet before you open a new one).
* Better yet, fork this repo, create a tested fix, and submit a pull request!

# Augmented test coverage

Until we reach 100% test coverage, feel free to fork, augment the test suite and submit a pull request.  Make sure the whole suite runs fine still.

# Enhanced docs

We can always use more docs.  More examples, etc.  If you feel our docs are lacking and want to contribute, create an Issue first to discuss this and get our greenlight, so you don't work for nothing; once we agree on the docs you’d like to write, go ahead and make a PR when you’re done!

# Guidelines for contributing code

Any code contribution **should come with matching tests**, and not break any existing tests.  Run `npm test` to make sure you’re in the clear.  Code contributions without matching tests might not get accepted, unless they're trivial enough.

We go with the usual “Your house, your rules” approach: this project uses our own coding style, so if you contribute, **please make an effort to use the same style**.

In order to make this easier, we provide two extensive configuration files for [JSHint](http://www.jshint.com/) and [JSCS](http://jscs.info/).  When installing this module, you get these two tools as dev dependencies, otherwise just install them manually in global mode if you don't have them already.

Then once your code contribution is ready, just run:

```sh
$ npm run check

> fb-flo-brunch@1.7.20 check /Users/tdd/perso/javascript/fb-flo-brunch
> jshint index.js && jscs index.js

No code style errors found.
```

If you're all clear, then congratulations!  You wrote code with a style very much in line with our own, we appreciate your effort.  Go ahead and commit.

Quick run-down on the main rules, so you don't have to dissect `.jscsrc` :

- Comma-last
- Semicolons
- Whitespace around binary operators and before unary operators
- No whitespace before opening function paren or object literal colons
- No whitespace inside parens and square brackets
- Curly braces after any control-flow keyword, starting on the same line
- Two-space indentation

# Thank you!

Again, thanks for contributing to our stuff.  You’re awesome.
