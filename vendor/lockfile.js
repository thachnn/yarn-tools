'use strict';

var __webpack_modules__ = {
556: function(module, __exports, __webpack_require__) {
var Buffer = __webpack_require__(834).Buffer,
  crypto = __webpack_require__(113),

  SPEC_ALGORITHMS = ['sha256', 'sha384', 'sha512'],
  BASE64_REGEX = /^[a-z0-9+/]+(?:=?=?)$/i,
  SRI_REGEX = /^([^-]+)-([^?]+)([?\S*]*)$/,
  STRICT_SRI_REGEX = /^([^-]+)-([A-Za-z0-9+/=]{44,88})(\?[\x21-\x7E]*)*$/,
  VCHAR_REGEX = /^[\x21-\x7E]+$/;

class Hash {
  get isHash() {
    return true;
  }
  constructor(hash, opts) {
    var strict = !!(opts && opts.strict);
    this.source = hash.trim();
    var match = this.source.match(strict ? STRICT_SRI_REGEX : SRI_REGEX);

    if (match && (!strict || SPEC_ALGORITHMS.indexOf(match[1]) >= 0)) {
      this.algorithm = match[1];
      this.digest = match[2];

      var rawOpts = match[3];
      this.options = rawOpts ? rawOpts.slice(1).split('?') : [];
    }
  }
  hexDigest() {
    return this.digest && Buffer.from(this.digest, 'base64').toString('hex');
  }
  toJSON() {
    return this.toString();
  }
  toString(opts) {
    if (opts && opts.strict &&
      (SPEC_ALGORITHMS.indexOf(this.algorithm) < 0 ||
        !this.digest.match(BASE64_REGEX) ||
        (this.options || []).some((opt) => !opt.match(VCHAR_REGEX)))
    )
      return '';
    var options = this.options && this.options.length ? `?${this.options.join('?')}` : '';
    return `${this.algorithm}-${this.digest}${options}`;
  }
}

class Integrity {
  get isIntegrity() {
    return true;
  }
  toJSON() {
    return this.toString();
  }
  toString(opts) {
    var sep = (opts = opts || {}).sep || ' ';
    opts.strict && (sep = sep.replace(/\S+/g, ' '));

    return Object.keys(this)
      .map((k) => this[k].map((hash) => Hash.prototype.toString.call(hash, opts)).filter((x) => x.length).join(sep))
      .filter((x) => x.length)
      .join(sep);
  }
  concat(integrity, opts) {
    var other = 'string' == typeof integrity ? integrity : stringify(integrity, opts);
    return parse(`${this.toString(opts)} ${other}`, opts);
  }
  hexDigest() {
    return parse(this, { single: true }).hexDigest();
  }
  match(integrity, opts) {
    var other = parse(integrity, opts),
      algo = other.pickAlgorithm(opts);
    return (
      (this[algo] &&
        other[algo] &&
        this[algo].find((hash) => other[algo].find((otherhash) => hash.digest === otherhash.digest))) ||
      false
    );
  }
  pickAlgorithm(opts) {
    var pickAlgorithm = (opts && opts.pickAlgorithm) || getPrioritizedHash,
      keys = Object.keys(this);
    if (!keys.length) throw new Error(`No algorithms available for ${JSON.stringify(this.toString())}`);

    return keys.reduce((acc, algo) => pickAlgorithm(acc, algo) || acc);
  }
}

module.exports.parse = parse;
function parse(sri, opts) {
  opts = opts || {};
  if ('string' == typeof sri) return _parse(sri, opts);
  if (sri.algorithm && sri.digest) {
    var fullSri = new Integrity();
    fullSri[sri.algorithm] = [sri];
    return _parse(stringify(fullSri, opts), opts);
  }
  return _parse(stringify(sri, opts), opts);
}

function _parse(integrity, opts) {
  return opts.single
  ? new Hash(integrity, opts)
  : integrity.trim().split(/\s+/).reduce((acc, string) => {
      var hash = new Hash(string, opts);
      if (hash.algorithm && hash.digest) {
        var algo = hash.algorithm;
        acc[algo] || (acc[algo] = []);
        acc[algo].push(hash);
      }
      return acc;
    }, new Integrity());
}

function stringify(obj, opts) {
  return obj.algorithm && obj.digest
    ? Hash.prototype.toString.call(obj, opts)
    : 'string' == typeof obj
    ? stringify(parse(obj, opts), opts)
    : Integrity.prototype.toString.call(obj, opts);
}

var NODE_HASHES = new Set(crypto.getHashes());
var DEFAULT_PRIORITY = [
  'md5', 'whirlpool', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
  'sha3',
  'sha3-256', 'sha3-384', 'sha3-512',
  'sha3_256', 'sha3_384', 'sha3_512'
].filter((algo) => NODE_HASHES.has(algo));

function getPrioritizedHash(algo1, algo2) {
  return DEFAULT_PRIORITY.indexOf(algo1.toLowerCase()) >= DEFAULT_PRIORITY.indexOf(algo2.toLowerCase())
    ? algo1
    : algo2;
}
},
128: function(module) {
var NODE_ENV = process.env.NODE_ENV;

module.exports = function(condition, format, a, b, c, d, e, f) {
  if ('production' !== NODE_ENV && void 0 === format)
    throw new Error('invariant requires an error message argument');

  if (!condition) {
    var error;
    if (void 0 === format)
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.'
      );
    else {
      var args = [a, b, c, d, e, f],
        argIndex = 0;
      (error = new Error(format.replace(/%s/g, () => args[argIndex++]))).name = 'Invariant Violation';
    }

    error.framesToPop = 1;
    throw error;
  }
};
},
596: function(module) {
function isNothing(subject) {
  return null == subject;
}
module.exports.isNothing = isNothing;

module.exports.isObject = function(subject) {
  return 'object' == typeof subject && null !== subject;
};
module.exports.toArray = function(sequence) {
  return Array.isArray(sequence) ? sequence : isNothing(sequence) ? [] : [sequence];
};

module.exports.extend = function(target, source) {
  var index, length, key, sourceKeys;

  if (source)
    for (index = 0, length = (sourceKeys = Object.keys(source)).length; index < length; index += 1)
      target[(key = sourceKeys[index])] = source[key];

  return target;
};

module.exports.repeat = function(string, count) {
  var cycle, result = '';

  for (cycle = 0; cycle < count; cycle += 1) result += string;
  return result;
};

module.exports.isNegativeZero = function(number) {
  return 0 === number && Number.NEGATIVE_INFINITY === 1 / number;
};
},
884: function(module) {
function YAMLException(reason, mark) {
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : '');

  Error.captureStackTrace
    ? Error.captureStackTrace(this, this.constructor)
    : (this.stack = new Error().stack || '');
}

YAMLException.prototype = Object.create(Error.prototype);
YAMLException.prototype.constructor = YAMLException;

YAMLException.prototype.toString = function(compact) {
  var result = this.name + ': ';

  result += this.reason || '(unknown reason)';
  !compact && this.mark && (result += ' ' + this.mark.toString());

  return result;
};

