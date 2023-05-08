'use strict';

var semver = require('../vendor/semver');

/**
 * @typedef {import('../vendor/lockfile').LockManifest} LockManifest
 * @typedef {import('../vendor/lockfile').LockfileObject} LockfileObject
 */
module.exports = mergeLockfile;

/**
 * @param {LockfileObject} obj1
 * @param {LockfileObject} obj2
 * @returns {LockfileObject}
 */
function mergeLockfile(obj1, obj2) {
  for (var x of Object.keys(obj2)) {
    if (!obj1[x] || semver.lt(obj1[x].version, obj2[x].version, true)) {
      obj1[x] = findLockManifest(obj1, x, obj2[x]);
    }
  }

  return obj1;
}

/**
 * @param {LockfileObject} obj
 * @param {string} key
 * @param {LockManifest} ref
 * @returns {LockManifest}
 */
function findLockManifest(obj, key, ref) {
  key = key.substring(0, key.indexOf('@', 1) + 1 || undefined);

  for (var x of Object.keys(obj)) {
    if (x.startsWith(key) && obj[x].version === ref.version) return obj[x];
  }

  return ref;
}
