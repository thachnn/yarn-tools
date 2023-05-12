#!/usr/bin/env node
'use strict';

try {
  require('../vendor/v8-compile-cache.js');
} catch (__) {}

var fs = require('fs'),
  program = require('../vendor/commander'),
  dedupe = require('../lib/dedupe.js'),
  version = require('../package.json').version;

program
  .name('yarn-dedupe')
  .version(version)
  .arguments('[lockfile]')
  .description('Cleanup Yarn lockfile by removing duplicates', {
    lockfile: 'yarn.lock path (default: yarn.lock)',
  })
  .option(
    '-s, --strategy <strategy>',
    'deduplication strategy: [fewer, highest]',
    (val) => 'highest' === val || 'fewer' === val || exitFailure('error: Invalid strategy: ' + val),
    'highest'
  )
  .option('-l, --list [magic]', 'do not change yarn.lock, just output the diagnosis')
  .option('-f, --fail', 'if there are duplicates in yarn.lock, exit the script with status 1')
  .option('--packages <packages...>', 'a list of package names to deduplicate')
  .option('--exclude <packages...>', 'a list of package names not to deduplicate')
  .option('--scopes <scopes...>', 'a list of package scopes to deduplicate')
  .option('--exclude-scopes <scopes...>', 'a list of package scopes not to deduplicate')
  .option('-p, --print', 'instead of saving the deduplicated yarn.lock, print the result in STDOUT')
  .option('--loose', 'interpret version comparisons loosely')
  .option('--includePrerelease', 'include prereleases in version comparisons')
  .action(main)
  .parse(process.argv);

/**
 * @param {string} [file]
 * @param {program.Command} opts
 */
function main(file, opts) {
  !file && (file = 'yarn.lock');
  var yarnLock = fs.readFileSync(file, 'utf8');

  var options = {
    useMostCommon: opts.strategy === 'fewer',
    includePackages: opts.packages,
    excludePackages: opts.exclude,
    includeScopes: opts.scopes,
    excludeScopes: opts.excludeScopes,
    loose: opts.loose,
    includePrerelease: opts.includePrerelease,
  };

  if (opts.list) {
    // TODO: options.listMagic
    var duplicates = dedupe.listDuplicates(yarnLock, options);
    duplicates.forEach((line) => console.log(line));

    !opts.fail || duplicates.length === 0 || exitFailure();
  } else {
    var deduped = dedupe.fixDuplicates(yarnLock, options);

    if (opts.print) {
      console.log(deduped);
    } else {
      var eol = yarnLock.match(/\r?\n/);
      !eol || eol[0] === '\n' || (deduped = deduped.replace(/\n/g, '\r\n'));

      deduped === yarnLock || fs.writeFileSync(file, deduped);
    }

    !opts.fail || deduped === yarnLock || exitFailure();
  }
}

function exitFailure(msg) {
  console.error(msg || '\nerror: Duplicated entries found.');
  process.exit(1);
}