module.exports = YAMLException;
},
334: function(module, __exports, __webpack_require__) {
var common = __webpack_require__(596);

function Mark(name, buffer, position, line, column) {
  this.name = name;
  this.buffer = buffer;
  this.position = position;
  this.line = line;
  this.column = column;
}

Mark.prototype.getSnippet = function(indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) return null;

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.position;

  while (start > 0 && '\0\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1)) < 0) {
    start -= 1;
    if (this.position - start > maxLength / 2 - 1) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.position;

  while (end < this.buffer.length && '\0\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end)) < 0)
    if ((end += 1) - this.position > maxLength / 2 - 1) {
      tail = ' ... ';
      end -= 5;
      break;
    }

  snippet = this.buffer.slice(start, end);

  return (
    common.repeat(' ', indent) + head + snippet + tail + '\n' +
    common.repeat(' ', indent + this.position - start + head.length) + '^'
  );
};

Mark.prototype.toString = function(compact) {
  var snippet, where = '';

  this.name && (where += `in "${this.name}" `);
  where += `at line ${this.line + 1}, column ${this.column + 1}`;

  compact || ((snippet = this.getSnippet()) && (where += ':\n' + snippet));

  return where;
};

module.exports = Mark;
},
409: function(module, __exports, __webpack_require__) {
var common = __webpack_require__(596),
  YAMLException = __webpack_require__(884),
  Type = __webpack_require__(899);

function compileList(schema, name, result) {
  var exclude = [];

  schema.include.forEach(function(includedSchema) {
    result = compileList(includedSchema, name, result);
  });

  schema[name].forEach(function(currentType) {
    result.forEach(function(previousType, previousIndex) {
      previousType.tag === currentType.tag && previousType.kind === currentType.kind &&
        exclude.push(previousIndex);
    });

    result.push(currentType);
  });

  return result.filter((type, index) => exclude.indexOf(index) < 0);
}

function compileMap() {
  var index, length, result = { scalar: {}, sequence: {}, mapping: {}, fallback: {} };

  function collectType(type) {
    result[type.kind][type.tag] = result.fallback[type.tag] = type;
  }

  for (index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
  return result;
}

function Schema(definition) {
  this.include = definition.include || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];

  this.implicit.forEach(function(type) {
    if (type.loadKind && 'scalar' !== type.loadKind)
      throw new YAMLException(
        'There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.'
      );
  });

  this.compiledImplicit = compileList(this, 'implicit', []);
  this.compiledExplicit = compileList(this, 'explicit', []);
  this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
}

Schema.DEFAULT = null;

Schema.create = function() {
  var schemas, types;

  switch (arguments.length) {
    case 1:
      schemas = Schema.DEFAULT;
      types = arguments[0];
      break;
    case 2:
      schemas = arguments[0];
      types = arguments[1];
      break;
    default:
      throw new YAMLException('Wrong number of arguments for Schema.create function');
  }

  schemas = common.toArray(schemas);
  types = common.toArray(types);

  if (!schemas.every((schema) => schema instanceof Schema))
    throw new YAMLException(
      'Specified list of super schemas (or a single Schema object) contains a non-Schema object.'
    );

  if (!types.every((type) => type instanceof Type))
    throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');

  return new Schema({ include: schemas, explicit: types });
};

module.exports = Schema;
},
318: function(module, __exports, __webpack_require__) {
var Schema = __webpack_require__(409);

module.exports = new Schema({ include: [__webpack_require__(796)] });
},
972: function(module, __exports, __webpack_require__) {
var Schema = __webpack_require__(409);

module.exports = new Schema({
  include: [__webpack_require__(318)],
  implicit: [__webpack_require__(145), __webpack_require__(243)],
  explicit: [__webpack_require__(964), __webpack_require__(878), __webpack_require__(244), __webpack_require__(138)]
});
},
322: function(module, __exports, __webpack_require__) {
var Schema = __webpack_require__(409);

module.exports = new Schema({
  explicit: [__webpack_require__(483), __webpack_require__(745), __webpack_require__(553)]
});
},
796: function(module, __exports, __webpack_require__) {
var Schema = __webpack_require__(409);

module.exports = new Schema({
  include: [__webpack_require__(322)],
  implicit: [__webpack_require__(22), __webpack_require__(648), __webpack_require__(979), __webpack_require__(456)]
});
},
899: function(module, __exports, __webpack_require__) {
var YAMLException = __webpack_require__(884);

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'defaultStyle',
  'styleAliases'
];
var YAML_NODE_KINDS = ['scalar', 'sequence', 'mapping'];

function compileStyleAliases(map) {
  var result = {};

  null !== map &&
    Object.keys(map).forEach(function(style) {
      map[style].forEach((alias) => (result[String(alias)] = style));
    });

  return result;
}

function Type(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) < 0)
      throw new YAMLException(`Unknown option "${name}" is met in definition of "${tag}" YAML type.`);
  });

  this.tag = tag;
  this.kind = options.kind || null;
  this.resolve = options.resolve || (() => true);
  this.construct = options.construct || ((data) => data);
  this.instanceOf = options.instanceOf || null;
  this.predicate = options.predicate || null;
  this.represent = options.represent || null;
  this.defaultStyle = options.defaultStyle || null;
  this.styleAliases = compileStyleAliases(options.styleAliases || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) < 0)
    throw new YAMLException(`Unknown kind "${this.kind}" is specified for "${tag}" YAML type.`);
}

module.exports = Type;
},
964: function(module, __exports, __webpack_require__) {
var NodeBuffer;
try {
  NodeBuffer = __webpack_require__(300).Buffer;
} catch (__) {}

var Type = __webpack_require__(899),
  BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';

function resolveYamlBinary(data) {
  if (null === data) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  for (idx = 0; idx < max; idx++)
    if ((code = map.indexOf(data.charAt(idx))) <= 64) {
      if (code < 0) return false;

      bitlen += 6;
    }

  return bitlen % 8 == 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
    input = data.replace(/[\r\n=]/g, ''),
    max = input.length,
    map = BASE64_MAP,
    bits = 0,
    result = [];

  for (idx = 0; idx < max; idx++) {
    if (idx % 4 == 0 && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(0xFF & bits);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  if (0 === (tailbits = (max % 4) * 6)) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(0xFF & bits);
  } else if (18 === tailbits) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else 12 === tailbits && result.push((bits >> 4) & 0xFF);

  return NodeBuffer ? (NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result)) : result;
}

function representYamlBinary(object) {
  var idx, tail, result = '', bits = 0,
    max = object.length,
    map = BASE64_MAP;

  for (idx = 0; idx < max; idx++) {
    if (idx % 3 == 0 && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[0x3F & bits];
    }

    bits = (bits << 8) + object[idx];
  }

  if (0 === (tail = max % 3)) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[0x3F & bits];
  } else if (2 === tail) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (1 === tail) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

module.exports = new Type('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: (object) => NodeBuffer && NodeBuffer.isBuffer(object),
  represent: representYamlBinary
});
},
648: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

function resolveYamlBoolean(data) {
  if (null === data) return false;

  var max = data.length;
  return (
    (4 === max && ('true' === data || 'True' === data || 'TRUE' === data)) ||
    (5 === max && ('false' === data || 'False' === data || 'FALSE' === data))
  );
}

module.exports = new Type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: (data) => 'true' === data || 'True' === data || 'TRUE' === data,
  predicate: (object) => '[object Boolean]' === Object.prototype.toString.call(object),
  represent: {
    lowercase: (object) => (object ? 'true' : 'false'),
    uppercase: (object) => (object ? 'TRUE' : 'FALSE'),
    camelcase: (object) => (object ? 'True' : 'False')
  },
  defaultStyle: 'lowercase'
});
},
456: function(module, __exports, __webpack_require__) {
var common = __webpack_require__(596),
  Type = __webpack_require__(899);

var YAML_FLOAT_PATTERN = new RegExp(
  '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$'
);

function resolveYamlFloat(data) {
  return null !== data && !(!YAML_FLOAT_PATTERN.test(data) || '_' === data[data.length - 1]);
}

function constructYamlFloat(data) {
  var value, sign, base, digits;

  value = data.replace(/_/g, '').toLowerCase();
  sign = '-' === value[0] ? -1 : 1;
  digits = [];

  '+-'.indexOf(value[0]) >= 0 && (value = value.slice(1));

  if ('.inf' === value) return 1 === sign ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if ('.nan' === value) return NaN;

  if (value.indexOf(':') >= 0) {
    value.split(':').forEach(function(v) {
      digits.unshift(parseFloat(v, 10));
    });

    value = 0.0;
    base = 1;

    digits.forEach(function(d) {
      value += d * base;
      base *= 60;
    });

    return sign * value;
  }
  return sign * parseFloat(value, 10);
}

var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;
  if (isNaN(object))
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  else if (Number.POSITIVE_INFINITY === object)
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  else if (Number.NEGATIVE_INFINITY === object)
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  else if (common.isNegativeZero(object)) return '-0.0';

  res = object.toString(10);

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

module.exports = new Type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: (object) => (
    '[object Number]' === Object.prototype.toString.call(object) &&
    (object % 1 != 0 || common.isNegativeZero(object))
  ),
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});
},
979: function(module, __exports, __webpack_require__) {
var common = __webpack_require__(596),
  Type = __webpack_require__(899);

function isHexCode(c) {
  return (0x30 <= c && c <= 0x39) || (0x41 <= c && c <= 0x46) || (0x61 <= c && c <= 0x66);
}
function isOctCode(c) {
  return 0x30 <= c && c <= 0x37;
}
function isDecCode(c) {
  return 0x30 <= c && c <= 0x39;
}

function resolveYamlInteger(data) {
  if (null === data) return false;

  var ch, max = data.length,
    index = 0,
    hasDigits = false;

  if (!max) return false;

  ('-' !== (ch = data[index]) && '+' !== ch) || (ch = data[++index]);

  if ('0' === ch) {
    if (index + 1 === max) return true;

    if ('b' === (ch = data[++index])) {
      index++;

      for (; index < max; index++)
        if ('_' !== (ch = data[index])) {
          if ('0' !== ch && '1' !== ch) return false;
          hasDigits = true;
        }
      return hasDigits && '_' !== ch;
    }

    if ('x' === ch) {
      index++;

      for (; index < max; index++)
        if ('_' !== (ch = data[index])) {
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
      return hasDigits && '_' !== ch;
    }

    for (; index < max; index++)
      if ('_' !== (ch = data[index])) {
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
    return hasDigits && '_' !== ch;
  }

  if ('_' === ch) return false;

  for (; index < max; index++)
    if ('_' !== (ch = data[index])) {
      if (':' === ch) break;
      if (!isDecCode(data.charCodeAt(index))) return false;
      hasDigits = true;
    }

  return (hasDigits && '_' !== ch) &&
    (':' !== ch || /^(:[0-5]?[0-9])+$/.test(data.slice(index)));
}

function constructYamlInteger(data) {
  var ch, base, value = data, sign = 1, digits = [];

  value.indexOf('_') >= 0 && (value = value.replace(/_/g, ''));

  if ('-' === (ch = value[0]) || '+' === ch) {
    '-' === ch && (sign = -1);
    value = value.slice(1);
    ch = value[0];
  }

  if ('0' === value) return 0;

  if ('0' === ch)
    return 'b' === value[1]
      ? sign * parseInt(value.slice(2), 2)
      : 'x' === value[1]
      ? sign * parseInt(value, 16)
      : sign * parseInt(value, 8);

  if (value.indexOf(':') >= 0) {
    value.split(':').forEach(function(v) {
      digits.unshift(parseInt(v, 10));
    });

    value = 0;
    base = 1;

    digits.forEach(function(d) {
      value += d * base;
      base *= 60;
    });

    return sign * value;
  }

  return sign * parseInt(value, 10);
}

module.exports = new Type('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: (object) => (
    '[object Number]' === Object.prototype.toString.call(object) &&
    object % 1 == 0 &&
    !common.isNegativeZero(object)
  ),
  represent: {
    binary: (obj) => (obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1)),
    octal: (obj) => (obj >= 0 ? '0' + obj.toString(8) : '-0' + obj.toString(8).slice(1)),
    decimal: (obj) => obj.toString(10),
    hexadecimal: (obj) =>
      obj >= 0 ? '0x' + obj.toString(16).toUpperCase() : '-0x' + obj.toString(16).toUpperCase().slice(1)
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary: [2, 'bin'],
    octal: [8, 'oct'],
    decimal: [10, 'dec'],
    hexadecimal: [16, 'hex']
  }
});
},
553: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

