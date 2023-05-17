'use strict';

var semver = require('../vendor/semver'),
  registry = require('./registry.js');

/**
 * @typedef {import('../vendor/lockfile').LockManifest} LockManifest
 * @typedef {import('../vendor/lockfile').LockfileObject} LockfileObject
 * @typedef {{optional?: boolean, loose?: boolean, prerelease?: boolean}} Options
 */
module.exports = safeInstall;

/**
 * @param {LockfileObject} result
 * @param {string} pkgName
 * @param {string|semver.Range} requestedVer
 * @param {string} limitDate
 * @param {Object.<string, Object.<string, LockManifest>>} pkgVersions
 * @param {Options} [opts={}]
 * @returns {Promise.<(Array|string|undefined)>}
 */
function safeInstall(result, pkgName, requestedVer, limitDate, pkgVersions, opts) {
  var key = pkgName + '@' + requestedVer;
  if (key in result) return Promise.resolve(null); // already installed

  !opts && (opts = {});
  try {
    requestedVer = new semver.Range(requestedVer || '*', { loose: opts.loose, includePrerelease: opts.prerelease });
  } catch (_) {
    return Promise.resolve('Ignore package: ' + key);
  }

  return new Promise((resolve, reject) => {
    // gets package manifest
    registry(pkgName).then((meta) => {
      var bestVer = resolveBestVersion(requestedVer, limitDate, meta);
      if (!bestVer) {
        reject(new Error(`Cannot resolve ${key} from ${Object.keys(meta.versions)}`));
        return;
      }

      var ver = bestVer.raw,
        entry = buildLockManifest(meta.versions[ver]),
        pkgDate = meta.time[ver] || limitDate,
        pkg,
        installed,
        versions = pkgVersions[pkgName];
      !versions && (pkgVersions[pkgName] = versions = {});
      // prettier-ignore
      if (!(pkg = versions[ver])) { versions[ver] = pkg = entry; entry = null; }

      if ((installed = result[key]) && bestVer.compare(installed.version) <= 0) return resolve(null);
      result[key] = pkg;
      if (entry) return resolve();

      var deps = Object.assign({}, opts.optional ? pkg.optionalDependencies : null, pkg.dependencies),
        it = [];
      for (var name in deps) it.push(safeInstall(result, name, deps[name], pkgDate, pkgVersions, opts));

      Promise.all(it).then((msg) => {
        resolve(msg && msg.length && (msg = msg.filter(Boolean)).length ? msg : void 0);
      }, reject);
    }, reject);
  });
}

/**
 * @param {semver.Range} requestedVer
 * @param {string} limitDate
 * @param {registry.Metadata} meta
 * @returns {?semver.SemVer}
 */
function resolveBestVersion(requestedVer, limitDate, meta) {
  var versions = Object.keys(meta.versions)
    .map((s) => new semver.SemVer(s, requestedVer.options))
    .sort((v1, v2) => v1.compare(v2) || v1.compareBuild(v2));

  var bestVer, v;

  for (var i = versions.length - 1; i >= 0; i--) {
    if (requestedVer.test((v = versions[i]))) {
      if (v.raw in meta.time && meta.time[v.raw] <= limitDate) return v;
      bestVer = v;
    }
  }

  return bestVer;
}

/**
 * @param {registry.Manifest} ver
 * @returns {LockManifest}
 */
function buildLockManifest(ver) {
  var pkg = {
    version: ver.version,
    resolved: buildResolvedUrl(ver.dist.tarball, ver.dist.shasum),
  };
  !ver.dist.integrity || (pkg.integrity = ver.dist.integrity);

  var x, v;
  for (x of ['dependencies', 'optionalDependencies']) (v = ver[x]) && Object.keys(v).length && (pkg[x] = v);

  if (pkg.optionalDependencies && pkg.dependencies) {
    for (x in pkg.optionalDependencies) delete pkg.dependencies[x];
    Object.keys(pkg.dependencies).length > 0 || delete pkg.dependencies;
  }

  return pkg;
}

/**
 * @param {string} url
 * @param {string} [shasum]
 * @returns {string}
 */
function buildResolvedUrl(url, shasum) {
  url = url.replace(/^http(:\/\/)/i, 'https$1').replace(/(\/\/registry\.)npm[\w.]*\//i, '$1yarnpkg.com/');
  return !shasum ? url : url + '#' + shasum;
}
