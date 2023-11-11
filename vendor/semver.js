exports = module.exports = SemVer;

var debug = /\bsemver\b/i.test(process && process.env && process.env.NODE_DEBUG)
? function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('SEMVER');
    console.log.apply(console, args);
  }
: function() {};

exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256,
  MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991,
  MAX_SAFE_COMPONENT_LENGTH = 16,

  /** @type {Object.<string, RegExp>} */
  re = (exports.re = {}),
  src = (exports.src = {});

src.NUMERICIDENTIFIER = '0|[1-9]\\d*';
src.NUMERICIDENTIFIERLOOSE = '[0-9]+';

src.NONNUMERICIDENTIFIER = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';

src.MAINVERSION = `(${src.NUMERICIDENTIFIER})\\.(${src.NUMERICIDENTIFIER})\\.(${src.NUMERICIDENTIFIER})`;
src.MAINVERSIONLOOSE = `(${src.NUMERICIDENTIFIERLOOSE})\\.(${src.NUMERICIDENTIFIERLOOSE})\\.(${src.NUMERICIDENTIFIERLOOSE})`;

src.PRERELEASEIDENTIFIER = `(?:${src.NUMERICIDENTIFIER}|${src.NONNUMERICIDENTIFIER})`;
src.PRERELEASEIDENTIFIERLOOSE = `(?:${src.NUMERICIDENTIFIERLOOSE}|${src.NONNUMERICIDENTIFIER})`;

src.PRERELEASE = `(?:-(${src.PRERELEASEIDENTIFIER}(?:\\.${src.PRERELEASEIDENTIFIER})*))`;
src.PRERELEASELOOSE = `(?:-?(${src.PRERELEASEIDENTIFIERLOOSE}(?:\\.${src.PRERELEASEIDENTIFIERLOOSE})*))`;

src.BUILDIDENTIFIER = '[0-9A-Za-z-]+';
src.BUILD = `(?:\\+(${src.BUILDIDENTIFIER}(?:\\.${src.BUILDIDENTIFIER})*))`;

src.FULLPLAIN = `v?${src.MAINVERSION}${src.PRERELEASE}?${src.BUILD}?`;
src.FULL = `^${src.FULLPLAIN}$`;

src.LOOSEPLAIN = `[v=\\s]*${src.MAINVERSIONLOOSE}${src.PRERELEASELOOSE}?${src.BUILD}?`;
src.LOOSE = `^${src.LOOSEPLAIN}$`;

src.GTLT = '((?:<|>)?=?)';

src.XRANGEIDENTIFIERLOOSE = src.NUMERICIDENTIFIERLOOSE + '|x|X|\\*';
src.XRANGEIDENTIFIER = src.NUMERICIDENTIFIER + '|x|X|\\*';

src.XRANGEPLAIN = `[v=\\s]*(${src.XRANGEIDENTIFIER})(?:\\.(${src.XRANGEIDENTIFIER})(?:\\.(${src.XRANGEIDENTIFIER})(?:${src.PRERELEASE})?${src.BUILD}?)?)?`;
src.XRANGEPLAINLOOSE = `[v=\\s]*(${src.XRANGEIDENTIFIERLOOSE})(?:\\.(${src.XRANGEIDENTIFIERLOOSE})(?:\\.(${src.XRANGEIDENTIFIERLOOSE})(?:${src.PRERELEASELOOSE})?${src.BUILD}?)?)?`;

src.XRANGE = `^${src.GTLT}\\s*${src.XRANGEPLAIN}$`;
src.XRANGELOOSE = `^${src.GTLT}\\s*${src.XRANGEPLAINLOOSE}$`;

src.COERCE = `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:$|[^\\d])`;

re.COERCERTL = new RegExp(src.COERCE, 'g');

src.LONETILDE = '(?:~>?)';

src.TILDETRIM = `(\\s*)${src.LONETILDE}\\s+`;
re.TILDETRIM = new RegExp(src.TILDETRIM, 'g');
var tildeTrimReplace = '$1~';

src.TILDE = `^${src.LONETILDE}${src.XRANGEPLAIN}$`;
src.TILDELOOSE = `^${src.LONETILDE}${src.XRANGEPLAINLOOSE}$`;

src.LONECARET = '(?:\\^)';