module.exports = new Type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: (data) => (null !== data ? data : {})
});
},
243: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

module.exports = new Type('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: (data) => '<<' === data || null === data
});
},
22: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

function resolveYamlNull(data) {
  if (null === data) return true;

  var max = data.length;

  return (1 === max && '~' === data) || (4 === max && ('null' === data || 'Null' === data || 'NULL' === data));
}

module.exports = new Type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: () => null,
  predicate: (object) => null === object,
  represent: {
    canonical: () => '~',
    lowercase: () => 'null',
    uppercase: () => 'NULL',
    camelcase: () => 'Null'
  },
  defaultStyle: 'lowercase'
});
},
878: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899),
  _hasOwnProperty = Object.prototype.hasOwnProperty,
  _toString = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (null === data) return true;

  var index, length, pair, pairKey, pairHasKey, objectKeys = [],
    object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if ('[object Object]' !== _toString.call(pair)) return false;

    for (pairKey in pair)
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (pairHasKey) return false;
        pairHasKey = true;
      }

    if (!pairHasKey || objectKeys.indexOf(pairKey) >= 0) return false;
    objectKeys.push(pairKey);
  }

  return true;
}

module.exports = new Type('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: (data) => (null !== data ? data : [])
});
},
244: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899),
  _toString = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (null === data) return true;

  var index, length, pair, keys, result,
    object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if ('[object Object]' !== _toString.call(pair)) return false;
    if (1 !== (keys = Object.keys(pair)).length) return false;

    result[index] = [keys[0], pair[keys[0]]];
  }

  return true;
}

function constructYamlPairs(data) {
  if (null === data) return [];

  var index, length, pair, keys, result,
    object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);

    result[index] = [keys[0], pair[keys[0]]];
  }

  return result;
}

module.exports = new Type('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
},
745: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

module.exports = new Type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: (data) => (null !== data ? data : [])
});
},
138: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899),
  _hasOwnProperty = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (null === data) return true;

  var key, object = data;
  for (key in object) if (_hasOwnProperty.call(object, key) && null !== object[key]) return false;

  return true;
}

module.exports = new Type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: (data) => (null !== data ? data : {})
});
},
483: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

module.exports = new Type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: (data) => (null !== data ? data : '')
});
},
145: function(module, __exports, __webpack_require__) {
var Type = __webpack_require__(899);

var YAML_DATE_REGEXP = new RegExp('^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$');
var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$'
);

function resolveYamlTimestamp(data) {
  return null !== data && (null !== YAML_DATE_REGEXP.exec(data) || null !== YAML_TIMESTAMP_REGEXP.exec(data));
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second,
    date, fraction = 0, delta = null;

  null === (match = YAML_DATE_REGEXP.exec(data)) && (match = YAML_TIMESTAMP_REGEXP.exec(data));

  if (null === match) throw new Error('Date resolve error');

  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];

  if (!match[4]) return new Date(Date.UTC(year, month, day));

  hour = +match[4];
  minute = +match[5];
  second = +match[6];

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) fraction += '0';
    fraction = +fraction;
  }

  if (match[9]) {
    delta = 60000 * (60 * +match[10] + +(match[11] || 0));
    '-' === match[9] && (delta = -delta);
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  delta && date.setTime(date.getTime() - delta);

  return date;
}

module.exports = new Type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: (object) => object.toISOString()
});
},
403: function(module) {
module.exports = (x) => {
  if ('string' != typeof x) throw new TypeError('Expected a string, got ' + typeof x);

  return 0xFEFF === x.charCodeAt(0) ? x.slice(1) : x;
};
},
834: function(module, exports, __webpack_require__) {
var buffer = __webpack_require__(300),
  Buffer = buffer.Buffer;

function copyProps(src, dst) {
  for (var key in src) dst[key] = src[key];
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow)
  module.exports = buffer;
else {
  copyProps(buffer, exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer(arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length);
}

copyProps(Buffer, SafeBuffer);

SafeBuffer.from = function(arg, encodingOrOffset, length) {
  if ('number' == typeof arg) throw new TypeError('Argument must not be a number');
  return Buffer(arg, encodingOrOffset, length);
};
SafeBuffer.alloc = function(size, fill, encoding) {
  if ('number' != typeof size) throw new TypeError('Argument must be a number');
  var buf = Buffer(size);
  void 0 !== fill ? ('string' == typeof encoding ? buf.fill(fill, encoding) : buf.fill(fill)) : buf.fill(0);
  return buf;
};
SafeBuffer.allocUnsafe = function(size) {
  if ('number' != typeof size) throw new TypeError('Argument must be a number');
  return Buffer(size);
};
SafeBuffer.allocUnsafeSlow = function(size) {
  if ('number' != typeof size) throw new TypeError('Argument must be a number');
  return buffer.SlowBuffer(size);
};
},
660: function(module, __exports, __webpack_require__) {
var common = __webpack_require__(596),
  YAMLException = __webpack_require__(884),
  Mark = __webpack_require__(334),
  DEFAULT_SAFE_SCHEMA = __webpack_require__(972),
  DEFAULT_FULL_SCHEMA = (module.exports.FAILSAFE_SCHEMA = __webpack_require__(322)),

  _hasOwnProperty = Object.prototype.hasOwnProperty,

  PATTERN_NON_PRINTABLE =
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,
  PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/,
  PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/,
  PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i,
  PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

function _class(obj) {
  return Object.prototype.toString.call(obj);
}

function is_EOL(c) {
  return 0x0A === c || 0x0D === c;
}
function is_WHITE_SPACE(c) {
  return 0x09 === c || 0x20 === c;
}
function is_WS_OR_EOL(c) {
  return 0x09 === c || 0x20 === c || 0x0A === c || 0x0D === c;
}
function is_FLOW_INDICATOR(c) {
  return 0x2C === c || 0x5B === c || 0x5D === c || 0x7B === c || 0x7D === c;
}
function fromHexCode(c) {
  var lc;
  return 0x30 <= c && c <= 0x39 ? c - 0x30 : 0x61 <= (lc = 0x20 | c) && lc <= 0x66 ? lc - 0x61 + 10 : -1;
}
function escapedHexLen(c) {
  return 0x78 === c ? 2 : 0x75 === c ? 4 : 0x55 === c ? 8 : 0;
}
function fromDecimalCode(c) {
  return 0x30 <= c && c <= 0x39 ? c - 0x30 : -1;
}

function simpleEscapeSequence(c) {
  return 0x30 === c ? '\0'
    : 0x61 === c ? '\x07'
    : 0x62 === c ? '\b'
    : 0x74 === c || 0x09 === c ? '\t'
    : 0x6E === c ? '\n'
    : 0x76 === c ? '\v'
    : 0x66 === c ? '\f'
    : 0x72 === c ? '\r'
    : 0x65 === c ? '\x1B'
    : 0x20 === c ? ' '
    : 0x22 === c ? '"'
    : 0x2F === c ? '/'
    : 0x5C === c ? '\\'
    : 0x4E === c ? '\x85'
    : 0x5F === c ? '\xA0'
    : 0x4C === c ? '\u2028'
    : 0x50 === c ? '\u2029' : '';
}

function charFromCodepoint(c) {
  return c <= 0xFFFF
    ? String.fromCharCode(c)
    : String.fromCharCode(0xD800 + ((c - 0x010000) >> 10), 0xDC00 + ((c - 0x010000) & 0x03FF));
}

var simpleEscapeCheck = new Array(256),
  simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}

function State(input, options) {
  this.input = input;

  this.filename = options.filename || null;
  this.schema = options.schema || DEFAULT_FULL_SCHEMA;
  this.onWarning = options.onWarning || null;
  this.legacy = options.legacy || false;
  this.json = options.json || false;
  this.listener = options.listener || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;

  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;

  this.documents = [];
}

function generateError(state, message) {
  return new YAMLException(
    message,
    new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart)
  );
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  state.onWarning && state.onWarning.call(null, generateError(state, message));
}

