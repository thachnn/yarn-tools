var debug;

exports = module.exports = SemVer, debug = "object" == typeof process && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? function() {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift("SEMVER"), console.log.apply(console, args);
} : function() {}, exports.SEMVER_SPEC_VERSION = "2.0.0";

var MAX_LENGTH = 256, MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991, MAX_SAFE_COMPONENT_LENGTH = 16, re = exports.re = [], src = exports.src = [], t = exports.tokens = {}, R = 0;

function tok(n) {
  t[n] = R++;
}

tok("NUMERICIDENTIFIER"), src[t.NUMERICIDENTIFIER] = "0|[1-9]\\d*", tok("NUMERICIDENTIFIERLOOSE"), 
src[t.NUMERICIDENTIFIERLOOSE] = "[0-9]+", tok("NONNUMERICIDENTIFIER"), src[t.NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*", 
tok("MAINVERSION"), src[t.MAINVERSION] = "(" + src[t.NUMERICIDENTIFIER] + ")\\.(" + src[t.NUMERICIDENTIFIER] + ")\\.(" + src[t.NUMERICIDENTIFIER] + ")", 
tok("MAINVERSIONLOOSE"), src[t.MAINVERSIONLOOSE] = "(" + src[t.NUMERICIDENTIFIERLOOSE] + ")\\.(" + src[t.NUMERICIDENTIFIERLOOSE] + ")\\.(" + src[t.NUMERICIDENTIFIERLOOSE] + ")", 
tok("PRERELEASEIDENTIFIER"), src[t.PRERELEASEIDENTIFIER] = "(?:" + src[t.NUMERICIDENTIFIER] + "|" + src[t.NONNUMERICIDENTIFIER] + ")", 
tok("PRERELEASEIDENTIFIERLOOSE"), src[t.PRERELEASEIDENTIFIERLOOSE] = "(?:" + src[t.NUMERICIDENTIFIERLOOSE] + "|" + src[t.NONNUMERICIDENTIFIER] + ")", 
tok("PRERELEASE"), src[t.PRERELEASE] = "(?:-(" + src[t.PRERELEASEIDENTIFIER] + "(?:\\." + src[t.PRERELEASEIDENTIFIER] + ")*))", 
tok("PRERELEASELOOSE"), src[t.PRERELEASELOOSE] = "(?:-?(" + src[t.PRERELEASEIDENTIFIERLOOSE] + "(?:\\." + src[t.PRERELEASEIDENTIFIERLOOSE] + ")*))", 
tok("BUILDIDENTIFIER"), src[t.BUILDIDENTIFIER] = "[0-9A-Za-z-]+", tok("BUILD"), 
src[t.BUILD] = "(?:\\+(" + src[t.BUILDIDENTIFIER] + "(?:\\." + src[t.BUILDIDENTIFIER] + ")*))", 
tok("FULL"), tok("FULLPLAIN"), src[t.FULLPLAIN] = "v?" + src[t.MAINVERSION] + src[t.PRERELEASE] + "?" + src[t.BUILD] + "?", 
src[t.FULL] = "^" + src[t.FULLPLAIN] + "$", tok("LOOSEPLAIN"), src[t.LOOSEPLAIN] = "[v=\\s]*" + src[t.MAINVERSIONLOOSE] + src[t.PRERELEASELOOSE] + "?" + src[t.BUILD] + "?", 
tok("LOOSE"), src[t.LOOSE] = "^" + src[t.LOOSEPLAIN] + "$", tok("GTLT"), src[t.GTLT] = "((?:<|>)?=?)", 
tok("XRANGEIDENTIFIERLOOSE"), src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + "|x|X|\\*", 
tok("XRANGEIDENTIFIER"), src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + "|x|X|\\*", 
tok("XRANGEPLAIN"), src[t.XRANGEPLAIN] = "[v=\\s]*(" + src[t.XRANGEIDENTIFIER] + ")(?:\\.(" + src[t.XRANGEIDENTIFIER] + ")(?:\\.(" + src[t.XRANGEIDENTIFIER] + ")(?:" + src[t.PRERELEASE] + ")?" + src[t.BUILD] + "?)?)?", 
tok("XRANGEPLAINLOOSE"), src[t.XRANGEPLAINLOOSE] = "[v=\\s]*(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:\\.(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:\\.(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:" + src[t.PRERELEASELOOSE] + ")?" + src[t.BUILD] + "?)?)?", 
tok("XRANGE"), src[t.XRANGE] = "^" + src[t.GTLT] + "\\s*" + src[t.XRANGEPLAIN] + "$", 
tok("XRANGELOOSE"), src[t.XRANGELOOSE] = "^" + src[t.GTLT] + "\\s*" + src[t.XRANGEPLAINLOOSE] + "$", 
tok("COERCE"), src[t.COERCE] = "(^|[^\\d])(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "})(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?(?:$|[^\\d])", 
tok("COERCERTL"), re[t.COERCERTL] = new RegExp(src[t.COERCE], "g"), tok("LONETILDE"), 
src[t.LONETILDE] = "(?:~>?)", tok("TILDETRIM"), src[t.TILDETRIM] = "(\\s*)" + src[t.LONETILDE] + "\\s+", 
re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], "g");

