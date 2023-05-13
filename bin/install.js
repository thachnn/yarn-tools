#!/usr/bin/env node
'use strict';

try {
  require('../vendor/v8-compile-cache.js');
} catch (__) {}

var fs = require('fs'),
  lockfile = require('../vendor/lockfile'),
  program = require('../vendor/commander'),
  install = require('../lib/install.js'),
  version = require('../package.json').version;

program
  .name('yarn-safe-install')
  .version(version)
  .description('Resolve package dependencies safety into Yarn lockfile')
  .option('-o, --output <file>', 'output file', 'yarn.lock')
  .option('--prod, --no-dev', 'ignore any package listed in devDependencies')
  .option('--no-optional', "don't install optional dependencies")
  .option(
    '-d, --limit-date <Y-M-D>',
    'only install package versions released before this date',
    (val) => new Date(val).toISOString(),
    new Date().toISOString()
  )
  .option('-l, --loose', 'interpret version comparisons loosely')
  .option('-p, --prerelease', 'include prereleases in version comparisons')
  .action(main)
  .parseAsync(process.argv)
  .catch((e) => (console.error(e), process.exit(1)));

/**
 * @param {{output: string, dev?: boolean, 'optional'?: boolean, limitDate: string, loose?: boolean, prerelease?: boolean}} opts
 * @returns {Promise}
 */
function main(opts) {
  var options = {
    optional: opts.optional,
    loose: opts.loose,
    prerelease: opts.prerelease,
  };

  return new Promise((resolve, reject) => {
    var data, pkg;
    try {
      data = fs.readFileSync('package.json', 'utf8');
      pkg = JSON.parse(data);
    } catch (err) {
      return reject(err);
    }

    var deps = Object.assign({}, opts.dev ? pkg.devDependencies : null, pkg.dependencies),
      it = [],
      obj = {},
      versions = {};
    for (var name in deps) it.push(install(obj, name, deps[name], opts.limitDate, versions, options));

    Promise.all(it).then((msg) => {
      try {
        logMessages(msg);
        data = lockfile.stringify(obj);
      } catch (ex) {
        return reject(ex);
      }

      fs.writeFile(opts.output, data, (er) => (!er ? resolve() : reject(er)));
    }, reject);
  });
}

/**
 * @param {Array|string} [msg]
 */
function logMessages(msg) {
  !msg || ('string' == typeof msg ? console.info(msg) : msg.forEach(logMessages));
}