src.CARETTRIM = `(\\s*)${src.LONECARET}\\s+`;
re.CARETTRIM = new RegExp(src.CARETTRIM, 'g');
var caretTrimReplace = '$1^';

src.CARET = `^${src.LONECARET}${src.XRANGEPLAIN}$`;
src.CARETLOOSE = `^${src.LONECARET}${src.XRANGEPLAINLOOSE}$`;

src.COMPARATORLOOSE = `^${src.GTLT}\\s*(${src.LOOSEPLAIN})$|^$`;
src.COMPARATOR = `^${src.GTLT}\\s*(${src.FULLPLAIN})$|^$`;

src.COMPARATORTRIM = `(\\s*)${src.GTLT}\\s*(${src.LOOSEPLAIN}|${src.XRANGEPLAIN})`;
re.COMPARATORTRIM = new RegExp(src.COMPARATORTRIM, 'g');
var comparatorTrimReplace = '$1$2$3';

src.HYPHENRANGE = `^\\s*(${src.XRANGEPLAIN})\\s+-\\s+(${src.XRANGEPLAIN})\\s*$`;
src.HYPHENRANGELOOSE = `^\\s*(${src.XRANGEPLAINLOOSE})\\s+-\\s+(${src.XRANGEPLAINLOOSE})\\s*$`;

src.STAR = '(<|>)?=?\\s*\\*';

Object.keys(src).forEach((i, j) => {
  debug(j, i, src[i]);
  re[i] || (re[i] = new RegExp(src[i]));
});

exports.parse = parse;
function parse(version, options) {
  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });

  if (version instanceof SemVer) return version;
  if ('string' != typeof version) return null;
  if (version.length > MAX_LENGTH) return null;

  if (!(options.loose ? re.LOOSE : re.FULL).test(version)) return null;

  try {
    return new SemVer(version, options);
  } catch (_) {
    return null;
  }
}

exports.valid = valid;
function valid(version, options) {
  var v = parse(version, options);
  return v ? v.version : null;
}
exports.clean = clean;
function clean(version, options) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, options) {
  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });
  if (version instanceof SemVer) {
    if (version.loose === options.loose) return version;
    version = version.version;
  } else if ('string' != typeof version) throw new TypeError('Invalid Version: ' + version);

  if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);

  if (!(this instanceof SemVer)) return new SemVer(version, options);

  debug('SemVer', version, options);
  this.options = options;
  this.loose = !!options.loose;

  var m = version.trim().match(options.loose ? re.LOOSE : re.FULL);
  if (!m) throw new TypeError('Invalid Version: ' + version);

  this.raw = version;
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError('Invalid major version');
  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError('Invalid minor version');
  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError('Invalid patch version');

  this.prerelease = !m[4]
  ? []
  : m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
      }
      return id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  this.prerelease.length && (this.version += '-' + this.prerelease.join('.'));
  return this.version;
};
SemVer.prototype.toString = function() {
  return this.version;
};
SemVer.prototype.compare = function(other) {
  debug('SemVer.compare', this.version, this.options, other);
  other instanceof SemVer || (other = new SemVer(other, this.options));

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  other instanceof SemVer || (other = new SemVer(other, this.options));

  return (
    compareIdentifiers(this.major, other.major) ||
    compareIdentifiers(this.minor, other.minor) ||
    compareIdentifiers(this.patch, other.patch)
  );
};

SemVer.prototype.comparePre = function(other) {
  other instanceof SemVer || (other = new SemVer(other, this.options));

  if (this.prerelease.length && !other.prerelease.length) return -1;
  if (!this.prerelease.length && other.prerelease.length) return 1;
  if (!this.prerelease.length && !other.prerelease.length) return 0;

  for (var i = 0; ; i++) {
    var a = this.prerelease[i],
      b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  }
};