var tildeTrimReplace = "$1~";

tok("TILDE"), src[t.TILDE] = "^" + src[t.LONETILDE] + src[t.XRANGEPLAIN] + "$", 
tok("TILDELOOSE"), src[t.TILDELOOSE] = "^" + src[t.LONETILDE] + src[t.XRANGEPLAINLOOSE] + "$", 
tok("LONECARET"), src[t.LONECARET] = "(?:\\^)", tok("CARETTRIM"), src[t.CARETTRIM] = "(\\s*)" + src[t.LONECARET] + "\\s+", 
re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], "g");

var caretTrimReplace = "$1^";

tok("CARET"), src[t.CARET] = "^" + src[t.LONECARET] + src[t.XRANGEPLAIN] + "$", 
tok("CARETLOOSE"), src[t.CARETLOOSE] = "^" + src[t.LONECARET] + src[t.XRANGEPLAINLOOSE] + "$", 
tok("COMPARATORLOOSE"), src[t.COMPARATORLOOSE] = "^" + src[t.GTLT] + "\\s*(" + src[t.LOOSEPLAIN] + ")$|^$", 
tok("COMPARATOR"), src[t.COMPARATOR] = "^" + src[t.GTLT] + "\\s*(" + src[t.FULLPLAIN] + ")$|^$", 
tok("COMPARATORTRIM"), src[t.COMPARATORTRIM] = "(\\s*)" + src[t.GTLT] + "\\s*(" + src[t.LOOSEPLAIN] + "|" + src[t.XRANGEPLAIN] + ")", 
re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], "g");

var comparatorTrimReplace = "$1$2$3";

tok("HYPHENRANGE"), src[t.HYPHENRANGE] = "^\\s*(" + src[t.XRANGEPLAIN] + ")\\s+-\\s+(" + src[t.XRANGEPLAIN] + ")\\s*$", 
tok("HYPHENRANGELOOSE"), src[t.HYPHENRANGELOOSE] = "^\\s*(" + src[t.XRANGEPLAINLOOSE] + ")\\s+-\\s+(" + src[t.XRANGEPLAINLOOSE] + ")\\s*$", 
tok("STAR"), src[t.STAR] = "(<|>)?=?\\s*\\*";

for (var i = 0; i < R; i++) debug(i, src[i]), re[i] || (re[i] = new RegExp(src[i]));

function parse(version, options) {
  if (options && "object" == typeof options || (options = {
    loose: !!options,
    includePrerelease: !1
  }), version instanceof SemVer) return version;
  if ("string" != typeof version) return null;
  if (version.length > MAX_LENGTH) return null;
  if (!(options.loose ? re[t.LOOSE] : re[t.FULL]).test(version)) return null;
  try {
    return new SemVer(version, options);
  } catch (er) {
    return null;
  }
}

function valid(version, options) {
  var v = parse(version, options);
  return v ? v.version : null;
}

function clean(version, options) {
  var s = parse(version.trim().replace(/^[=v]+/, ""), options);
  return s ? s.version : null;
}

