'use strict';

var fs = require('fs'),
  dirname = require('path').dirname;

module.exports = mkdirp.mkdirP = mkdirp.mkdirp = mkdirp;
function mkdirp(path, mode) {
  return mkdirP(path, { recursive: true, mode });
}
mkdirp.sync = (path, mode) => mkdirpSync(path, { recursive: true, mode });

function mkdirP(path, opts) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, opts, (err, made) => {
      if (!err) return resolve(made || path);

      if ('ENOENT' === err.code) {
        var dir = dirname(path);
        if (dir === path) return reject(err);

        'object' != typeof opts || (opts = opts.mode);
        mkdirP(dir, opts).then((d) => {
          mkdirP(path, opts).then((p) => resolve(d || p), reject);
        }, reject);
      } else if ('EEXIST' === err.code || 'EISDIR' === err.code || 'EROFS' === err.code)
        fs.stat(path, (e, stat) => (!e && stat.isDirectory() ? resolve() : reject(err)));
      else reject(err);
    });
  });
}

function mkdirpSync(path, opts) {
  try {
    return fs.mkdirSync(path, opts) || path;
  } catch (err) {
    if ('ENOENT' === err.code) {
      var dir = dirname(path);
      if (dir === path) throw err;

      'object' != typeof opts || (opts = opts.mode);
      var d = mkdirpSync(dir, opts),
        p = mkdirpSync(path, opts);
      return d || p;
    }

    if ('EEXIST' === err.code || 'EISDIR' === err.code || 'EROFS' === err.code)
      try {
        if (fs.statSync(path).isDirectory()) return;
      } catch (_) {}
    throw err;
  }
}