SemVer.prototype.compareBuild = function(other) {
  other instanceof SemVer || (other = new SemVer(other, this.options));

  for (var i = 0; ; i++) {
    var a = this.build[i],
      b = other.build[i];
    debug('prerelease compare', i, a, b);
    if (void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  }
};

SemVer.prototype.inc = function(release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break;
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break;
    case 'prepatch':
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;
    case 'prerelease':
      0 === this.prerelease.length && this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;

    case 'major':
      (0 === this.minor && 0 === this.patch && 0 !== this.prerelease.length) || this.major++;
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'minor':
      (0 === this.patch && 0 !== this.prerelease.length) || this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      0 === this.prerelease.length && this.patch++;
      this.prerelease = [];
      break;
    case 'pre':
      if (0 === this.prerelease.length) this.prerelease = [0];
      else {
        for (var i = this.prerelease.length; --i >= 0; )
          if ('number' == typeof this.prerelease[i]) {
            this.prerelease[i]++;
            i = -2;
          }
        -1 === i && this.prerelease.push(0);
      }
      identifier &&
        (this.prerelease[0] === identifier
          ? isNaN(this.prerelease[1]) && (this.prerelease = [identifier, 0])
          : (this.prerelease = [identifier, 0]));
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  this.raw = this.version;
  return this;
};

exports.inc = inc;
function inc(version, release, loose, identifier) {
  if ('string' == typeof loose) {
    identifier = loose;
    loose = void 0;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (_) {
    return null;
  }
}

exports.diff = diff;
function diff(version1, version2) {
  if (eq(version1, version2)) return null;
  var v1 = parse(version1),
    v2 = parse(version2),
    prefix = '';
  if (v1.prerelease.length || v2.prerelease.length) {
    prefix = 'pre';
    var defaultResult = 'prerelease';
  }
  for (var key in v1)
    if (('major' === key || 'minor' === key || 'patch' === key) && v1[key] !== v2[key]) return prefix + key;
  return defaultResult;
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a),
    bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}
exports.major = major;
function major(a, loose) {
  return new SemVer(a, loose).major;
}
exports.minor = minor;
function minor(a, loose) {
  return new SemVer(a, loose).minor;
}
exports.patch = patch;
function patch(a, loose) {
  return new SemVer(a, loose).patch;
}
exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose));
}
exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}
exports.compareBuild = compareBuild;
function compareBuild(a, b, loose) {
  var versionA = new SemVer(a, loose),
    versionB = new SemVer(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB);
}
exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}
exports.sort = sort;
function sort(list, loose) {
  return list.sort((a, b) => compareBuild(a, b, loose));
}
exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort((a, b) => compareBuild(b, a, loose));
}
exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}
exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}
exports.eq = eq;
function eq(a, b, loose) {
  return 0 === compare(a, b, loose);
}
exports.neq = neq;
function neq(a, b, loose) {
  return 0 !== compare(a, b, loose);
}
exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}
exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  switch (op) {
    case '===':
      'object' == typeof a && (a = a.version);
      'object' == typeof b && (b = b.version);
      return a === b;
    case '!==':
      'object' == typeof a && (a = a.version);
      'object' == typeof b && (b = b.version);
      return a !== b;

    case '':
    case '=':
    case '==':
      return eq(a, b, loose);
    case '!=':
      return neq(a, b, loose);
    case '>':
      return gt(a, b, loose);
    case '>=':
      return gte(a, b, loose);
    case '<':
      return lt(a, b, loose);
    case '<=':
      return lte(a, b, loose);

    default:
      throw new TypeError('Invalid operator: ' + op);
  }
}

exports.Comparator = Comparator;
function Comparator(comp, options) {
  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });

  if (comp instanceof Comparator) {
    if (comp.loose === !!options.loose) return comp;
    comp = comp.value;
  }

  if (!(this instanceof Comparator)) return new Comparator(comp, options);

  debug('comparator', comp, options);
  this.options = options;
  this.loose = !!options.loose;
  this.parse(comp);

  this.value = this.semver === ANY ? '' : this.operator + this.semver.version;

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.options.loose ? re.COMPARATORLOOSE : re.COMPARATOR,
    m = comp.match(r);

  if (!m) throw new TypeError('Invalid comparator: ' + comp);

  this.operator = void 0 !== m[1] ? m[1] : '';
  '=' === this.operator && (this.operator = '');

  this.semver = !m[2] ? ANY : new SemVer(m[2], this.options.loose);
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  debug('Comparator.test', version, this.options.loose);

  if (this.semver === ANY || version === ANY) return true;

  if ('string' == typeof version)
    try {
      version = new SemVer(version, this.options);
    } catch (_) {
      return false;
    }

  return cmp(version, this.operator, this.semver, this.options);
};