function SemVer(version, options) {
  if (options && "object" == typeof options || (options = {
    loose: !!options,
    includePrerelease: !1
  }), version instanceof SemVer) {
    if (version.loose === options.loose) return version;
    version = version.version;
  } else if ("string" != typeof version) throw new TypeError("Invalid Version: " + version);
  if (version.length > MAX_LENGTH) throw new TypeError("version is longer than " + MAX_LENGTH + " characters");
  if (!(this instanceof SemVer)) return new SemVer(version, options);
  debug("SemVer", version, options), this.options = options, this.loose = !!options.loose;
  var m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
  if (!m) throw new TypeError("Invalid Version: " + version);
  if (this.raw = version, this.major = +m[1], this.minor = +m[2], this.patch = +m[3], 
  this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
  m[4] ? this.prerelease = m[4].split(".").map((function(id) {
    if (/^[0-9]+$/.test(id)) {
      var num = +id;
      if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
    }
    return id;
  })) : this.prerelease = [], this.build = m[5] ? m[5].split(".") : [], this.format();
}

function inc(version, release, loose, identifier) {
  "string" == typeof loose && (identifier = loose, loose = void 0);
  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (er) {
    return null;
  }
}

function diff(version1, version2) {
  if (eq(version1, version2)) return null;
  var v1 = parse(version1), v2 = parse(version2), prefix = "";
  if (v1.prerelease.length || v2.prerelease.length) {
    prefix = "pre";
    var defaultResult = "prerelease";
  }
  for (var key in v1) if (("major" === key || "minor" === key || "patch" === key) && v1[key] !== v2[key]) return prefix + key;
  return defaultResult;
}

exports.parse = parse, exports.valid = valid, exports.clean = clean, exports.SemVer = SemVer, 
SemVer.prototype.format = function() {
  return this.version = this.major + "." + this.minor + "." + this.patch, this.prerelease.length && (this.version += "-" + this.prerelease.join(".")), 
  this.version;
}, SemVer.prototype.toString = function() {
  return this.version;
}, SemVer.prototype.compare = function(other) {
  return debug("SemVer.compare", this.version, this.options, other), other instanceof SemVer || (other = new SemVer(other, this.options)), 
  this.compareMain(other) || this.comparePre(other);
}, SemVer.prototype.compareMain = function(other) {
  return other instanceof SemVer || (other = new SemVer(other, this.options)), compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
}, SemVer.prototype.comparePre = function(other) {
  if (other instanceof SemVer || (other = new SemVer(other, this.options)), this.prerelease.length && !other.prerelease.length) return -1;
  if (!this.prerelease.length && other.prerelease.length) return 1;
  if (!this.prerelease.length && !other.prerelease.length) return 0;
  var i = 0;
  do {
    var a = this.prerelease[i], b = other.prerelease[i];
    if (debug("prerelease compare", i, a, b), void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  } while (++i);
}, SemVer.prototype.compareBuild = function(other) {
  other instanceof SemVer || (other = new SemVer(other, this.options));
  var i = 0;
  do {
    var a = this.build[i], b = other.build[i];
    if (debug("prerelease compare", i, a, b), void 0 === a && void 0 === b) return 0;
    if (void 0 === b) return 1;
    if (void 0 === a) return -1;
    if (a !== b) return compareIdentifiers(a, b);
  } while (++i);
}, SemVer.prototype.inc = function(release, identifier) {
  switch (release) {
   case "premajor":
    this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", identifier);
    break;

   case "preminor":
    this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", identifier);
    break;

   case "prepatch":
    this.prerelease.length = 0, this.inc("patch", identifier), this.inc("pre", identifier);
    break;

   case "prerelease":
    0 === this.prerelease.length && this.inc("patch", identifier), this.inc("pre", identifier);
    break;

   case "major":
    0 === this.minor && 0 === this.patch && 0 !== this.prerelease.length || this.major++, 
    this.minor = 0, this.patch = 0, this.prerelease = [];
    break;

   case "minor":
    0 === this.patch && 0 !== this.prerelease.length || this.minor++, this.patch = 0, 
    this.prerelease = [];
    break;

   case "patch":
    0 === this.prerelease.length && this.patch++, this.prerelease = [];
    break;

   case "pre":
    if (0 === this.prerelease.length) this.prerelease = [ 0 ]; else {
      for (var i = this.prerelease.length; --i >= 0; ) "number" == typeof this.prerelease[i] && (this.prerelease[i]++, 
      i = -2);
      -1 === i && this.prerelease.push(0);
    }
    identifier && (this.prerelease[0] === identifier ? isNaN(this.prerelease[1]) && (this.prerelease = [ identifier, 0 ]) : this.prerelease = [ identifier, 0 ]);
    break;

   default:
    throw new Error("invalid increment argument: " + release);
  }
  return this.format(), this.raw = this.version, this;
}, exports.inc = inc, exports.diff = diff, exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;

function compareIdentifiers(a, b) {
  var anum = numeric.test(a), bnum = numeric.test(b);
  return anum && bnum && (a = +a, b = +b), a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
}

function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

function major(a, loose) {
  return new SemVer(a, loose).major;
}

function minor(a, loose) {
  return new SemVer(a, loose).minor;
}

function patch(a, loose) {
  return new SemVer(a, loose).patch;
}

function compare(a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose));
}