var directiveHandlers = {
  YAML: function(state, name, args) {
    var match, major, minor;

    null !== state.version && throwError(state, 'duplication of %YAML directive');
    1 !== args.length && throwError(state, 'YAML directive accepts exactly one argument');

    null === (match = /^([0-9]+)\.([0-9]+)$/.exec(args[0])) &&
      throwError(state, 'ill-formed argument of the YAML directive');

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    1 !== major && throwError(state, 'unacceptable YAML version of the document');

    state.version = args[0];
    state.checkLineBreaks = minor < 2;

    1 !== minor && 2 !== minor && throwWarning(state, 'unsupported YAML version of the document');
  },

  TAG: function(state, name, args) {
    var handle, prefix;

    2 !== args.length && throwError(state, 'TAG directive accepts exactly two arguments');

    handle = args[0];
    prefix = args[1];

    PATTERN_TAG_HANDLE.test(handle) ||
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');

    _hasOwnProperty.call(state.tagMap, handle) &&
      throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);

    PATTERN_TAG_URI.test(prefix) ||
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');

    state.tagMap[handle] = prefix;
  }
};

function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson)
      for (_position = 0, _length = _result.length; _position < _length; _position += 1)
        0x09 === (_character = _result.charCodeAt(_position)) || (0x20 <= _character && _character <= 0x10FFFF) ||
          throwError(state, 'expected valid JSON character');
    else PATTERN_NON_PRINTABLE.test(_result) && throwError(state, 'the stream contains non-printable characters');

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  common.isObject(source) || throwError(state, 'cannot merge mappings; the provided source object is unacceptable');

  for (index = 0, quantity = (sourceKeys = Object.keys(source)).length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
  var index, quantity;

  if (Array.isArray(keyNode))
    for (index = 0, quantity = (keyNode = Array.prototype.slice.call(keyNode)).length; index < quantity; index += 1) {
      Array.isArray(keyNode[index]) && throwError(state, 'nested arrays are not supported inside keys');

      'object' == typeof keyNode && '[object Object]' === _class(keyNode[index]) &&
        (keyNode[index] = '[object Object]');
    }

  'object' == typeof keyNode && '[object Object]' === _class(keyNode) && (keyNode = '[object Object]');
  keyNode = String(keyNode);

  null === _result && (_result = {});

  if ('tag:yaml.org,2002:merge' === keyTag)
    if (Array.isArray(valueNode))
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1)
        mergeMappings(state, _result, valueNode[index], overridableKeys);
    else mergeMappings(state, _result, valueNode, overridableKeys);
  else {
    if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }
    _result[keyNode] = valueNode;
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  if (0x0A === (ch = state.input.charCodeAt(state.position))) state.position++;
  else if (0x0D === ch) {
    state.position++;
    0x0A === state.input.charCodeAt(state.position) && state.position++;
  } else throwError(state, 'a line break is expected');

  state.line += 1;
  state.lineStart = state.position;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
    ch = state.input.charCodeAt(state.position);

  while (0 !== ch) {
    while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);

    if (allowComments && 0x23 === ch)
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (0x0A !== ch && 0x0D !== ch && 0 !== ch);

    if (!is_EOL(ch)) break;
    readLineBreak(state);

    ch = state.input.charCodeAt(state.position);
    lineBreaks++;
    state.lineIndent = 0;

    while (0x20 === ch) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
  }

  -1 !== checkIndent && 0 !== lineBreaks && state.lineIndent < checkIndent &&
    throwWarning(state, 'deficient indentation');

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var ch, _position = state.position;

  if (
    (0x2D === (ch = state.input.charCodeAt(_position)) || 0x2E === ch) &&
    ch === state.input.charCodeAt(_position + 1) &&
    ch === state.input.charCodeAt(_position + 2)
  ) {
    _position += 3;

    if (0 === (ch = state.input.charCodeAt(_position)) || is_WS_OR_EOL(ch)) return true;
  }

  return false;
}

function writeFoldedLines(state, count) {
  1 === count ? (state.result += ' ') : count > 1 && (state.result += common.repeat('\n', count - 1));
}