Comparator.prototype.intersects = function(comp, options) {
  if (!(comp instanceof Comparator)) throw new TypeError('a Comparator is required');

  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });

  var rangeTmp;
  if ('' === this.operator) {
    if ('' === this.value) return true;
    rangeTmp = new Range(comp.value, options);
    return satisfies(this.value, rangeTmp, options);
  }
  if ('' === comp.operator) {
    if ('' === comp.value) return true;
    rangeTmp = new Range(this.value, options);
    return satisfies(comp.semver, rangeTmp, options);
  }

  var sameDirectionIncreasing =
    ('>=' === this.operator || '>' === this.operator) &&
    ('>=' === comp.operator || '>' === comp.operator);
  var sameDirectionDecreasing =
    ('<=' === this.operator || '<' === this.operator) &&
    ('<=' === comp.operator || '<' === comp.operator);
  var sameSemVer = this.semver.version === comp.semver.version;
  var differentDirectionsInclusive =
    ('>=' === this.operator || '<=' === this.operator) &&
    ('>=' === comp.operator || '<=' === comp.operator);
  var oppositeDirectionsLessThan =
    cmp(this.semver, '<', comp.semver, options) &&
    ('>=' === this.operator || '>' === this.operator) &&
    ('<=' === comp.operator || '<' === comp.operator);
  var oppositeDirectionsGreaterThan =
    cmp(this.semver, '>', comp.semver, options) &&
    ('<=' === this.operator || '<' === this.operator) &&
    ('>=' === comp.operator || '>' === comp.operator);

  return (
    sameDirectionIncreasing ||
    sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan ||
    oppositeDirectionsGreaterThan
  );
};

exports.Range = Range;
function Range(range, options) {
  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });

  if (range instanceof Range)
    return range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease
      ? range
      : new Range(range.raw, options);

  if (range instanceof Comparator) return new Range(range.value, options);
  if (!(this instanceof Range)) return new Range(range, options);

  this.options = options;
  this.loose = !!options.loose;
  this.includePrerelease = !!options.includePrerelease;

  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map((range) => this.parseRange(range.trim())).filter((c) => c.length);

  if (!this.set.length) throw new TypeError('Invalid SemVer Range: ' + range);

  this.format();
}

Range.prototype.format = function() {
  this.range = this.set.map((comps) => comps.join(' ').trim()).join('||').trim();
  return this.range;
};
Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.options.loose;
  range = range.trim();
  var hr = loose ? re.HYPHENRANGELOOSE : re.HYPHENRANGE;
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  range = range.replace(re.COMPARATORTRIM, comparatorTrimReplace);
  debug('comparator trim', range, re.COMPARATORTRIM);

  range = range.replace(re.TILDETRIM, tildeTrimReplace)
    .replace(re.CARETTRIM, caretTrimReplace)
    .split(/\s+/).join(' ');

  var compRe = loose ? re.COMPARATORLOOSE : re.COMPARATOR,
    set = range.split(' ').map((comp) => parseComparator(comp, this.options)).join(' ').split(/\s+/);
  this.options.loose && (set = set.filter((comp) => !!comp.match(compRe)));

  return set.map((comp) => new Comparator(comp, this.options));
};

Range.prototype.intersects = function(range, options) {
  if (!(range instanceof Range)) throw new TypeError('a Range is required');

  return this.set.some(function(thisComparators) {
    return (
      isSatisfiable(thisComparators, options) &&
      range.set.some(function(rangeComparators) {
        return (
          isSatisfiable(rangeComparators, options) &&
          thisComparators.every(function(thisComparator) {
            return rangeComparators.every((rangeComparator) => thisComparator.intersects(rangeComparator, options));
          })
        );
      })
    );
  });
};

function isSatisfiable(comparators, options) {
  for (
    var result = true, remainingComparators = comparators.slice(), testComparator = remainingComparators.pop();
    result && remainingComparators.length;
  ) {
    result = remainingComparators.every((otherComparator) => testComparator.intersects(otherComparator, options));

    testComparator = remainingComparators.pop();
  }

  return result;
}

exports.toComparators = toComparators;
function toComparators(range, options) {
  return new Range(range, options).set.map(function(comp) {
    return comp.map((c) => c.value).join(' ').trim().split(' ');
  });
}

