'use strict';

var fs = require('fs'),
  path = require('path'),
  tmpdir = require('os').tmpdir,
  request = require('https').get,
  zlib = require('zlib'),
  mkdirpSync = require('../vendor/mkdirp').sync;

/**
 * @typedef {{tarball: string, shasum: string, integrity?: string}} DistObject
 * @typedef {{name: string, version: string, dependencies: Object.<string, string>, optionalDependencies?: Object.<string, string>, dist: DistObject}} Manifest
 * @typedef {{name: string, versions: Object.<string, Manifest>, time: Object.<string, string>}} Metadata
 */
module.exports = getPackageManifest;
module.exports.getCachedMetadata = getCachedMetadata;

var OPTIONS = {
  host: 'registry.yarnpkg.com',
  headers: { Connection: 'keep-alive', Accept: 'application/json', 'Accept-Encoding': 'gzip' },
  timeout: 60000,
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
    var reqPath = `/${name}${!version ? '' : '/' + version}`;

    request(Object.assign({ path: reqPath }, OPTIONS), (res) => {
      if (200 !== res.statusCode || 'gzip' !== res.headers['content-encoding'])
        return reject(new Error(`Manifest request ${reqPath} error: ${res.statusCode}`));

      // DEBUG
      !console || !console.log || console.log(reqPath);

      _loadCachedManifest(cached, !fs.existsSync(cached) ? res : null).then(resolve, reject);
    }).on('error', reject);
  });
}

var CACHE_PATH;

/**
 * @param {string} name
 * @param {string} [version]
 * @returns {(string|Promise.<(Metadata|Manifest)>)}
 */
function getCachedMetadata(name, version) {
  if (!CACHE_PATH) {
    var dir = process.env.YARN_CACHE_DIR;
    dir = !dir ? path.join(tmpdir(), 'yarn-manifests') : path.resolve(dir, '_manifests');

    CACHE_PATH = (mkdirpSync(dir), dir);
  }

  var filename = `${name.replace('/', '%')}${!version ? '' : '@' + version}.json.gz`;
  filename = path.join(CACHE_PATH, filename);

  return !fs.existsSync(filename) ? filename : _loadCachedManifest(filename);
}

/**
 * @param {string} filename
 * @param {import('stream').Readable} [stream]
 * @returns {Promise.<(Metadata|Manifest)>}
 */
function _loadCachedManifest(filename, stream) {
  var fromFile = !stream;

  return new Promise((resolve, reject) => {
    function handleError(err) {
      if (fromFile)
        try {
          fs.unlinkSync(filename);
        } catch (_) {}

      reject(err);
    }

    fromFile && (stream = fs.createReadStream(filename));
    var chunks = [];

    stream
      .pipe(zlib.createGunzip())
      .on('error', handleError)
      .on('data', (chunk) => chunks.push(chunk))
      .on('finish', () => {
        var json;
        try {
          var buffer = Buffer.concat(chunks);
          json = JSON.parse(buffer.toString());
        } catch (ex) {
          return handleError(ex);
        }
        if (fromFile) return resolve(json);

        _pruneManifestObject(json);
        _saveCachedManifest(filename, json).then(resolve, reject);
      });
  });
}

/**
 * @param {string} filename
 * @param {Object} json
 * @returns {Promise.<Object>}
 */
function _saveCachedManifest(filename, json) {
  return new Promise((resolve, reject) => {
    var data = JSON.stringify(json);

    zlib.gzip(data, (err, result) => {
      if (err) return reject(err);

      if (fs.existsSync(filename) || fs.existsSync((filename = filename + '.tmp'))) return resolve(json);

      fs.writeFile(filename, result, (er) => {
        if (er) return reject(er);

        try {
          fs.renameSync(filename, filename.substring(0, filename.length - 4));
        } catch (ex) {
          return reject(ex);
        }
        resolve(json);
      });
    });
  });
}

// 'name', 'version', 'versions', 'time', 'dist', 'dependencies', 'optionalDependencies', 'devDependencies',
// 'peerDependencies', 'peerDependenciesMeta', 'bundleDependencies', 'bin', 'main', 'engines', 'os', 'cpu'
function _pruneManifestObject(json) {
  // prettier-ignore
  ['readme', 'maintainers', 'users', 'contributors', 'keywords', 'files', 'scripts', 'description',
    'bugs', 'homepage', 'repository', 'jest', '_npmUser', '_npmOperationalInternal'].forEach((k) => delete json[k]);

  if (json.dist) ['npm-signature', 'signatures'].forEach((x) => delete json.dist[x]);

  if (json.versions) for (var v in json.versions) _pruneManifestObject(json.versions[v]);
}
