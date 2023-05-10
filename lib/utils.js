'use strict';

module.exports.getPackageName = getPackageName;
module.exports.splitPackageKey = splitPackageKey;

/**
 * @param {string} key
 * @returns {string}
 */
function getPackageName(key) {
  var i = key.indexOf('@', 1);
  return i < 0 ? key : key.slice(0, i);
}

/**
 * @param {string} key
 * @returns {string[]}
 */
function splitPackageKey(key) {
  var i = key.indexOf('@', 1);
  return i < 0 ? [key, ''] : [key.slice(0, i), key.slice(i + 1)];
}
