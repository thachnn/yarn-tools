'use strict';

var SemVer = require('../vendor/semver').SemVer,
  getPackageName = require('./utils.js').getPackageName;

/**
 * @typedef {import('../vendor/lockfile').LockManifest} LockManifest
 * @typedef {import('../vendor/lockfile').LockfileObject} LockfileObject
 */
module.exports = merge;
module.exports.cleanup = cleanup;

/**
 * @param {LockfileObject} obj1
 * @param {LockfileObject} obj2
 * @param {boolean} [loose]
 * @returns {LockfileObject}
 */
function merge(obj1, obj2, loose) {
  for (var key in obj2) {
    var pkg2 = obj2[key];

    if (!obj1[key]) obj1[key] = pkg2;
    else {
      var v2 = new SemVer(pkg2.version, loose);

      do {
        var v1 = new SemVer(obj1[key].version, loose);
        if (v1.compare(v2) >= 0) break;

        if (v1.raw === obj1[key].version) {
          obj1[key] = pkg2;
          break;
        }
      } while (1);
    }
  }

  return obj1;
}

/**
 * @param {LockfileObject} obj
 * @returns {LockfileObject}
 */
function cleanup(obj) {
  /** @type {Object.<string, Object.<string, LockManifest>>} */
  var pkgVersions = {};

  for (var key in obj) {
    var name = getPackageName(key),
      pkg = obj[key],
      v = pkg.version,
      versions = pkgVersions[name];

    if (!versions) pkgVersions[name] = versions = { [v]: pkg };
    else {
      var o = versions[v];
      !o ? (versions[v] = pkg) : (obj[key] = o);
    }
  }

  return obj;
}