function parseComparator(comp, options) {
  debug('comp', comp, options);
  comp = replaceCarets(comp, options);
  debug('caret', comp);
  comp = replaceTildes(comp, options);
  debug('tildes', comp);
  comp = replaceXRanges(comp, options);
  debug('xrange', comp);
  comp = replaceStars(comp, options);
  debug('stars', comp);
  return comp;
}

function isX(id) {
  return !id || 'x' === id.toLowerCase() || '*' === id;
}

function replaceTildes(comp, options) {
  return comp.trim().split(/\s+/).map((comp) => replaceTilde(comp, options)).join(' ');
}

function replaceTilde(comp, options) {
  var r = options.loose ? re.TILDELOOSE : re.TILDE;
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) ret = '';
    else if (isX(m)) ret = `>=${M}.0.0 <${+M + 1}.0.0`;
    else if (isX(p)) ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0`;
    else if (pr) {
      debug('replaceTilde pr', pr);
      ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0`;
    } else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0`;

    debug('tilde return', ret);
    return ret;
  });
}

function replaceCarets(comp, options) {
  return comp.trim().split(/\s+/).map((comp) => replaceCaret(comp, options)).join(' ');
}

function replaceCaret(comp, options) {
  debug('caret', comp, options);
  var r = options.loose ? re.CARETLOOSE : re.CARET;
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) ret = '';
    else if (isX(m)) ret = `>=${M}.0.0 <${+M + 1}.0.0`;
    else if (isX(p)) ret = '0' === M ? `>=${M}.${m}.0 <${M}.${+m + 1}.0` : `>=${M}.${m}.0 <${+M + 1}.0.0`;
    else if (pr) {
      debug('replaceCaret pr', pr);
      ret = '0' === M
        ? '0' === m
          ? `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}`
          : `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0`
        : `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0`;
    } else {
      debug('no pr');
      ret = '0' === M
        ? '0' === m
          ? `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}`
          : `>=${M}.${m}.${p} <${M}.${+m + 1}.0`
        : `>=${M}.${m}.${p} <${+M + 1}.0.0`;
    }

    debug('caret return', ret);
    return ret;
  });
}

function replaceXRanges(comp, options) {
  debug('replaceXRanges', comp, options);
  return comp.split(/\s+/).map((comp) => replaceXRange(comp, options)).join(' ');
}

function replaceXRange(comp, options) {
  comp = comp.trim();
  var r = options.loose ? re.XRANGELOOSE : re.XRANGE;
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M),
      xm = xM || isX(m),
      xp = xm || isX(p),
      anyX = xp;

    '=' === gtlt && anyX && (gtlt = '');

    pr = options.includePrerelease ? '-0' : '';

    if (xM) ret = '>' === gtlt || '<' === gtlt ? '<0.0.0-0' : '*';
    else if (gtlt && anyX) {
      xm && (m = 0);
      p = 0;

      if ('>' === gtlt) {
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if ('<=' === gtlt) {
        gtlt = '<';
        xm ? (M = +M + 1) : (m = +m + 1);
      }

      ret = gtlt + M + `.${m}.` + p + pr;
    } else
      xm ? (ret = `>=${M}.0.0${pr} <${+M + 1}.0.0${pr}`) : xp && (ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0${pr}`);

    debug('xRange return', ret);

    return ret;
  });
}

function replaceStars(comp, options) {
  debug('replaceStars', comp, options);
  return comp.trim().replace(re.STAR, '');
}

function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
  from = isX(fM) ? '' : isX(fm) ? `>=${fM}.0.0` : isX(fp) ? `>=${fM}.${fm}.0` : '>=' + from;

  to = isX(tM)
    ? ''
    : isX(tm)
    ? `<${+tM + 1}.0.0`
    : isX(tp)
    ? `<${tM}.${+tm + 1}.0`
    : tpr
    ? `<=${tM}.${tm}.${tp}-${tpr}`
    : '<=' + to;

  return (from + ' ' + to).trim();
}