function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var following,
    captureStart,
    captureEnd,
    hasPendingContent,
    _line,
    _lineStart,
    _lineIndent,
    ch,
    _kind = state.kind,
    _result = state.result;

  if (
    is_WS_OR_EOL((ch = state.input.charCodeAt(state.position))) ||
    is_FLOW_INDICATOR(ch) ||
    0x23 === ch ||
    0x26 === ch ||
    0x2A === ch ||
    0x21 === ch ||
    0x7C === ch ||
    0x3E === ch ||
    0x27 === ch ||
    0x22 === ch ||
    0x25 === ch ||
    0x40 === ch ||
    0x60 === ch
  )
    return false;

  if ((0x3F === ch || 0x2D === ch) &&
    (is_WS_OR_EOL((following = state.input.charCodeAt(state.position + 1))) ||
      (withinFlowCollection && is_FLOW_INDICATOR(following)))
  )
    return false;

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (0 !== ch) {
    if (0x3A === ch) {
      if (
        is_WS_OR_EOL((following = state.input.charCodeAt(state.position + 1))) ||
        (withinFlowCollection && is_FLOW_INDICATOR(following))
      )
        break;
    } else if (0x23 === ch) {
      if (is_WS_OR_EOL(state.input.charCodeAt(state.position - 1))) break;
    } else if (
      (state.position === state.lineStart && testDocumentSeparator(state)) ||
      (withinFlowCollection && is_FLOW_INDICATOR(ch))
    )
      break;
    else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      }
      state.position = captureEnd;
      state.line = _line;
      state.lineStart = _lineStart;
      state.lineIndent = _lineIndent;
      break;
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    is_WHITE_SPACE(ch) || (captureEnd = state.position + 1);

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) return true;

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
    captureStart, captureEnd;

  if (0x27 !== (ch = state.input.charCodeAt(state.position))) return false;

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while (0 !== (ch = state.input.charCodeAt(state.position)))
    if (0x27 === ch) {
      captureSegment(state, captureStart, state.position, true);
      if (0x27 !== (ch = state.input.charCodeAt(++state.position))) return true;

      captureStart = state.position;
      state.position++;
      captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state))
      throwError(state, 'unexpected end of the document within a single quoted scalar');
    else {
      state.position++;
      captureEnd = state.position;
    }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;

  if (0x22 !== (ch = state.input.charCodeAt(state.position))) return false;

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while (0 !== (ch = state.input.charCodeAt(state.position))) {
    if (0x22 === ch) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    }
    if (0x5C === ch) {
      captureSegment(state, captureStart, state.position, true);

      if (is_EOL((ch = state.input.charCodeAt(++state.position))))
        skipSeparationSpace(state, false, nodeIndent);
      else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--)
          (tmp = fromHexCode((ch = state.input.charCodeAt(++state.position)))) >= 0
            ? (hexResult = (hexResult << 4) + tmp)
            : throwError(state, 'expected hexadecimal character');

        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else throwError(state, 'unknown escape sequence');

      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state))
      throwError(state, 'unexpected end of the document within a double quoted scalar');
    else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var _line, _result,
    terminator,
    isPair, isExplicitPair, isMapping,
    keyNode, keyTag, valueNode,
    ch,
    readNext = true,
    _tag = state.tag,
    _anchor = state.anchor,
    overridableKeys = {};

  if (0x5B === (ch = state.input.charCodeAt(state.position))) {
    terminator = 0x5D;
    isMapping = false;
    _result = [];
  } else {
    if (0x7B !== ch) return false;
    terminator = 0x7D;
    isMapping = true;
    _result = {};
  }

  null !== state.anchor && (state.anchorMap[state.anchor] = _result);

  ch = state.input.charCodeAt(++state.position);

  while (0 !== ch) {
    skipSeparationSpace(state, true, nodeIndent);

    if ((ch = state.input.charCodeAt(state.position)) === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    }
    readNext || throwError(state, 'missed comma between flow collection entries');

    valueNode = null;
    isPair = isExplicitPair = false;

    if (0x3F === ch && is_WS_OR_EOL(state.input.charCodeAt(state.position + 1))) {
      isPair = isExplicitPair = true;
      state.position++;
      skipSeparationSpace(state, true, nodeIndent);
    }

    _line = state.line;
    composeNode(state, nodeIndent, 1, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && 0x3A === ch) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, 1, false, true);
      valueNode = state.result;
    }

    isMapping
      ? storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode)
      : isPair
      ? _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode))
      : _result.push(keyNode);

    skipSeparationSpace(state, true, nodeIndent);

    if (0x2C === (ch = state.input.charCodeAt(state.position))) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else readNext = false;
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, tmp, ch,
    chomping = 1,
    didReadContent = false,
    detectedIndent = false,
    textIndent = nodeIndent,
    emptyLines = 0,
    atMoreIndented = false;

  if (0x7C === (ch = state.input.charCodeAt(state.position))) folding = false;
  else {
    if (0x3E !== ch) return false;
    folding = true;
  }

  state.kind = 'scalar';
  state.result = '';

  while (0 !== ch)
    if (0x2B === (ch = state.input.charCodeAt(++state.position)) || 0x2D === ch)
      1 === chomping
        ? (chomping = 0x2B === ch ? 3 : 2)
        : throwError(state, 'repeat of a chomping mode identifier');
    else {
      if ((tmp = fromDecimalCode(ch)) < 0) break;
      if (0 === tmp)
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      else if (detectedIndent) throwError(state, 'repeat of an indentation width identifier');
      else {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      }
    }

  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));

    if (0x23 === ch)
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && 0 !== ch);
  }

  while (0 !== ch) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) && 0x20 === ch) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    !detectedIndent && state.lineIndent > textIndent && (textIndent = state.lineIndent);

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    if (state.lineIndent < textIndent) {
      3 === chomping
        ? (state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines))
        : 1 === chomping && didReadContent && (state.result += '\n');

      break;
    }

    if (folding)
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);
      } else
        0 === emptyLines
          ? didReadContent && (state.result += ' ')
          : (state.result += common.repeat('\n', emptyLines));
    else state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && 0 !== ch) ch = state.input.charCodeAt(++state.position);

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line, ch,
    _tag = state.tag,
    _anchor = state.anchor,
    _result = [],
    detected = false;

  null !== state.anchor && (state.anchorMap[state.anchor] = _result);

  ch = state.input.charCodeAt(state.position);

  while (0x2D === ch && is_WS_OR_EOL(state.input.charCodeAt(state.position + 1))) {
    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1) && state.lineIndent <= nodeIndent) {
      _result.push(null);
      ch = state.input.charCodeAt(state.position);
      continue;
    }

    _line = state.line;
    composeNode(state, nodeIndent, 3, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && 0 !== ch)
      throwError(state, 'bad indentation of a sequence entry');
    else if (state.lineIndent < nodeIndent) break;
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _pos, ch,
    _tag = state.tag,
    _anchor = state.anchor,
    _result = {},
    overridableKeys = {},
    keyTag = null,
    keyNode = null,
    valueNode = null,
    atExplicitKey = false,
    detected = false;

  null !== state.anchor && (state.anchorMap[state.anchor] = _result);

  ch = state.input.charCodeAt(state.position);

  while (0 !== ch) {
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    _pos = state.position;

    if ((0x3F === ch || 0x3A === ch) && is_WS_OR_EOL(following)) {
      if (0x3F === ch) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else
        throwError(
          state,
          'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line'
        );

      state.position += 1;
      ch = following;
    } else if (!composeNode(state, flowIndent, 2, false, true)) break;
    else if (state.line === _line) {
      ch = state.input.charCodeAt(state.position);

      while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);

      if (0x3A === ch) {
        is_WS_OR_EOL((ch = state.input.charCodeAt(++state.position))) ||
          throwError(
            state,
            'a whitespace character is expected after the key-value separator within a block mapping'
          );

        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = false;
        allowCompact = false;
        keyTag = state.tag;
        keyNode = state.result;
      } else if (detected) throwError(state, 'can not read an implicit mapping pair; a colon is missed');
      else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    } else if (detected)
      throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');
    else {
      state.tag = _tag;
      state.anchor = _anchor;
      return true;
    }

    if (state.line === _line || state.lineIndent > nodeIndent) {
      composeNode(state, nodeIndent, 4, true, allowCompact) &&
        (atExplicitKey ? (keyNode = state.result) : (valueNode = state.result));

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if (state.lineIndent > nodeIndent && 0 !== ch)
      throwError(state, 'bad indentation of a mapping entry');
    else if (state.lineIndent < nodeIndent) break;
  }

  atExplicitKey && storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position, tagHandle, tagName, ch,
    isVerbatim = false,
    isNamed = false;

  if (0x21 !== (ch = state.input.charCodeAt(state.position))) return false;

  null !== state.tag && throwError(state, 'duplication of a tag property');

  if (0x3C === (ch = state.input.charCodeAt(++state.position))) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (0x21 === ch) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);
  } else tagHandle = '!';

  _position = state.position;

  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (0 !== ch && 0x3E !== ch);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else throwError(state, 'unexpected end of the stream within a verbatim tag');
  } else {
    while (0 !== ch && !is_WS_OR_EOL(ch)) {
      if (0x21 === ch)
        if (isNamed) throwError(state, 'tag suffix cannot contain exclamation marks');
        else {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          PATTERN_TAG_HANDLE.test(tagHandle) ||
            throwError(state, 'named tag handle cannot contain such characters');

          isNamed = true;
          _position = state.position + 1;
        }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    PATTERN_FLOW_INDICATORS.test(tagName) &&
      throwError(state, 'tag suffix cannot contain flow indicator characters');
  }

  tagName && !PATTERN_TAG_URI.test(tagName) &&
    throwError(state, 'tag name cannot contain such characters: ' + tagName);

  isVerbatim
    ? (state.tag = tagName)
    : _hasOwnProperty.call(state.tagMap, tagHandle)
    ? (state.tag = state.tagMap[tagHandle] + tagName)
    : '!' === tagHandle
    ? (state.tag = '!' + tagName)
    : '!!' === tagHandle
    ? (state.tag = 'tag:yaml.org,2002:' + tagName)
    : throwError(state, `undeclared tag handle "${tagHandle}"`);

  return true;
}