function compareLoose(a, b) {
  return compare(a, b, !0);
}

function compareBuild(a, b, loose) {
  var versionA = new SemVer(a, loose), versionB = new SemVer(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB);
}

function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

function sort(list, loose) {
  return list.sort((function(a, b) {
    return exports.compareBuild(a, b, loose);
  }));
}

function rsort(list, loose) {
  return list.sort((function(a, b) {
    return exports.compareBuild(b, a, loose);
  }));
}

function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

function eq(a, b, loose) {
  return 0 === compare(a, b, loose);
}

function neq(a, b, loose) {
  return 0 !== compare(a, b, loose);
}

function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

function cmp(a, op, b, loose) {
  switch (op) {
   case "===":
    return "object" == typeof a && (a = a.version), "object" == typeof b && (b = b.version), 
    a === b;

   case "!==":
    return "object" == typeof a && (a = a.version), "object" == typeof b && (b = b.version), 
    a !== b;

   case "":
   case "=":
   case "==":
    return eq(a, b, loose);

   case "!=":
    return neq(a, b, loose);

   case ">":
    return gt(a, b, loose);

   case ">=":
    return gte(a, b, loose);

   case "<":
    return lt(a, b, loose);

   case "<=":
    return lte(a, b, loose);

   default:
    throw new TypeError("Invalid operator: " + op);
  }
}

function Comparator(comp, options) {
  if (options && "object" == typeof options || (options = {
    loose: !!options,
    includePrerelease: !1
  }), comp instanceof Comparator) {
    if (comp.loose === !!options.loose) return comp;
    comp = comp.value;
  }
  if (!(this instanceof Comparator)) return new Comparator(comp, options);
  debug("comparator", comp, options), this.options = options, this.loose = !!options.loose, 
  this.parse(comp), this.semver === ANY ? this.value = "" : this.value = this.operator + this.semver.version, 
  debug("comp", this);
}

exports.rcompareIdentifiers = rcompareIdentifiers, exports.major = major, exports.minor = minor, 
exports.patch = patch, exports.compare = compare, exports.compareLoose = compareLoose, 
exports.compareBuild = compareBuild, exports.rcompare = rcompare, exports.sort = sort, 
exports.rsort = rsort, exports.gt = gt, exports.lt = lt, exports.eq = eq, exports.neq = neq, 
exports.gte = gte, exports.lte = lte, exports.cmp = cmp, exports.Comparator = Comparator;

var ANY = {};

function Range(range, options) {
  if (options && "object" == typeof options || (options = {
    loose: !!options,
    includePrerelease: !1
  }), range instanceof Range) return range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease ? range : new Range(range.raw, options);
  if (range instanceof Comparator) return new Range(range.value, options);
  if (!(this instanceof Range)) return new Range(range, options);
  if (this.options = options, this.loose = !!options.loose, this.includePrerelease = !!options.includePrerelease, 
  this.raw = range, this.set = range.split(/\s*\|\|\s*/).map((function(range) {
    return this.parseRange(range.trim());
  }), this).filter((function(c) {
    return c.length;
  })), !this.set.length) throw new TypeError("Invalid SemVer Range: " + range);
  this.format();
}

function isSatisfiable(comparators, options) {
  for (var result = !0, remainingComparators = comparators.slice(), testComparator = remainingComparators.pop(); result && remainingComparators.length; ) result = remainingComparators.every((function(otherComparator) {
    return testComparator.intersects(otherComparator, options);
  })), testComparator = remainingComparators.pop();
  return result;
}

