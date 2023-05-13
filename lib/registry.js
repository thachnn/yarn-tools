'use strict';

var fs = require('fs'),
  path = require('path'),
  tmpdir = require('os').tmpdir,
  request = require('https').request,
  unzip = require('zlib').gunzip;

/**
 * @typedef {{tarball: string, shasum: string, integrity?: string}} DistObject
 * @typedef {{name: string, version: string, dependencies: Object.<string, string>, optionalDependencies?: Object.<string, string>, dist: DistObject }} Manifest
 * @typedef {{name: string, versions: Object.<string, Manifest>, time: Object.<string, string> }} Metadata
 */
module.exports = getPackageManifest;
module.exports.getCachedMetadata = getCachedMetadata;

var CACHE_PATH;

/**
 * @param {string} name
 * @param {string} [version]
 * @returns {(string|Promise.<(Metadata|Manifest)>)}
 */
function getCachedMetadata(name, version) {
  if (!CACHE_PATH) {
    var dir = process.env.YARN_CACHE_DIR;
    CACHE_PATH = !dir ? path.join(tmpdir(), 'yarn-manifests') : path.resolve(dir, '_manifests');

    try {
      fs.mkdirSync(CACHE_PATH);
    } catch (err) {
      if ('EEXIST' !== err.code) throw err;
    }
  }

  var filename = `${name.replace('/', '%')}${!version ? '' : '@' + version}.json.gz`;
  filename = path.join(CACHE_PATH, filename);

  return !fs.existsSync(filename) ? filename : _readCachedManifest(filename);
}

/**
 * @param {string} filename
 * @returns {Promise.<(Metadata|Manifest)>}
 */
function _readCachedManifest(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (ex, data) => {
      if (ex) reject(ex);
      else
        unzip(data, (err, result) => {
          if (!err) {
            try {
              var json = JSON.parse(result.toString());
              resolve(json);
            } catch (e) {
              reject(e);
            }
          } else {
            fs.unlink(filename);
            reject(err);
          }
        });
    });
  });
}

var OPTIONS = {
  host: 'registry.yarnpkg.com',
  headers: { Connection: 'keep-alive', Accept: 'application/json', 'Accept-Encoding': 'gzip' },
  timeout: 10000,
};

/**
 * @param {string} name
 * @param {string} [version]
 * @returns {Promise.<(Metadata|Manifest)>}
 */
function getPackageManifest(name, version) {
  var cached = getCachedMetadata(name, version);
  if ('string' != typeof cached) return cached;

  return new Promise((resolve, reject) => {
    var req = request(Object.assign({ path: `/${name}/${version || ''}` }, OPTIONS), (res) => {
      if (200 !== res.statusCode) {
        reject(new Error(`Manifest request ${req.path} error: ${res.statusCode}`));
        return;
      }

      var stream = fs.createWriteStream(cached);
      stream
        .on('error', (err) => {
          fs.unlink(cached);
          reject(err);
        })
        .on('finish', () => {
          _readCachedManifest(cached).then(resolve, reject);
        });

      res.pipe(stream);
    });

    req.on('error', reject);
    req.end();
  });
}
