#!/usr/bin/env node
'use strict';

try {
  require('../vendor/v8-compile-cache.js');
} catch (__) {}

var fs = require('fs'),
  lockfile = require('../vendor/lockfile'),
  program = require('../vendor/commander'),
  merge = require('../lib/merge.js'),
  version = require('../package.json').version;

program
  .name('yarn-merge')
  .version(version)
  .arguments('<file1> <file2> [fileN...]')
  .description('Merge two or more Yarn lockfiles', {
    file1: 'base lockfile',
    file2: 'the second lockfile',
    fileN: 'other lockfiles',
  })
  .option('-o, --output <file>', 'save output to file (default STDOUT)')
  .option('-l, --loose', 'interpret version comparisons loosely')
  .action(main)
  .parseAsync(process.argv)
  .catch((e) => (console.error(e), process.exit(1)));

/**
 * @param {string} file1
 * @param {string} file2
 * @param {string[]} [fileN]
 * @param {{loose?: boolean, output?: string}} opts
 * @returns {Promise}
 */
function main(file1, file2, fileN, opts) {
  return new Promise((resolve, reject) => {
    parseLockfile(file1).then((obj1) => {
      var it = [];
      for (var file of [file2].concat(fileN || [])) {
        it.push(parseLockfile(file).then((obj2) => merge(obj1, obj2, opts.loose), reject));
      }

      Promise.all(it).then(() => {
        merge.cleanup(obj1);

        var content = lockfile.stringify(obj1);
        !opts.output
          ? resolve(console.log(content))
          : fs.writeFile(opts.output, content, (err) => (!err ? resolve() : reject(err)));
      }, reject);
    }, reject);
  });
}

/**
 * @param {string} file
 * @returns {Promise.<lockfile.LockfileObject>}
 */
function parseLockfile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, content) => {
      if (err) reject(err);
      else {
        var result = lockfile.parse(content);
        'conflict' === result.type ? reject(new Error('Bad lockfile: ' + file)) : resolve(result.object);
      }
    });
  });
}