function toComparators(range, options) {
  return new Range(range, options).set.map((function(comp) {
    return comp.map((function(c) {
      return c.value;
    })).join(" ").trim().split(" ");
  }));
}

function parseComparator(comp, options) {
  return debug("comp", comp, options), comp = replaceCarets(comp, options), debug("caret", comp), 
  comp = replaceTildes(comp, options), debug("tildes", comp), comp = replaceXRanges(comp, options), 
  debug("xrange", comp), comp = replaceStars(comp, options), debug("stars", comp), 
  comp;
}

function isX(id) {
  return !id || "x" === id.toLowerCase() || "*" === id;
}

function replaceTildes(comp, options) {
  return comp.trim().split(/\s+/).map((function(comp) {
    return replaceTilde(comp, options);
  })).join(" ");
}

function replaceTilde(comp, options) {
  var r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
  return comp.replace(r, (function(_, M, m, p, pr) {
    var ret;
    return debug("tilde", comp, _, M, m, p, pr), isX(M) ? ret = "" : isX(m) ? ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0" : isX(p) ? ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0" : pr ? (debug("replaceTilde pr", pr), 
    ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0") : ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0", 
    debug("tilde return", ret), ret;
  }));
}

function replaceCarets(comp, options) {
  return comp.trim().split(/\s+/).map((function(comp) {
    return replaceCaret(comp, options);
  })).join(" ");
}

function replaceCaret(comp, options) {
  debug("caret", comp, options);
  var r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
  return comp.replace(r, (function(_, M, m, p, pr) {
    var ret;
    return debug("caret", comp, _, M, m, p, pr), isX(M) ? ret = "" : isX(m) ? ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0" : isX(p) ? ret = "0" === M ? ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0" : ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0" : pr ? (debug("replaceCaret pr", pr), 
    ret = "0" === M ? "0" === m ? ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + m + "." + (+p + 1) : ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0" : ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) + ".0.0") : (debug("no pr"), 
    ret = "0" === M ? "0" === m ? ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." + (+p + 1) : ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0" : ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0"), 
    debug("caret return", ret), ret;
  }));
}

function replaceXRanges(comp, options) {
  return debug("replaceXRanges", comp, options), comp.split(/\s+/).map((function(comp) {
    return replaceXRange(comp, options);
  })).join(" ");
}

function replaceXRange(comp, options) {
  comp = comp.trim();
  var r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
  return comp.replace(r, (function(ret, gtlt, M, m, p, pr) {
    debug("xRange", comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M), xm = xM || isX(m), xp = xm || isX(p), anyX = xp;
    return "=" === gtlt && anyX && (gtlt = ""), pr = options.includePrerelease ? "-0" : "", 
    xM ? ret = ">" === gtlt || "<" === gtlt ? "<0.0.0-0" : "*" : gtlt && anyX ? (xm && (m = 0), 
    p = 0, ">" === gtlt ? (gtlt = ">=", xm ? (M = +M + 1, m = 0, p = 0) : (m = +m + 1, 
    p = 0)) : "<=" === gtlt && (gtlt = "<", xm ? M = +M + 1 : m = +m + 1), ret = gtlt + M + "." + m + "." + p + pr) : xm ? ret = ">=" + M + ".0.0" + pr + " <" + (+M + 1) + ".0.0" + pr : xp && (ret = ">=" + M + "." + m + ".0" + pr + " <" + M + "." + (+m + 1) + ".0" + pr), 
    debug("xRange return", ret), ret;
  }));
}

function replaceStars(comp, options) {
  return debug("replaceStars", comp, options), comp.trim().replace(re[t.STAR], "");
}

function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
  return ((from = isX(fM) ? "" : isX(fm) ? ">=" + fM + ".0.0" : isX(fp) ? ">=" + fM + "." + fm + ".0" : ">=" + from) + " " + (to = isX(tM) ? "" : isX(tm) ? "<" + (+tM + 1) + ".0.0" : isX(tp) ? "<" + tM + "." + (+tm + 1) + ".0" : tpr ? "<=" + tM + "." + tm + "." + tp + "-" + tpr : "<=" + to)).trim();
}

