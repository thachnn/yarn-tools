#!/usr/bin/env node
'use strict';

var fs = require('fs'),
  lockfile = require('../vendor/lockfile'),
  program = require('../vendor/commander'),
  merge = require('../lib/merge.js'),
  version = require('../package.json').version;

program
  .name('yarn-merge')
  .version(version)
  .arguments('<lockfile1> <lockfile2> [lockfile3...]')
  .description('Merge two or more Yarn lockfiles', {
    lockfile1: 'base lockfile',
    lockfile2: 'the second lockfile',
    lockfile3: 'other lockfiles',
  })
  .option('-o, --output <file>', 'save output to file (default STDOUT)')
  .action(main)
  .parse(process.argv);

/**
 * @param {string} file1
 * @param {string} file2
 * @param {string[]} file3
 */
function main(file1, file2, file3) {
  var lockfile1 = parseLockfile(file1);

  for (var file of [file2].concat(file3 || [])) {
    var lockfile2 = parseLockfile(file);
    merge(lockfile1, lockfile2);
  }

  var content = lockfile.stringify(lockfile1);
  !program.output ? console.log(content) : fs.writeFileSync(program.output, content);
}

/**
 * @param {string} file
 * @returns {lockfile.LockfileObject}
 */
function parseLockfile(file) {
  var content = fs.readFileSync(file, 'utf8'),
    result = lockfile.parse(content);

  if ('conflict' == result.type) throw new Error('Invalid lockfile: ' + file);
  return result.object;
}
