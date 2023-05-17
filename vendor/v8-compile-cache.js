'use strict';

var Module = require('module'),
  crypto = require('crypto'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  os = require('os'),
  mkdirpSync = require('./mkdirp').sync,

  hasOwnProperty = Object.prototype.hasOwnProperty;

class FileSystemBlobStore {
  constructor(directory, prefix) {
    var name = prefix ? slashEscape(prefix + '.') : '';
    this._blobFilename = path.join(directory, name + 'BLOB');
    this._mapFilename = path.join(directory, name + 'MAP');
    this._lockFilename = path.join(directory, name + 'LOCK');
    this._directory = directory;
    this._load();
  }

  has(key, invalidationKey) {
    return hasOwnProperty.call(this._memoryBlobs, key)
      ? this._invalidationKeys[key] === invalidationKey
      : hasOwnProperty.call(this._storedMap, key) && this._storedMap[key][0] === invalidationKey;
  }

  get(key, invalidationKey) {
    if (hasOwnProperty.call(this._memoryBlobs, key)) {
      if (this._invalidationKeys[key] === invalidationKey) return this._memoryBlobs[key];
    } else if (hasOwnProperty.call(this._storedMap, key)) {
      var mapping = this._storedMap[key];
      if (mapping[0] === invalidationKey) return this._storedBlob.slice(mapping[1], mapping[2]);
    }
  }

  set(key, invalidationKey, buffer) {
    this._invalidationKeys[key] = invalidationKey;
    this._memoryBlobs[key] = buffer;
    this._dirty = true;
  }

  delete(key) {
    if (hasOwnProperty.call(this._memoryBlobs, key)) {
      this._dirty = true;
      delete this._memoryBlobs[key];
    }
    if (hasOwnProperty.call(this._invalidationKeys, key)) {
      this._dirty = true;
      delete this._invalidationKeys[key];
    }
    if (hasOwnProperty.call(this._storedMap, key)) {
      this._dirty = true;
      delete this._storedMap[key];
    }
  }

  isDirty() {
    return this._dirty;
  }

  save() {
    var dump = this._getDump(),
      blobToStore = Buffer.concat(dump[0]),
      mapToStore = JSON.stringify(dump[1]);

    try {
      mkdirpSync(this._directory);
      fs.writeFileSync(this._lockFilename, 'LOCK', {flag: 'wx'});
    } catch (__) {
      return false;
    }

    try {
      fs.writeFileSync(this._blobFilename, blobToStore);
      fs.writeFileSync(this._mapFilename, mapToStore);
    } finally {
      fs.unlinkSync(this._lockFilename);
    }

    return true;
  }

  _load() {
    try {
      this._storedBlob = fs.readFileSync(this._blobFilename);
      this._storedMap = JSON.parse(fs.readFileSync(this._mapFilename, 'utf8'));
    } catch (e) {
      this._storedBlob = Buffer.alloc(0);
      this._storedMap = {};
    }
    this._dirty = false;
    this._memoryBlobs = {};
    this._invalidationKeys = {};
  }

  _getDump() {
    var buffers = [],
      newMap = {},
      offset = 0;

    function push(key, invalidationKey, buffer) {
      buffers.push(buffer);
      newMap[key] = [invalidationKey, offset, offset + buffer.length];
      offset += buffer.length;
    }

    for (var key1 of Object.keys(this._memoryBlobs)) {
      var buffer1 = this._memoryBlobs[key1];
      push(key1, this._invalidationKeys[key1], buffer1);
    }

    for (var key of Object.keys(this._storedMap))
      if (!hasOwnProperty.call(newMap, key)) {
        var mapping = this._storedMap[key],
          buffer = this._storedBlob.slice(mapping[1], mapping[2]);
        push(key, mapping[0], buffer);
      }

    return [buffers, newMap];
  }
}

class NativeCompileCache {
  constructor() {
    this._cacheStore = null;
    this._previousModuleCompile = null;
  }

  setCacheStore(cacheStore) {
    this._cacheStore = cacheStore;
  }

  install() {
    var self = this,
      hasRequireResolvePaths = 'function' == typeof require.resolve.paths;
    this._previousModuleCompile = Module.prototype._compile;
    Module.prototype._compile = function(content, filename) {
      var mod = this;

      function require(id) {
        return mod.require(id);
      }

      function resolve(request, options) {
        return Module._resolveFilename(request, mod, false, options);
      }
      require.resolve = resolve;

      hasRequireResolvePaths &&
        (resolve.paths = (request) => Module._resolveLookupPaths(request, mod, true));

      require.main = process.mainModule;

      require.extensions = Module._extensions;
      require.cache = Module._cache;

      var dirname = path.dirname(filename),
        compiledWrapper = self._moduleCompile(filename, content),

        args = [mod.exports, require, mod, filename, dirname, process, global, Buffer];
      return compiledWrapper.apply(mod.exports, args);
    };
  }

  uninstall() {
    Module.prototype._compile = this._previousModuleCompile;
  }

  _moduleCompile(filename, content) {
    var contLen = content.length;
    if (contLen >= 2 && 35 === content.charCodeAt(0) && 33 === content.charCodeAt(1))
      if (2 === contLen) content = '';
      else {
        for (var i = 2; i < contLen; ++i) {
          var code = content.charCodeAt(i);
          if (10 === code || 13 === code) break;
        }
        content = i === contLen ? '' : content.slice(i);
      }

    var wrapper = Module.wrap(content),
      invalidationKey = crypto.createHash('sha1').update(content, 'utf8').digest('hex'),

      buffer = this._cacheStore.get(filename, invalidationKey);

    var script = new vm.Script(wrapper, {
      filename,
      lineOffset: 0,
      displayErrors: true,
      cachedData: buffer,
      produceCachedData: true,
    });

    script.cachedDataProduced
      ? this._cacheStore.set(filename, invalidationKey, script.cachedData)
      : script.cachedDataRejected && this._cacheStore.delete(filename);

    return script.runInThisContext({
      filename,
      lineOffset: 0,
      columnOffset: 0,
      displayErrors: true,
    });
  }
}

function slashEscape(str) {
  var ESCAPE_LOOKUP = {'\\': 'zB', ':': 'zC', '/': 'zS', '\0': 'z0', z: 'zZ'};
  return str.replace(/[\\:/\x00z]/g, (match) => ESCAPE_LOOKUP[match]);
}

function supportsCachedData() {
  return true === new vm.Script('""', {produceCachedData: true}).cachedDataProduced;
}

function getCacheDir() {
  var v8_compile_cache_cache_dir = process.env.V8_COMPILE_CACHE_CACHE_DIR;
  if (v8_compile_cache_cache_dir) return v8_compile_cache_cache_dir;

  var dirname = 'function' == typeof process.getuid
    ? 'v8-compile-cache-' + process.getuid()
    : 'v8-compile-cache';
  var version = 'string' == typeof process.versions.v8
    ? process.versions.v8
    : 'string' == typeof process.versions.chakracore
      ? 'chakracore-' + process.versions.chakracore
      : 'node-' + process.version;
  return path.join(os.tmpdir(), dirname, version);
}

function getMainName() {
  return require.main && 'string' == typeof require.main.filename
    ? require.main.filename
    : process.cwd();
}

if (!process.env.DISABLE_V8_COMPILE_CACHE && supportsCachedData()) {
  var cacheDir = getCacheDir(),
    prefix = getMainName(),
    blobStore = new FileSystemBlobStore(cacheDir, prefix),

    nativeCompileCache = new NativeCompileCache();
  nativeCompileCache.setCacheStore(blobStore);
  nativeCompileCache.install();

  process.once('exit', () => {
    blobStore.isDirty() && blobStore.save();
    nativeCompileCache.uninstall();
  });
}

module.exports.__TEST__ = {
  FileSystemBlobStore,
  NativeCompileCache,
  slashEscape,
  supportsCachedData,
  getCacheDir,
  getMainName,
};