function testSet(set, version, options) {
  for (var i = 0; i < set.length; i++) if (!set[i].test(version)) return !1;
  if (version.prerelease.length && !options.includePrerelease) {
    for (i = 0; i < set.length; i++) if (debug(set[i].semver), set[i].semver !== ANY && set[i].semver.prerelease.length > 0) {
      var allowed = set[i].semver;
      if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return !0;
    }
    return !1;
  }
  return !0;
}

function satisfies(version, range, options) {
  try {
    range = new Range(range, options);
  } catch (er) {
    return !1;
  }
  return range.test(version);
}

function maxSatisfying(versions, range, options) {
  var max = null, maxSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null;
  }
  return versions.forEach((function(v) {
    rangeObj.test(v) && (max && -1 !== maxSV.compare(v) || (maxSV = new SemVer(max = v, options)));
  })), max;
}

function minSatisfying(versions, range, options) {
  var min = null, minSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null;
  }
  return versions.forEach((function(v) {
    rangeObj.test(v) && (min && 1 !== minSV.compare(v) || (minSV = new SemVer(min = v, options)));
  })), min;
}

function minVersion(range, loose) {
  range = new Range(range, loose);
  var minver = new SemVer("0.0.0");
  if (range.test(minver)) return minver;
  if (minver = new SemVer("0.0.0-0"), range.test(minver)) return minver;
  minver = null;
  for (var i = 0; i < range.set.length; ++i) {
    range.set[i].forEach((function(comparator) {
      var compver = new SemVer(comparator.semver.version);
      switch (comparator.operator) {
       case ">":
        0 === compver.prerelease.length ? compver.patch++ : compver.prerelease.push(0), 
        compver.raw = compver.format();

       case "":
       case ">=":
        minver && !gt(minver, compver) || (minver = compver);
        break;

       case "<":
       case "<=":
        break;

       default:
        throw new Error("Unexpected operation: " + comparator.operator);
      }
    }));
  }
  return minver && range.test(minver) ? minver : null;
}

function validRange(range, options) {
  try {
    return new Range(range, options).range || "*";
  } catch (er) {
    return null;
  }
}

function ltr(version, range, options) {
  return outside(version, range, "<", options);
}

function gtr(version, range, options) {
  return outside(version, range, ">", options);
}

function outside(version, range, hilo, options) {
  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (version = new SemVer(version, options), range = new Range(range, options), 
  hilo) {
   case ">":
    gtfn = gt, ltefn = lte, ltfn = lt, comp = ">", ecomp = ">=";
    break;

   case "<":
    gtfn = lt, ltefn = gte, ltfn = gt, comp = "<", ecomp = "<=";
    break;

   default:
    throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (satisfies(version, range, options)) return !1;
  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i], high = null, low = null;
    if (comparators.forEach((function(comparator) {
      comparator.semver === ANY && (comparator = new Comparator(">=0.0.0")), high = high || comparator, 
      low = low || comparator, gtfn(comparator.semver, high.semver, options) ? high = comparator : ltfn(comparator.semver, low.semver, options) && (low = comparator);
    })), high.operator === comp || high.operator === ecomp) return !1;
    if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return !1;
    if (low.operator === ecomp && ltfn(version, low.semver)) return !1;
  }
  return !0;
}

function prerelease(version, options) {
  var parsed = parse(version, options);
  return parsed && parsed.prerelease.length ? parsed.prerelease : null;
}

function intersects(r1, r2, options) {
  return r1 = new Range(r1, options), r2 = new Range(r2, options), r1.intersects(r2);
}

function coerce(version, options) {
  if (version instanceof SemVer) return version;
  if ("number" == typeof version && (version = String(version)), "string" != typeof version) return null;
  var match = null;
  if ((options = options || {}).rtl) {
    for (var next; (next = re[t.COERCERTL].exec(version)) && (!match || match.index + match[0].length !== version.length); ) match && next.index + next[0].length === match.index + match[0].length || (match = next), 
    re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
    re[t.COERCERTL].lastIndex = -1;
  } else match = version.match(re[t.COERCE]);
  return null === match ? null : parse(match[2] + "." + (match[3] || "0") + "." + (match[4] || "0"), options);
}

