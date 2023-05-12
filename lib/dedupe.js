'use strict';

var lockfile = require('../vendor/lockfile'),
  semver = require('../vendor/semver'),
  utils = require('./utils.js');

/**
 * @typedef {{includePackages?: string[], excludePackages?: string[], includeScopes?: string[], excludeScopes?: string[], useMostCommon?: boolean, loose?: boolean, includePrerelease?: boolean}} Options
 * @typedef {{pkg: lockfile.LockManifest, satisfies: Set.<string>}} VersionInfo
 * @typedef {{name: string, requestedVersion: string, installedVersion: string, versions: Object.<string, VersionInfo>, satisfiedBy: Set.<string>, bestVersion: string}} PackageInfo
 */
module.exports.fixDuplicates = fixDuplicates;
module.exports.listDuplicates = listDuplicates;
module.exports.getDuplicates = getDuplicates;

/**
 * @param {string} content
 * @returns {lockfile.LockfileObject}
 */
function parseYarnLock(content) {
  var result = lockfile.parse(content);
  if ('conflict' === result.type) throw new Error('Bad yarnLock content');
  return result.object;
}

/**
 * @param {string} yarnLock
 * @param {Options} [options]
 * @returns {string}
 */
function fixDuplicates(yarnLock, options) {
  var obj = parseYarnLock(yarnLock),
    duplicated = getDuplicates(obj, options);

  for (var d of duplicated) obj[d.name + '@' + d.requestedVersion] = d.versions[d.bestVersion].pkg;

  return lockfile.stringify(obj);
}

/**
 * @param {string} yarnLock
 * @param {Options} [options]
 * @returns {string[]}
 */
function listDuplicates(yarnLock, options) {
  var obj = parseYarnLock(yarnLock),
    duplicated = getDuplicates(obj, options);

  return duplicated.map(
    (d) => `Package "${d.name}@${d.requestedVersion}" could get ${d.bestVersion}, but got ${d.installedVersion}`
  );
}

/**
 * @param {lockfile.LockfileObject} obj
 * @param {Options} [options]
 * @returns {PackageInfo[]}
 */
function getDuplicates(obj, options) {
  var packages = collectPackages(obj, options);

  return Object.keys(packages)
    .reduce((/** @type {PackageInfo[]} */ acc, name) => acc.concat(computeBestVersions(packages[name], options)), [])
    .filter((p) => p.bestVersion !== p.installedVersion);
}

/**
 * @param {lockfile.LockfileObject} obj
 * @param {Options} [options]
 * @returns {Object.<string, PackageInfo[]>}
 */
function collectPackages(obj, options) {
  /** @type {Options} */
  var opts = utils.assignDefined(
    { includePackages: [], excludePackages: [], includeScopes: [], excludeScopes: [] },
    options
  );

  var /** @type {Object.<string, PackageInfo[]>} */ result = {},
    /** @type {Object.<string, Object.<string, VersionInfo>>} */ pkgVersions = {};

  for (var key in obj) {
    var match = utils.splitPackageKey(key),
      name = match[0],
      requestedVersion = match[1] || '*'; // no version specified

    // only process specified package names
    if (opts.includePackages.length && opts.includePackages.indexOf(name) < 0) continue;
    if (opts.excludePackages.length && opts.excludePackages.indexOf(name) >= 0) continue;

    // only process specified scopes
    var scope = utils.getPackageScope(name);
    if (opts.includeScopes.length && (!scope || opts.includeScopes.indexOf(scope) < 0)) continue;
    if (opts.excludeScopes.length && scope && opts.excludeScopes.indexOf(scope) >= 0) continue;

    var pkg = obj[key],
      ver = pkg.version,
      versions = pkgVersions[name],
      arr = result[name];

    // unique versions for this package
    !versions && (pkgVersions[name] = versions = {});
    ver in versions || (versions[ver] = { pkg, satisfies: new Set() });

    // candidate version based on number of satisfies
    !opts.useMostCommon || versions[ver].satisfies.add(requestedVersion);

    !arr && (result[name] = arr = []);
    arr.push({
      name,
      requestedVersion,
      installedVersion: ver,
      versions,
      // the requested version is always satisfied by the installed version
      satisfiedBy: new Set([ver]),
      bestVersion: ver,
    });
  }

  return result;
}

/**
 * @param {PackageInfo[]} instances
 * @param {Options} [options]
 * @returns {PackageInfo[]}
 */
function computeBestVersions(instances, options) {
  if (instances.length <= 1) return instances;

  var opts = Object.assign({}, options),
    semverOpts = { loose: opts.loose, includePrerelease: opts.includePrerelease },
    versions = instances[0].versions;

  for (var ver in versions) {
    var satisfies = versions[ver].satisfies;

    for (var p of instances) {
      // ignore invalid requested version
      if (semver.satisfies(ver, p.requestedVersion, semverOpts)) {
        satisfies.add(p.requestedVersion);
        p.satisfiedBy.add(ver);
      }
    }
  }

  for (var pkg of instances) {
    // sort the list of satisfied versions
    var candidateVersions = Array.from(pkg.satisfiedBy);
    candidateVersions.sort((v1, v2) => {
      // sort versions based on how many packages it satisfies
      if (opts.useMostCommon) {
        var diff = versions[v2].satisfies.size - versions[v1].satisfies.size;
        if (diff !== 0) return diff;
      }
      return semver.compareBuild(v2, v1, semverOpts);
    });

    pkg.bestVersion = candidateVersions[0];
  }

  return instances;
}
