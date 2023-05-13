'use strict';

module.exports.getPackageName = getPackageName;
module.exports.splitPackageKey = splitPackageKey;
module.exports.getPackageScope = getPackageScope;
module.exports.assignDefined = assignDefined;

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

/**
 * @param {string} name
 * @returns {string}
 */
function getPackageScope(name) {
  var i = name.indexOf('/', 1);
  return i < 0 ? '' : name.slice(0, i);
}

/**
 * @template T,U,V,W
 * @param {T} target
 * @param {...(U|V|W)} _sources
 * @returns {(T & U & V & W)}
 */
function assignDefined(target, _sources) {
  for (var i = 1, n = arguments.length; i < n; i++) {
    var source = arguments[i];
    if (!source) continue;

    for (var key of Object.keys(source)) {
      var val = source[key];
      void 0 === val || (target[key] = val);
    }
  }
  return target;
}