Comparator.prototype.parse = function(comp) {
  var r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR], m = comp.match(r);
  if (!m) throw new TypeError("Invalid comparator: " + comp);
  this.operator = void 0 !== m[1] ? m[1] : "", "=" === this.operator && (this.operator = ""), 
  m[2] ? this.semver = new SemVer(m[2], this.options.loose) : this.semver = ANY;
}, Comparator.prototype.toString = function() {
  return this.value;
}, Comparator.prototype.test = function(version) {
  if (debug("Comparator.test", version, this.options.loose), this.semver === ANY || version === ANY) return !0;
  if ("string" == typeof version) try {
    version = new SemVer(version, this.options);
  } catch (er) {
    return !1;
  }
  return cmp(version, this.operator, this.semver, this.options);
}, Comparator.prototype.intersects = function(comp, options) {
  if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
  var rangeTmp;
  if (options && "object" == typeof options || (options = {
    loose: !!options,
    includePrerelease: !1
  }), "" === this.operator) return "" === this.value || (rangeTmp = new Range(comp.value, options), 
  satisfies(this.value, rangeTmp, options));
  if ("" === comp.operator) return "" === comp.value || (rangeTmp = new Range(this.value, options), 
  satisfies(comp.semver, rangeTmp, options));
  var sameDirectionIncreasing = !(">=" !== this.operator && ">" !== this.operator || ">=" !== comp.operator && ">" !== comp.operator), sameDirectionDecreasing = !("<=" !== this.operator && "<" !== this.operator || "<=" !== comp.operator && "<" !== comp.operator), sameSemVer = this.semver.version === comp.semver.version, differentDirectionsInclusive = !(">=" !== this.operator && "<=" !== this.operator || ">=" !== comp.operator && "<=" !== comp.operator), oppositeDirectionsLessThan = cmp(this.semver, "<", comp.semver, options) && (">=" === this.operator || ">" === this.operator) && ("<=" === comp.operator || "<" === comp.operator), oppositeDirectionsGreaterThan = cmp(this.semver, ">", comp.semver, options) && ("<=" === this.operator || "<" === this.operator) && (">=" === comp.operator || ">" === comp.operator);
  return sameDirectionIncreasing || sameDirectionDecreasing || sameSemVer && differentDirectionsInclusive || oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
}, exports.Range = Range, Range.prototype.format = function() {
  return this.range = this.set.map((function(comps) {
    return comps.join(" ").trim();
  })).join("||").trim(), this.range;
}, Range.prototype.toString = function() {
  return this.range;
}, Range.prototype.parseRange = function(range) {
  var loose = this.options.loose;
  range = range.trim();
  var hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
  range = range.replace(hr, hyphenReplace), debug("hyphen replace", range), range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace), 
  debug("comparator trim", range, re[t.COMPARATORTRIM]), range = (range = (range = range.replace(re[t.TILDETRIM], tildeTrimReplace)).replace(re[t.CARETTRIM], caretTrimReplace)).split(/\s+/).join(" ");
  var compRe = loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR], set = range.split(" ").map((function(comp) {
    return parseComparator(comp, this.options);
  }), this).join(" ").split(/\s+/);
  return this.options.loose && (set = set.filter((function(comp) {
    return !!comp.match(compRe);
  }))), set = set.map((function(comp) {
    return new Comparator(comp, this.options);
  }), this);
}, Range.prototype.intersects = function(range, options) {
  if (!(range instanceof Range)) throw new TypeError("a Range is required");
  return this.set.some((function(thisComparators) {
    return isSatisfiable(thisComparators, options) && range.set.some((function(rangeComparators) {
      return isSatisfiable(rangeComparators, options) && thisComparators.every((function(thisComparator) {
        return rangeComparators.every((function(rangeComparator) {
          return thisComparator.intersects(rangeComparator, options);
        }));
      }));
    }));
  }));
}, exports.toComparators = toComparators, Range.prototype.test = function(version) {
  if (!version) return !1;
  if ("string" == typeof version) try {
    version = new SemVer(version, this.options);
  } catch (er) {
    return !1;
  }
  for (var i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return !0;
  return !1;
}, exports.satisfies = satisfies, exports.maxSatisfying = maxSatisfying, exports.minSatisfying = minSatisfying, 
exports.minVersion = minVersion, exports.validRange = validRange, exports.ltr = ltr, 
exports.gtr = gtr, exports.outside = outside, exports.prerelease = prerelease, exports.intersects = intersects, 
exports.coerce = coerce;