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

  re = (exports.re = []),
  src = (exports.src = []),
  /** @type {Object.<string, number>} */
  t = (exports.tokens = {}),
  R = 0;

function tok(n) {
  t[n] = R++;
}

tok('NUMERICIDENTIFIER');
src[t.NUMERICIDENTIFIER] = '0|[1-9]\\d*';
tok('NUMERICIDENTIFIERLOOSE');
src[t.NUMERICIDENTIFIERLOOSE] = '[0-9]+';

tok('NONNUMERICIDENTIFIER');
src[t.NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';

tok('MAINVERSION');
src[t.MAINVERSION] = `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`;

tok('MAINVERSIONLOOSE');
src[t.MAINVERSIONLOOSE] =
  `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`;

tok('PRERELEASEIDENTIFIER');
src[t.PRERELEASEIDENTIFIER] = `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`;

tok('PRERELEASEIDENTIFIERLOOSE');
src[t.PRERELEASEIDENTIFIERLOOSE] = `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`;

tok('PRERELEASE');
src[t.PRERELEASE] = `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`;

tok('PRERELEASELOOSE');
src[t.PRERELEASELOOSE] = `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`;

tok('BUILDIDENTIFIER');
src[t.BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

tok('BUILD');
src[t.BUILD] = `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`;

tok('FULL');
tok('FULLPLAIN');
src[t.FULLPLAIN] = `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`;

src[t.FULL] = `^${src[t.FULLPLAIN]}$`;

tok('LOOSEPLAIN');
src[t.LOOSEPLAIN] = `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`;

tok('LOOSE');
src[t.LOOSE] = `^${src[t.LOOSEPLAIN]}$`;

tok('GTLT');
src[t.GTLT] = '((?:<|>)?=?)';

tok('XRANGEIDENTIFIERLOOSE');
src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
tok('XRANGEIDENTIFIER');
src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + '|x|X|\\*';

tok('XRANGEPLAIN');
src[t.XRANGEPLAIN] = `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${
  src[t.XRANGEIDENTIFIER]
})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`;

tok('XRANGEPLAINLOOSE');
src[t.XRANGEPLAINLOOSE] = `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${
  src[t.XRANGEIDENTIFIERLOOSE]
})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`;

tok('XRANGE');
src[t.XRANGE] = `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`;
tok('XRANGELOOSE');
src[t.XRANGELOOSE] = `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`;

tok('COERCE');
src[t.COERCE] = `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${
  MAX_SAFE_COMPONENT_LENGTH
}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:$|[^\\d])`;

tok('COERCERTL');
re[t.COERCERTL] = new RegExp(src[t.COERCE], 'g');

tok('LONETILDE');
src[t.LONETILDE] = '(?:~>?)';

tok('TILDETRIM');
src[t.TILDETRIM] = `(\\s*)${src[t.LONETILDE]}\\s+`;
re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

tok('TILDE');
src[t.TILDE] = `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`;
tok('TILDELOOSE');
src[t.TILDELOOSE] = `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`;

tok('LONECARET');
src[t.LONECARET] = '(?:\\^)';

tok('CARETTRIM');
src[t.CARETTRIM] = `(\\s*)${src[t.LONECARET]}\\s+`;
re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], 'g');
var caretTrimReplace = '$1^';

tok('CARET');
src[t.CARET] = `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`;
tok('CARETLOOSE');
src[t.CARETLOOSE] = `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`;

tok('COMPARATORLOOSE');
src[t.COMPARATORLOOSE] = `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`;
tok('COMPARATOR');
src[t.COMPARATOR] = `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`;

tok('COMPARATORTRIM');
src[t.COMPARATORTRIM] = `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`;

re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';

tok('HYPHENRANGE');
src[t.HYPHENRANGE] = `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`;

tok('HYPHENRANGELOOSE');
src[t.HYPHENRANGELOOSE] = `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`;

tok('STAR');
src[t.STAR] = '(<|>)?=?\\s*\\*';

for (var i = 0; i < R; i++) {
  debug(i, src[i]);
  re[i] || (re[i] = new RegExp(src[i]));
}

exports.parse = parse;
function parse(version, options) {
  (options && 'object' == typeof options) || (options = { loose: !!options, includePrerelease: false });

  if (version instanceof SemVer) return version;
  if ('string' != typeof version) return null;
  if (version.length > MAX_LENGTH) return null;

  if (!(options.loose ? re[t.LOOSE] : re[t.FULL]).test(version)) return null;

  try {
    return new SemVer(version, options);
  } catch (er) {
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

  var m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
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

  var i = 0;
  do {
    var a = this.prerelease[i],
      b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  } while (++i);
};

SemVer.prototype.compareBuild = function(other) {
  other instanceof SemVer || (other = new SemVer(other, this.options));

  var i = 0;
  do {
    var a = this.build[i],
      b = other.build[i];
    debug('prerelease compare', i, a, b);
    if (void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  } while (++i);
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
  } catch (er) {
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
  var r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR],
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
    } catch (er) {
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
  var hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
  debug('comparator trim', range, re[t.COMPARATORTRIM]);

  range = range.replace(re[t.TILDETRIM], tildeTrimReplace)
    .replace(re[t.CARETTRIM], caretTrimReplace)
    .split(/\s+/).join(' ');

  var compRe = loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR],
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
  var r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
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
  var r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
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
  var r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
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
  return comp.trim().replace(re[t.STAR], '');
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
    } catch (er) {
      return false;
    }

  for (var i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
  return false;
};

function testSet(set, version, options) {
  for (var i = 0; i < set.length; i++) if (!set[i].test(version)) return false;

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
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, options) {
  var max = null,
    maxSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
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
    minSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
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
  } catch (er) {
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

    comparators.forEach(function(comparator) {
      comparator.semver === ANY && (comparator = new Comparator('>=0.0.0'));
      high = high || comparator;
      low = low || comparator;
      gtfn(comparator.semver, high.semver, options)
        ? (high = comparator)
        : ltfn(comparator.semver, low.semver, options) && (low = comparator);
    });

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
  if (!(options = options || {}).rtl) match = version.match(re[t.COERCE]);
  else {
    for (
      var next;
      (next = re[t.COERCERTL].exec(version)) && (!match || match.index + match[0].length !== version.length);
    ) {
      (match && next.index + next[0].length === match.index + match[0].length) || (match = next);
      re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
    }
    re[t.COERCERTL].lastIndex = -1;
  }

  return null === match ? null : parse(match[2] + '.' + (match[3] || '0') + '.' + (match[4] || '0'), options);
}