function readAnchorProperty(state) {
  var _position, ch;

  if (0x26 !== (ch = state.input.charCodeAt(state.position))) return false;

  null !== state.anchor && throwError(state, 'duplication of an anchor property');

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (0 !== ch && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) ch = state.input.charCodeAt(++state.position);

  state.position === _position && throwError(state, 'name of an anchor node must contain at least one character');

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias, ch;

  if (0x2A !== (ch = state.input.charCodeAt(state.position))) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (0 !== ch && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch))
    ch = state.input.charCodeAt(++state.position);

  state.position === _position &&
    throwError(state, 'name of an alias node must contain at least one character');

  alias = state.input.slice(_position, state.position);

  _hasOwnProperty.call(state.anchorMap, alias) || throwError(state, `unidentified alias "${alias}"`);

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
    allowBlockScalars,
    allowBlockCollections,
    typeIndex,
    typeQuantity,
    type,
    flowIndent,
    blockIndent,
    indentStatus = 1,
    atNewLine = false,
    hasContent = false;

  null !== state.listener && state.listener('open', state);

  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections = 4 === nodeContext || 3 === nodeContext;

  if (allowToSeek && skipSeparationSpace(state, true, -1)) {
    atNewLine = true;

    state.lineIndent > parentIndent
      ? (indentStatus = 1)
      : state.lineIndent === parentIndent
      ? (indentStatus = 0)
      : state.lineIndent < parentIndent && (indentStatus = -1);
  }

  if (1 === indentStatus)
    while (readTagProperty(state) || readAnchorProperty(state))
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        state.lineIndent > parentIndent
          ? (indentStatus = 1)
          : state.lineIndent === parentIndent
          ? (indentStatus = 0)
          : state.lineIndent < parentIndent && (indentStatus = -1);
      } else allowBlockCollections = false;

  allowBlockCollections && (allowBlockCollections = atNewLine || allowCompact);

  if (1 === indentStatus || 4 === nodeContext) {
    flowIndent = 1 === nodeContext || 2 === nodeContext ? parentIndent : parentIndent + 1;

    blockIndent = state.position - state.lineStart;

    if (1 === indentStatus)
      if (
        (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent))) ||
        readFlowCollection(state, flowIndent)
      )
        hasContent = true;
      else {
        if (
          (allowBlockScalars && readBlockScalar(state, flowIndent)) ||
          readSingleQuotedScalar(state, flowIndent) ||
          readDoubleQuotedScalar(state, flowIndent)
        )
          hasContent = true;
        else if (readAlias(state)) {
          hasContent = true;

          (null === state.tag && null === state.anchor) ||
            throwError(state, 'alias node should not have any properties');
        } else if (readPlainScalar(state, flowIndent, 1 === nodeContext)) {
          hasContent = true;

          null === state.tag && (state.tag = '?');
        }

        null !== state.anchor && (state.anchorMap[state.anchor] = state.result);
      }
    else 0 === indentStatus && (hasContent = allowBlockCollections && readBlockSequence(state, blockIndent));
  }

  if (null !== state.tag && '!' !== state.tag)
    if ('?' === state.tag) {
      null !== state.result && 'scalar' !== state.kind &&
        throwError(state, `unacceptable node kind for !<?> tag; it should be "scalar", not "${state.kind}"`);

      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1)
        if ((type = state.implicitTypes[typeIndex]).resolve(state.result)) {
          state.result = type.construct(state.result);
          state.tag = type.tag;
          null !== state.anchor && (state.anchorMap[state.anchor] = state.result);
          break;
        }
    } else if (_hasOwnProperty.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];

      null !== state.result && type.kind !== state.kind &&
        throwError(
          state,
          `unacceptable node kind for !<${state.tag}> tag; it should be "${type.kind}", not "${state.kind}"`
        );

      if (type.resolve(state.result)) {
        state.result = type.construct(state.result);
        null !== state.anchor && (state.anchorMap[state.anchor] = state.result);
      } else throwError(state, `cannot resolve a node with !<${state.tag}> explicit tag`);
    } else throwError(state, `unknown tag !<${state.tag}>`);

  null !== state.listener && state.listener('close', state);
  return null !== state.tag || null !== state.anchor || hasContent;
}

function readDocument(state) {
  var _position, directiveName, directiveArgs, ch,
    documentStart = state.position,
    hasDirectives = false;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while (0 !== (ch = state.input.charCodeAt(state.position))) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || 0x25 !== ch) break;

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (0 !== ch && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);

    directiveArgs = [];
    (directiveName = state.input.slice(_position, state.position)).length < 1 &&
      throwError(state, 'directive name must not be less than one character in length');

    while (0 !== ch) {
      while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);

      if (0x23 === ch) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (0 !== ch && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;
      while (0 !== ch && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    0 !== ch && readLineBreak(state);

    _hasOwnProperty.call(directiveHandlers, directiveName)
      ? directiveHandlers[directiveName](state, directiveName, directiveArgs)
      : throwWarning(state, `unknown document directive "${directiveName}"`);
  }

  skipSeparationSpace(state, true, -1);

  if (
    0 === state.lineIndent &&
    0x2D === state.input.charCodeAt(state.position) &&
    0x2D === state.input.charCodeAt(state.position + 1) &&
    0x2D === state.input.charCodeAt(state.position + 2)
  ) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else hasDirectives && throwError(state, 'directives end mark is expected');

  composeNode(state, state.lineIndent - 1, 4, false, true);
  skipSeparationSpace(state, true, -1);

  state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position)) &&
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (0x2E === state.input.charCodeAt(state.position)) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
  } else
    state.position < state.length - 1 && throwError(state, 'end of the stream or a document separator is expected');
}

function loadDocuments(input, options) {
  options = options || {};

  if ((input = String(input)).length > 0) {
    0x0A !== input.charCodeAt(input.length - 1) && 0x0D !== input.charCodeAt(input.length - 1) && (input += '\n');

    0xFEFF === input.charCodeAt(0) && (input = input.slice(1));
  }

  var state = new State(input, options),
    nullpos = input.indexOf('\0');

  if (nullpos >= 0) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  state.input += '\0';

  while (0x20 === state.input.charCodeAt(state.position)) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < state.length - 1) readDocument(state);
  return state.documents;
}

function loadAll(input, iterator, options) {
  if (null !== iterator && 'object' == typeof iterator && void 0 === options) {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);
  if ('function' != typeof iterator) return documents;

  for (var index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
}
module.exports.loadAll = loadAll;

function load(input, options) {
  var documents = loadDocuments(input, options);

  if (1 === documents.length) return documents[0];
  if (documents.length > 0) throw new YAMLException('expected a single document in the stream, but found more');
}
module.exports.load = load;

module.exports.safeLoadAll = function(input, iterator, options) {
  if ('object' == typeof iterator && null !== iterator && void 0 === options) {
    options = iterator;
    iterator = null;
  }

  return loadAll(input, iterator, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
};

module.exports.safeLoad = function(input, options) {
  return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
};
},
300: function(module) {
module.exports = require('buffer');
},
113: function(module) {
module.exports = require('crypto');
},
147: function(module) {
module.exports = require('fs');
},
17: function(module) {
module.exports = require('path');
},
781: function(module) {
module.exports = require('stream');
},
837: function(module) {
module.exports = require('util');
},
598: function(module) {
module.exports = { pK: '1.23.0-0' };
}
};

var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
  var cachedModule = __webpack_module_cache__[moduleId];
  if (void 0 !== cachedModule) return cachedModule.exports;

  var module = (__webpack_module_cache__[moduleId] = { exports: {} });
  __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  return module.exports;
}
__webpack_require__.d = function(exports, definition) {
  for (var key in definition)
    __webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key) &&
      Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
};
__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
__webpack_require__.r = function(exports) {
  'undefined' != typeof Symbol && Symbol.toStringTag &&
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  Object.defineProperty(exports, '__esModule', { value: true });
};

var __webpack_exports__ = {};
!(function() {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  default: () => Lockfile,
  explodeEntry: () => explodeEntry,
  implodeEntry: () => implodeEntry,
  parse: () => lockfile_parse,
  stringify: () => stringify
});

function sortAlpha(a, b) {
  for (var shortLen = Math.min(a.length, b.length), i = 0; i < shortLen; i++) {
    var aChar = a.charCodeAt(i),
      bChar = b.charCodeAt(i);
    if (aChar !== bChar) return aChar - bChar;
  }
  return a.length - b.length;
}

function normalizePattern(pattern) {
  var hasVersion = false,
    range = 'latest',
    name = pattern,

    isScoped = false;
  if ('@' === name[0]) {
    isScoped = true;
    name = name.slice(1);
  }

  var parts = name.split('@');
  if (parts.length > 1) {
    name = parts.shift();
    (range = parts.join('@')) ? (hasVersion = true) : (range = '*');
  }

  isScoped && (name = `@${name}`);

  return { name, range, hasVersion };
}

class MessageError extends Error {
  constructor(msg, code) {
    super(msg);
    this.code = code;
  }
}