Range.prototype.test = function(version) {
  if (!version) return false;

  if ('string' == typeof version)
    try {
      version = new SemVer(version, this.options);
    } catch (_) {
      return false;
    }

  for (var i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
  return false;
};

function testSet(set, version, options) {
  var i;
  for (i = 0; i < set.length; i++) if (!set[i].test(version)) return false;

  if (version.prerelease.length && !options.includePrerelease) {
    for (i = 0; i < set.length; i++) {
      debug(set[i].semver);
      if (set[i].semver !== ANY && set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch)
          return true;
      }
    }

    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, options) {
  try {
    range = new Range(range, options);
  } catch (_) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, options) {
  var max = null,
    maxSV = null,
    rangeObj;
  try {
    rangeObj = new Range(range, options);
  } catch (_) {
    return null;
  }
  versions.forEach(function(v) {
    rangeObj.test(v) && (!max || maxSV.compare(v) < 0) && (maxSV = new SemVer((max = v), options));
  });
  return max;
}

exports.minSatisfying = minSatisfying;
function minSatisfying(versions, range, options) {
  var min = null,
    minSV = null,
    rangeObj;
  try {
    rangeObj = new Range(range, options);
  } catch (_) {
    return null;
  }
  versions.forEach(function(v) {
    rangeObj.test(v) && ((min && 1 !== minSV.compare(v)) || (minSV = new SemVer((min = v), options)));
  });
  return min;
}

exports.minVersion = minVersion;
function minVersion(range, loose) {
  range = new Range(range, loose);

  var minver = new SemVer('0.0.0');
  if (range.test(minver)) return minver;

  minver = new SemVer('0.0.0-0');
  if (range.test(minver)) return minver;

  minver = null;
  for (var i = 0; i < range.set.length; ++i) {
    range.set[i].forEach(function(comparator) {
      var compver = new SemVer(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          0 === compver.prerelease.length ? compver.patch++ : compver.prerelease.push(0);
          compver.raw = compver.format();
        case '':
        case '>=':
          (minver && !gt(minver, compver)) || (minver = compver);
          break;
        case '<':
        case '<=':
          break;
        default:
          throw new Error('Unexpected operation: ' + comparator.operator);
      }
    });
  }

  return minver && range.test(minver) ? minver : null;
}

exports.validRange = validRange;
function validRange(range, options) {
  try {
    return new Range(range, options).range || '*';
  } catch (_) {
    return null;
  }
}
exports.ltr = ltr;
function ltr(version, range, options) {
  return outside(version, range, '<', options);
}
exports.gtr = gtr;
function gtr(version, range, options) {
  return outside(version, range, '>', options);
}

exports.outside = outside;
function outside(version, range, hilo, options) {
  version = new SemVer(version, options);
  range = new Range(range, options);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  if (satisfies(version, range, options)) return false;

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i],
      high = null,
      low = null;

    for (var comparator of comparators) {
      comparator.semver === ANY && (comparator = new Comparator('>=0.0.0'));

      high = high || comparator;
      low = low || comparator;
      gtfn(comparator.semver, high.semver, options)
        ? (high = comparator)
        : ltfn(comparator.semver, low.semver, options) && (low = comparator);
    }

    if (high.operator === comp || high.operator === ecomp) return false;

    if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return false;
    if (low.operator === ecomp && ltfn(version, low.semver)) return false;
  }
  return true;
}

exports.prerelease = prerelease;
function prerelease(version, options) {
  var parsed = parse(version, options);
  return parsed && parsed.prerelease.length ? parsed.prerelease : null;
}
exports.intersects = intersects;
function intersects(r1, r2, options) {
  r1 = new Range(r1, options);
  r2 = new Range(r2, options);
  return r1.intersects(r2);
}

exports.coerce = coerce;
function coerce(version, options) {
  if (version instanceof SemVer) return version;

  'number' == typeof version && (version = String(version));
  if ('string' != typeof version) return null;

  var match = null;
  if (!(options = options || {}).rtl) match = version.match(re.COERCE);
  else {
    for (
      var next;
      (next = re.COERCERTL.exec(version)) && (!match || match.index + match[0].length !== version.length);
    ) {
      (match && next.index + next[0].length === match.index + match[0].length) || (match = next);
      re.COERCERTL.lastIndex = next.index + next[1].length + next[2].length;
    }
    re.COERCERTL.lastIndex = -1;
  }

  return null === match ? null : parse(`${match[2]}.${match[3] || '0'}.${match[4] || '0'}`, options);
}