function nullify() {
  var obj = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
  if (Array.isArray(obj)) for (var item of obj) nullify(item);
  else if ((null !== obj && 'object' == typeof obj) || 'function' == typeof obj) {
    Object.setPrototypeOf(obj, null);

    if ('object' == typeof obj) for (var key in obj) nullify(obj[key]);
  }

  return obj;
}

var util = __webpack_require__(837),
  invariant = __webpack_require__(128),
  stripBOM = __webpack_require__(403),
  _require = __webpack_require__(660), safeLoad = _require.safeLoad, FAILSAFE_SCHEMA = _require.FAILSAFE_SCHEMA,

  VERSION_REGEX = /^yarn lockfile v(\d+)$/,
  TOKEN_TYPES_boolean = 'BOOLEAN',
  TOKEN_TYPES_string = 'STRING',
  TOKEN_TYPES_eof = 'EOF',
  TOKEN_TYPES_colon = 'COLON',
  TOKEN_TYPES_newline = 'NEWLINE',
  TOKEN_TYPES_comment = 'COMMENT',
  TOKEN_TYPES_indent = 'INDENT',
  TOKEN_TYPES_invalid = 'INVALID',
  TOKEN_TYPES_number = 'NUMBER',
  TOKEN_TYPES_comma = 'COMMA',

  VALID_PROP_VALUE_TOKENS = [TOKEN_TYPES_boolean, TOKEN_TYPES_string, TOKEN_TYPES_number];

function isValidPropValueToken(token) {
  return VALID_PROP_VALUE_TOKENS.indexOf(token.type) >= 0;
}

function* tokenise(input) {
  var lastNewline = false,
    line = 1,
    col = 0;

  function buildToken(type, value) {
    return { line, col, type, value };
  }

  while (input.length) {
    var chop = 0;

    if ('\n' === input[0] || '\r' === input[0]) {
      chop++;
      '\n' === input[1] && chop++;
      line++;
      col = 0;
      yield buildToken(TOKEN_TYPES_newline);
    } else if ('#' === input[0]) {
      chop++;

      var nextNewline = input.indexOf('\n', chop);
      nextNewline < 0 && (nextNewline = input.length);
      var val = input.substring(chop, nextNewline);
      chop = nextNewline;
      yield buildToken(TOKEN_TYPES_comment, val);
    } else if (' ' === input[0])
      if (lastNewline) {
        for (var indentSize = 1, i = 1; ' ' === input[i]; i++) indentSize++;

        if (indentSize % 2) throw new TypeError('Invalid number of spaces');
        chop = indentSize;
        yield buildToken(TOKEN_TYPES_indent, indentSize / 2);
      } else chop++;
    else if ('"' === input[0]) {
      for (var _i = 1; _i < input.length; _i++)
        if ('"' === input[_i] && ('\\' !== input[_i - 1] || '\\' === input[_i - 2])) {
          _i++;
          break;
        }
      var _val = input.substring(0, _i);
      chop = _i;

      try {
        yield buildToken(TOKEN_TYPES_string, JSON.parse(_val));
      } catch (err) {
        if (!(err instanceof SyntaxError)) throw err;
        yield buildToken(TOKEN_TYPES_invalid);
      }
    } else if (/^[0-9]/.test(input)) {
      var _val2 = /^[0-9]+/.exec(input)[0];
      chop = _val2.length;

      yield buildToken(TOKEN_TYPES_number, +_val2);
    } else if (/^true/.test(input)) {
      yield buildToken(TOKEN_TYPES_boolean, true);
      chop = 4;
    } else if (/^false/.test(input)) {
      yield buildToken(TOKEN_TYPES_boolean, false);
      chop = 5;
    } else if (':' === input[0]) {
      yield buildToken(TOKEN_TYPES_colon);
      chop++;
    } else if (',' === input[0]) {
      yield buildToken(TOKEN_TYPES_comma);
      chop++;
    } else if (/^[a-zA-Z\/.-]/g.test(input)) {
      for (var _i2 = 0; _i2 < input.length; _i2++) {
        var char = input[_i2];
        if (':' === char || ' ' === char || '\n' === char || '\r' === char || ',' === char) break;
      }
      var name = input.substring(0, _i2);
      chop = _i2;

      yield buildToken(TOKEN_TYPES_string, name);
    } else yield buildToken(TOKEN_TYPES_invalid);

    chop || (yield buildToken(TOKEN_TYPES_invalid));

    col += chop;
    lastNewline = '\n' === input[0] || ('\r' === input[0] && '\n' === input[1]);
    input = input.slice(chop);
  }

  yield buildToken(TOKEN_TYPES_eof);
}

class Parser {
  constructor(input) {
    var fileLoc = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 'lockfile';
    this.comments = [];
    this.tokens = tokenise(input);
    this.fileLoc = fileLoc;
  }

  onComment(token) {
    var value = token.value;
    invariant('string' == typeof value, 'expected token value to be a string');

    var comment = value.trim(),
      versionMatch = comment.match(VERSION_REGEX);

    if (versionMatch) {
      var version = +versionMatch[1];
      if (version > 1)
        throw new MessageError(
          `Can't install from a lockfile of version ${version} as you're on an old yarn version that only supports versions up to 1. Run \`$ yarn self-update\` to upgrade to the latest version.`
        );
    }

    this.comments.push(comment);
  }

  next() {
    var item = this.tokens.next();
    invariant(item, 'expected a token');

    var done = item.done, value = item.value;
    if (done || !value) throw new Error('No more tokens');

    if (value.type === TOKEN_TYPES_comment) {
      this.onComment(value);
      return this.next();
    }
    return (this.token = value);
  }

  unexpected() {
    var msg = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 'Unexpected token';
    throw new SyntaxError(`${msg} ${this.token.line}:${this.token.col} in ${this.fileLoc}`);
  }

  expect(tokType) {
    this.token.type === tokType ? this.next() : this.unexpected();
  }

  eat(tokType) {
    if (this.token.type === tokType) {
      this.next();
      return true;
    }
    return false;
  }

  parse() {
    var indent = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
      obj = nullify();

    while (true) {
      var propToken = this.token;

      if (propToken.type === TOKEN_TYPES_newline) {
        var nextToken = this.next();
        if (!indent) continue;

        if (nextToken.type !== TOKEN_TYPES_indent || nextToken.value !== indent) break;

        this.next();
      } else if (propToken.type === TOKEN_TYPES_indent) {
        if (propToken.value !== indent) break;

        this.next();
      } else if (propToken.type === TOKEN_TYPES_eof) break;
      else if (propToken.type === TOKEN_TYPES_string) {
        var key = propToken.value;
        invariant(key, 'Expected a key');

        var keys = [key];
        this.next();

        while (this.token.type === TOKEN_TYPES_comma) {
          this.next();

          var keyToken = this.token;
          keyToken.type !== TOKEN_TYPES_string && this.unexpected('Expected string');

          var _key = keyToken.value;
          invariant(_key, 'Expected a key');
          keys.push(_key);
          this.next();
        }

        var wasColon = this.token.type === TOKEN_TYPES_colon;
        wasColon && this.next();

        if (isValidPropValueToken(this.token)) {
          for (var _key2 of keys) obj[_key2] = this.token.value;

          this.next();
        } else if (wasColon) {
          var val = this.parse(indent + 1);

          for (var _key3 of keys) obj[_key3] = val;

          if (indent && this.token.type !== TOKEN_TYPES_indent) break;
        } else this.unexpected('Invalid value type');
      } else this.unexpected(`Unknown token: ${util.inspect(propToken)}`);
    }

    return obj;
  }
}

function extractConflictVariants(str) {
  var variants = [[], []],
    lines = str.split(/\r?\n/g),
    skip = false;

  while (lines.length) {
    var line = lines.shift();
    if (line.startsWith('<<<<<<<')) {
      while (lines.length) {
        var conflictLine = lines.shift();
        if ('=======' === conflictLine) {
          skip = false;
          break;
        }
        skip || conflictLine.startsWith('|||||||') ? (skip = true) : variants[0].push(conflictLine);
      }

      while (lines.length) {
        var _conflictLine = lines.shift();
        if (_conflictLine.startsWith('>>>>>>>')) break;
        variants[1].push(_conflictLine);
      }
    } else {
      variants[0].push(line);
      variants[1].push(line);
    }
  }

  return [variants[0].join('\n'), variants[1].join('\n')];
}

function hasMergeConflicts(str) {
  return str.includes('<<<<<<<') && str.includes('=======') && str.includes('>>>>>>>');
}

function parse(str, fileLoc) {
  var error, parser = new Parser(str, fileLoc);
  parser.next();

  if (!fileLoc.endsWith('.yml'))
    try {
      return parser.parse();
    } catch (err) {
      error = err;
    }

  try {
    var result = safeLoad(str, { schema: FAILSAFE_SCHEMA });
    return 'object' == typeof result ? result : {};
  } catch (err) {
    throw error || err;
  }
}

function parseWithConflict(str, fileLoc) {
  var variants = extractConflictVariants(str);
  try {
    return { type: 'merge', object: Object.assign({}, parse(variants[0], fileLoc), parse(variants[1], fileLoc)) };
  } catch (err) {
    if (err instanceof SyntaxError) return { type: 'conflict', object: {} };
    throw err;
  }
}

function lockfile_parse(str) {
  var fileLoc = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 'lockfile';
  str = stripBOM(str);
  return hasMergeConflicts(str) ? parseWithConflict(str, fileLoc) : { type: 'success', object: parse(str, fileLoc) };
}

var fs = __webpack_require__(147),
  exists = fs.existsSync,
  _readFile = fs.readFileSync;

function readFile(loc) {
  return _readFile(loc, 'utf8').replace(/\r\n/g, '\n');
}

var YARN_VERSION = __webpack_require__(598).pK,
  NODE_VERSION = process.version;

function shouldWrapKey(str) {
  return (
    0 === str.indexOf('true') ||
    0 === str.indexOf('false') ||
    /[:\s\n\\",\[\]]/g.test(str) ||
    /^[0-9]/g.test(str) ||
    !/^[a-zA-Z]/g.test(str)
  );
}

function maybeWrap(str) {
  return 'boolean' == typeof str || 'number' == typeof str || shouldWrapKey(str)
    ? JSON.stringify(str)
    : str;
}

var priorities = {
  name: 1,
  version: 2,
  uid: 3,
  resolved: 4,
  integrity: 5,
  registry: 6,
  dependencies: 7
};

function priorityThenAlphaSort(a, b) {
  return priorities[a] || priorities[b]
    ? (priorities[a] || 100) > (priorities[b] || 100) ? 1 : -1
    : sortAlpha(a, b);
}

function _stringify(obj, options) {
  if ('object' != typeof obj) throw new TypeError();

  var indent = options.indent,
    lines = [],
    keys = Object.keys(obj).sort(priorityThenAlphaSort),
    addedKeys = [];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i],
      val = obj[key];
    if (null == val || addedKeys.indexOf(key) >= 0) continue;

    var valKeys = [key];
    if ('object' == typeof val)
      for (var j = i + 1; j < keys.length; j++) {
        var _key = keys[j];
        val === obj[_key] && valKeys.push(_key);
      }

    var keyLine = valKeys.sort(sortAlpha).map(maybeWrap).join(', ');

    if ('string' == typeof val || 'boolean' == typeof val || 'number' == typeof val)
      lines.push(`${keyLine} ${maybeWrap(val)}`);
    else {
      if ('object' != typeof val) throw new TypeError();
      lines.push(`${keyLine}:\n${_stringify(val, { indent: indent + '  ' })}` + (options.topLevel ? '\n' : ''));
    }

    addedKeys = addedKeys.concat(valKeys);
  }

  return indent + lines.join(`\n${indent}`);
}

function stringify(obj, noHeader, enableVersions) {
  var val = _stringify(obj, { indent: '', topLevel: true });
  if (noHeader) return val;

  var lines = [];
  lines.push('# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.');
  lines.push('# yarn lockfile v1');
  if (enableVersions) {
    lines.push(`# yarn v${YARN_VERSION}`);
    lines.push(`# node ${NODE_VERSION}`);
  }
  lines.push('\n');
  lines.push(val);

  return lines.join('\n');
}

var lockfile_invariant = __webpack_require__(128),
  path = __webpack_require__(17),
  ssri = __webpack_require__(556);

function getName(pattern) {
  return normalizePattern(pattern).name;
}

function blankObjectUndefined(obj) {
  return obj && Object.keys(obj).length ? obj : void 0;
}

function keyForRemote(remote) {
  return remote.resolved || (remote.reference && remote.hash ? `${remote.reference}#${remote.hash}` : null);
}

function serializeIntegrity(integrity) {
  return integrity.toString().split(' ').sort().join(' ');
}

function implodeEntry(pattern, obj) {
  var inferredName = getName(pattern),
    integrity = obj.integrity ? serializeIntegrity(obj.integrity) : '';
  var imploded = {
    name: inferredName === obj.name ? void 0 : obj.name,
    version: obj.version,
    uid: obj.uid === obj.version ? void 0 : obj.uid,
    resolved: obj.resolved,
    registry: 'npm' === obj.registry ? void 0 : obj.registry,
    dependencies: blankObjectUndefined(obj.dependencies),
    optionalDependencies: blankObjectUndefined(obj.optionalDependencies),
    permissions: blankObjectUndefined(obj.permissions),
    prebuiltVariants: blankObjectUndefined(obj.prebuiltVariants)
  };

  integrity && (imploded.integrity = integrity);
  return imploded;
}

function explodeEntry(pattern, obj) {
  obj.optionalDependencies = obj.optionalDependencies || {};
  obj.dependencies = obj.dependencies || {};
  obj.uid = obj.uid || obj.version;
  obj.permissions = obj.permissions || {};
  obj.registry = obj.registry || 'npm';
  obj.name = obj.name || getName(pattern);
  var integrity = obj.integrity;
  integrity && integrity.isIntegrity && (obj.integrity = ssri.parse(integrity));
  return obj;
}

class Lockfile {
  constructor() {
    var opts = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
    this.source = opts.source || '';
    this.cache = opts.cache;
    this.parseResultType = opts.parseResultType;
  }

  hasEntriesExistWithoutIntegrity() {
    if (!this.cache) return false;

    for (var key in this.cache)
      if (!/^.*@(file:|http)/.test(key) && this.cache[key] && !this.cache[key].integrity) return true;

    return false;
  }

  static fromDirectory(dir, reporter) {
    var lockfile, parseResult,
      lockfileLoc = path.join(dir, 'yarn.lock'),
      rawLockfile = '';

    if (exists(lockfileLoc)) {
      parseResult = lockfile_parse((rawLockfile = readFile(lockfileLoc)), lockfileLoc);

      reporter &&
        ('merge' === parseResult.type
          ? reporter.info(reporter.lang('lockfileMerged'))
          : 'conflict' === parseResult.type && reporter.warn(reporter.lang('lockfileConflict')));

      lockfile = parseResult.object;
    } else reporter && reporter.info(reporter.lang('noLockfileFound'));

    if (lockfile && lockfile.__metadata) {
      lockfile = {};
    }

    return new Lockfile({ cache: lockfile, source: rawLockfile, parseResultType: parseResult && parseResult.type });
  }

  getLocked(pattern) {
    var cache = this.cache;
    if (cache) {
      var shrunk = pattern in cache && cache[pattern];

      if ('string' == typeof shrunk) return this.getLocked(shrunk);
      if (shrunk) {
        explodeEntry(pattern, shrunk);
        return shrunk;
      }
    }
  }

  removePattern(pattern) {
    var cache = this.cache;
    cache && delete cache[pattern];
  }

  getLockfile(patterns) {
    var lockfile = {},
      seen = new Map(),
      sortedPatternsKeys = Object.keys(patterns).sort(sortAlpha);

    for (var pattern of sortedPatternsKeys) {
      var pkg = patterns[pattern],
        remote = pkg._remote, ref = pkg._reference;
      lockfile_invariant(ref, 'Package is missing a reference');
      lockfile_invariant(remote, 'Package is missing a remote');

      var remoteKey = keyForRemote(remote),
        seenPattern = remoteKey && seen.get(remoteKey);
      if (seenPattern) {
        lockfile[pattern] = seenPattern;

        seenPattern.name || getName(pattern) === pkg.name || (seenPattern.name = pkg.name);
        continue;
      }
      var obj = implodeEntry(pattern, {
        name: pkg.name,
        version: pkg.version,
        uid: pkg._uid,
        resolved: remote.resolved,
        integrity: remote.integrity,
        registry: remote.registry,
        dependencies: pkg.dependencies,
        peerDependencies: pkg.peerDependencies,
        optionalDependencies: pkg.optionalDependencies,
        permissions: ref.permissions,
        prebuiltVariants: pkg.prebuiltVariants
      });

      lockfile[pattern] = obj;

      remoteKey && seen.set(remoteKey, obj);
    }

    return lockfile;
  }
}
})();
module.exports = __webpack_exports__;
