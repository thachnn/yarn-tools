var EventEmitter = require('events').EventEmitter,
  spawn = require('child_process').spawn,
  path = require('path'),
  dirname = path.dirname,
  basename = path.basename,
  fs = require('fs');

require('util').inherits(Command, EventEmitter);

exports = module.exports = new Command();
exports.Command = Command;
exports.Option = Option;

function Option(flags, description) {
  this.flags = flags;
  this.required = flags.indexOf('<') >= 0;
  this.optional = flags.indexOf('[') >= 0;
  this.mandatory = false;
  this.negate = -1 !== flags.indexOf('-no-');
  (flags = flags.split(/[ ,|]+/)).length > 1 && !/^[[<]/.test(flags[1]) && (this.short = flags.shift());
  this.long = flags.shift();
  this.description = description || '';
}

Option.prototype.name = function() {
  return this.long.replace(/^--/, '');
};
Option.prototype.attributeName = function() {
  return camelcase(this.name().replace(/^no-/, ''));
};
Option.prototype.is = function(arg) {
  return this.short === arg || this.long === arg;
};

class CommanderError extends Error {
  constructor(exitCode, code, message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
  }
}
exports.CommanderError = CommanderError;

function Command(name) {
  this.commands = [];
  this.options = [];
  this._execs = new Set();
  this._allowUnknownOption = false;
  this._args = [];
  this._name = name || '';
  this._optionValues = {};
  this._storeOptionsAsProperties = true;
  this._passCommandToAction = true;
  this._actionResults = [];

  this._helpFlags = '-h, --help';
  this._helpDescription = 'output usage information';
  this._helpShortFlag = '-h';
  this._helpLongFlag = '--help';
}

Command.prototype.command = function(nameAndArgs, actionOptsOrExecDesc, execOpts) {
  var desc = actionOptsOrExecDesc,
    opts = execOpts;
  if ('object' == typeof desc && null !== desc) {
    opts = desc;
    desc = null;
  }
  opts = opts || {};
  var args = nameAndArgs.split(/ +/),
    cmd = new Command(args.shift());

  if (desc) {
    cmd.description(desc);
    this.executables = true;
    this._execs.add(cmd._name);
    opts.isDefault && (this.defaultExecutable = cmd._name);
  }
  cmd._noHelp = !!opts.noHelp;
  cmd._helpFlags = this._helpFlags;
  cmd._helpDescription = this._helpDescription;
  cmd._helpShortFlag = this._helpShortFlag;
  cmd._helpLongFlag = this._helpLongFlag;
  cmd._exitCallback = this._exitCallback;
  cmd._storeOptionsAsProperties = this._storeOptionsAsProperties;
  cmd._passCommandToAction = this._passCommandToAction;

  cmd._executableFile = opts.executableFile;
  this.commands.push(cmd);
  cmd.parseExpectedArgs(args);
  cmd.parent = this;

  return desc ? this : cmd;
};

Command.prototype.arguments = function(desc) {
  return this.parseExpectedArgs(desc.split(/ +/));
};
Command.prototype.addImplicitHelpCommand = function() {
  this.command('help [cmd]', 'display help for [cmd]');
};

Command.prototype.parseExpectedArgs = function(args) {
  if (!args.length) return;
  var self = this;
  args.forEach(function(arg) {
    var argDetails = { required: false, name: '', variadic: false };
    switch (arg[0]) {
      case '<':
        argDetails.required = true;
        argDetails.name = arg.slice(1, -1);
        break;
      case '[':
        argDetails.name = arg.slice(1, -1);
    }

    if (argDetails.name.length > 3 && '...' === argDetails.name.slice(-3)) {
      argDetails.variadic = true;
      argDetails.name = argDetails.name.slice(0, -3);
    }
    argDetails.name && self._args.push(argDetails);
  });
  return this;
};

Command.prototype.exitOverride = function(fn) {
  this._exitCallback = fn || function(err) {
    if ('commander.executeSubCommandAsync' !== err.code) throw err;
  };
  return this;
};
Command.prototype._exit = function(exitCode, code, message) {
  this._exitCallback && this._exitCallback(new CommanderError(exitCode, code, message));
  process.exit(exitCode);
};

Command.prototype.action = function(fn) {
  var self = this;
  var listener = function(args, unknown) {
    args = args || [];
    unknown = unknown || [];

    var parsed = self.parseOptions(unknown);

    outputHelpIfRequested(self, parsed.unknown);
    self._checkForMissingMandatoryOptions();

    parsed.unknown.length > 0 && self.unknownOption(parsed.unknown[0]);
    parsed.args.length && (args = parsed.args.concat(args));

    self._args.forEach(function(arg, i) {
      if (arg.required && null == args[i]) self.missingArgument(arg.name);
      else if (arg.variadic) {
        i !== self._args.length - 1 && self.variadicArgNotLast(arg.name);

        args[i] = args.splice(i);
      }
    });

    var expectedArgsCount = self._args.length,
      actionArgs = args.slice(0, expectedArgsCount);
    actionArgs[expectedArgsCount] = self._passCommandToAction ? self : self.opts();
    args.length > expectedArgsCount && actionArgs.push(args.slice(expectedArgsCount));

    for (var actionResult = fn.apply(self, actionArgs), rootCommand = self; rootCommand.parent; )
      rootCommand = rootCommand.parent;
    rootCommand._actionResults.push(actionResult);
  };
  var parent = this.parent || this,
    name = parent === this ? '*' : this._name;
  parent.on('command:' + name, listener);
  this._alias && parent.on('command:' + this._alias, listener);
  return this;
};

Command.prototype._optionEx = function(config, flags, description, fn, defaultValue) {
  var self = this,
    option = new Option(flags, description),
    oname = option.name(),
    name = option.attributeName();
  option.mandatory = !!config.mandatory;

  if ('function' != typeof fn)
    if (fn instanceof RegExp) {
      var regex = fn;
      fn = function(val, def) {
        var m = regex.exec(val);
        return m ? m[0] : def;
      };
    } else {
      defaultValue = fn;
      fn = null;
    }

  if (option.negate || option.optional || option.required || 'boolean' == typeof defaultValue) {
    if (option.negate) {
      var positiveLongFlag = option.long.replace(/^--no-/, '--');
      defaultValue = !self.optionFor(positiveLongFlag) || self._getOptionValue(name);
    }
    if (void 0 !== defaultValue) {
      self._setOptionValue(name, defaultValue);
      option.defaultValue = defaultValue;
    }
  }

  this.options.push(option);

  this.on('option:' + oname, function(val) {
    null !== val && fn &&
      (val = fn(val, void 0 === self._getOptionValue(name) ? defaultValue : self._getOptionValue(name)));

    'boolean' == typeof self._getOptionValue(name) || void 0 === self._getOptionValue(name)
      ? self._setOptionValue(name, null == val ? !option.negate && (defaultValue || true) : val)
      : null !== val && self._setOptionValue(name, !option.negate && val);
  });

  return this;
};

Command.prototype.option = function(flags, description, fn, defaultValue) {
  return this._optionEx({}, flags, description, fn, defaultValue);
};
Command.prototype.requiredOption = function(flags, description, fn, defaultValue) {
  return this._optionEx({ mandatory: true }, flags, description, fn, defaultValue);
};
Command.prototype.allowUnknownOption = function(arg) {
  this._allowUnknownOption = 0 === arguments.length || arg;
  return this;
};
Command.prototype.storeOptionsAsProperties = function(value) {
  this._storeOptionsAsProperties = void 0 === value || value;
  this.options.length && console.error('Commander usage error: call storeOptionsAsProperties before adding options');
  return this;
};
Command.prototype.passCommandToAction = function(value) {
  this._passCommandToAction = void 0 === value || value;
  return this;
};
Command.prototype._setOptionValue = function(key, value) {
  this._storeOptionsAsProperties ? (this[key] = value) : (this._optionValues[key] = value);
};
Command.prototype._getOptionValue = function(key) {
  return this._storeOptionsAsProperties ? this[key] : this._optionValues[key];
};

Command.prototype.parse = function(argv) {
  this.executables && this.addImplicitHelpCommand();

  this.rawArgs = argv;
  this._name = this._name || basename(argv[1], '.js');

  this.executables && argv.length < 3 && !this.defaultExecutable && argv.push(this._helpLongFlag);

  var normalized = this.normalize(argv.slice(2)),
    parsed = this.parseOptions(normalized),
    args = (this.args = parsed.args),
    result = this.parseArgs(this.args, parsed.unknown);

  'help' === args[0] && 1 === args.length && this.help();

  if ('help' === args[0]) {
    args[0] = args[1];
    args[1] = this._helpLongFlag;
  } else this._checkForMissingMandatoryOptions();

  var name = result.args[0],
    subCommand = null;

  name &&
    (subCommand = this.commands.find((command) => command._name === name));

  if (!subCommand && name &&
    (subCommand = this.commands.find((command) => command.alias() === name))
  ) {
    name = subCommand._name;
    args[0] = name;
  }

  if (!subCommand && this.defaultExecutable) {
    name = this.defaultExecutable;
    args.unshift(name);
    subCommand = this.commands.find((command) => command._name === name);
  }

  return this._execs.has(name)
    ? this.executeSubCommand(argv, args, parsed.unknown, subCommand ? subCommand._executableFile : void 0)
    : result;
};

Command.prototype.parseAsync = function(argv) {
  this.parse(argv);
  return Promise.all(this._actionResults);
};

Command.prototype.executeSubCommand = function(argv, args, unknown, executableFile) {
  (args = args.concat(unknown)).length || this.help();

  var isExplicitJS = false,
    pm = argv[1],
    bin = basename(pm, path.extname(pm)) + '-' + args[0];

  if (null != executableFile) {
    bin = executableFile;
    var executableExt = path.extname(executableFile);
    isExplicitJS = '.js' === executableExt || '.ts' === executableExt || '.mjs' === executableExt;
  }

  var proc, resolvedLink = fs.realpathSync(pm),
    baseDir = dirname(resolvedLink),
    localBin = path.join(baseDir, bin);

  if (exists(localBin + '.js')) {
    bin = localBin + '.js';
    isExplicitJS = true;
  } else if (exists(localBin + '.ts')) {
    bin = localBin + '.ts';
    isExplicitJS = true;
  } else if (exists(localBin + '.mjs')) {
    bin = localBin + '.mjs';
    isExplicitJS = true;
  } else exists(localBin) && (bin = localBin);

  args = args.slice(1);

  if ('win32' !== process.platform)
    if (isExplicitJS) {
      args.unshift(bin);
      args = incrementNodeInspectorPort(process.execArgv).concat(args);

      proc = spawn(process.argv[0], args, { stdio: 'inherit' });
    } else proc = spawn(bin, args, { stdio: 'inherit' });
  else {
    args.unshift(bin);
    args = incrementNodeInspectorPort(process.execArgv).concat(args);
    proc = spawn(process.execPath, args, { stdio: 'inherit' });
  }

  ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'].forEach(function(signal) {
    process.on(signal, function() {
      false === proc.killed && null === proc.exitCode && proc.kill(signal);
    });
  });

  var exitCallback = this._exitCallback;
  proc.on('close', !exitCallback ? process.exit.bind(process) : () => {
    exitCallback(new CommanderError(process.exitCode || 0, 'commander.executeSubCommandAsync', '(close)'));
  });
  proc.on('error', function(err) {
    'ENOENT' === err.code
      ? console.error('error: %s(1) does not exist, try --help', bin)
      : 'EACCES' === err.code && console.error('error: %s(1) not executable. try chmod or run with root', bin);
    if (!exitCallback) process.exit(1);
    else {
      var wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
      wrappedError.nestedError = err;
      exitCallback(wrappedError);
    }
  });

  this.runningCommand = proc;
};

Command.prototype.normalize = function(args) {
  for (var arg, lastOpt, index, short, opt, ret = [], i = 0, len = args.length; i < len; ++i) {
    arg = args[i];
    i > 0 && (lastOpt = this.optionFor(args[i - 1]));

    if ('--' === arg) {
      ret = ret.concat(args.slice(i));
      break;
    }
    if (lastOpt && lastOpt.required) ret.push(arg);
    else if (arg.length > 2 && '-' === arg[0] && '-' !== arg[1]) {
      short = arg.slice(0, 2);
      (opt = this.optionFor(short)) && (opt.required || opt.optional)
        ? ret.push(short, arg.slice(2))
        : arg.slice(1).split('').forEach((c) => ret.push('-' + c));
    } else
      /^--/.test(arg) && ~(index = arg.indexOf('='))
        ? ret.push(arg.slice(0, index), arg.slice(index + 1))
        : ret.push(arg);
  }

  return ret;
};

Command.prototype.parseArgs = function(args, unknown) {
  if (args.length) {
    var name = args[0];
    this.emit(this.listeners('command:' + name).length ? 'command:' + args.shift() : 'command:*', args, unknown);
  } else {
    outputHelpIfRequested(this, unknown);

    unknown.length > 0 && !this.defaultExecutable && this.unknownOption(unknown[0]);
    0 === this.commands.length &&
      (this._args.filter((a) => a.required).length > 0 ? this.outputHelp() : this.emit('command:*'));
  }

  return this;
};

Command.prototype.optionFor = function(arg) {
  for (var i = 0, len = this.options.length; i < len; ++i) if (this.options[i].is(arg)) return this.options[i];
};
Command.prototype._checkForMissingMandatoryOptions = function() {
  for (var cmd = this; cmd; cmd = cmd.parent)
    cmd.options.forEach((anOption) => {
      anOption.mandatory && void 0 === cmd._getOptionValue(anOption.attributeName()) &&
        cmd.missingMandatoryOptionValue(anOption);
    });
};

Command.prototype.parseOptions = function(argv) {
  for (var literal, option, arg, args = [], len = argv.length, unknownOptions = [], i = 0; i < len; ++i) {
    arg = argv[i];

    if (literal) args.push(arg);
    else if ('--' === arg) literal = true;
    else if ((option = this.optionFor(arg)))
      if (option.required) {
        if (null == (arg = argv[++i])) return this.optionMissingArgument(option);
        this.emit('option:' + option.name(), arg);
      } else if (option.optional) {
        null == (arg = argv[i + 1]) || ('-' === arg[0] && '-' !== arg) ? (arg = null) : ++i;

        this.emit('option:' + option.name(), arg);
      } else this.emit('option:' + option.name());
    else if (arg.length > 1 && '-' === arg[0]) {
      unknownOptions.push(arg);

      i + 1 < argv.length && ('-' !== argv[i + 1][0] || '-' === argv[i + 1]) && unknownOptions.push(argv[++i]);
    } else args.push(arg);
  }

  return { args: args, unknown: unknownOptions };
};

Command.prototype.opts = function() {
  if (this._storeOptionsAsProperties) {
    for (var result = {}, len = this.options.length, i = 0; i < len; i++) {
      var key = this.options[i].attributeName();
      result[key] = key === this._versionOptionName ? this._version : this[key];
    }
    return result;
  }

  return this._optionValues;
};
Command.prototype.missingArgument = function(name) {
  var message = `error: missing required argument '${name}'`;
  console.error(message);
  this._exit(1, 'commander.missingArgument', message);
};
Command.prototype.optionMissingArgument = function(option, flag) {
  var message = flag
    ? `error: option '${option.flags}' argument missing, got '${flag}'`
    : `error: option '${option.flags}' argument missing`;
  console.error(message);
  this._exit(1, 'commander.optionMissingArgument', message);
};
Command.prototype.missingMandatoryOptionValue = function(option) {
  var message = `error: required option '${option.flags}' not specified`;
  console.error(message);
  this._exit(1, 'commander.missingMandatoryOptionValue', message);
};
Command.prototype.unknownOption = function(flag) {
  if (this._allowUnknownOption) return;
  var message = `error: unknown option '${flag}'`;
  console.error(message);
  this._exit(1, 'commander.unknownOption', message);
};
Command.prototype.variadicArgNotLast = function(name) {
  var message = `error: variadic arguments must be last '${name}'`;
  console.error(message);
  this._exit(1, 'commander.variadicArgNotLast', message);
};

Command.prototype.version = function(str, flags, description) {
  if (0 === arguments.length) return this._version;
  this._version = str;
  var versionOption = new Option(flags || '-V, --version', description || 'output the version number');
  this._versionOptionName = versionOption.long.substr(2) || 'version';
  this.options.push(versionOption);
  var self = this;
  this.on('option:' + this._versionOptionName, function() {
    process.stdout.write(str + '\n');
    self._exit(0, 'commander.version', str);
  });
  return this;
};

Command.prototype.description = function(str, argsDescription) {
  if (0 === arguments.length) return this._description;
  this._description = str;
  this._argsDescription = argsDescription;
  return this;
};
Command.prototype.alias = function(alias) {
  var command = this;
  this.commands.length > 0 && (command = this.commands[this.commands.length - 1]);

  if (0 === arguments.length) return command._alias;
  if (alias === command._name) throw new Error("Command alias can't be the same as its name");

  command._alias = alias;
  return this;
};
Command.prototype.usage = function(str) {
  if (arguments.length > 0) {
    this._usage = str;
    return this;
  }
  if (this._usage) return this._usage;

  var args = this._args.map((arg) => humanReadableArgName(arg));

  return '[options]' + (this.commands.length ? ' [command]' : '') + (this._args.length ? ' ' + args.join(' ') : '');
};
Command.prototype.name = function(str) {
  if (0 === arguments.length) return this._name;
  this._name = str;
  return this;
};

Command.prototype.prepareCommands = function() {
  return this.commands.filter((cmd) => !cmd._noHelp).map(function(cmd) {
    var args = cmd._args.map((arg) => humanReadableArgName(arg)).join(' ');

    return [
      cmd._name +
        (cmd._alias ? '|' + cmd._alias : '') +
        (cmd.options.length ? ' [options]' : '') +
        (args ? ' ' + args : ''),
      cmd._description
    ];
  });
};

Command.prototype.largestCommandLength = function() {
  return this.prepareCommands().reduce((max, command) => Math.max(max, command[0].length), 0);
};
Command.prototype.largestOptionLength = function() {
  var options = [].slice.call(this.options);
  options.push({ flags: this._helpFlags });

  return options.reduce((max, option) => Math.max(max, option.flags.length), 0);
};
Command.prototype.largestArgLength = function() {
  return this._args.reduce((max, arg) => Math.max(max, arg.name.length), 0);
};
Command.prototype.padWidth = function() {
  var width = this.largestOptionLength();
  this._argsDescription && this._args.length && this.largestArgLength() > width && (width = this.largestArgLength());

  this.commands && this.commands.length && this.largestCommandLength() > width && (width = this.largestCommandLength());

  return width;
};
Command.prototype.optionHelp = function() {
  var width = this.padWidth(),
    descriptionWidth = (process.stdout.columns || 80) - width - 4;

  return this.options.map(function(option) {
    var fullDesc = option.description +
      (option.negate || void 0 === option.defaultValue ? '' : ' (default: ' + JSON.stringify(option.defaultValue) + ')');
    return pad(option.flags, width) + '  ' + optionalWrap(fullDesc, descriptionWidth, width + 2);
  }).concat([pad(this._helpFlags, width) + '  ' + optionalWrap(this._helpDescription, descriptionWidth, width + 2)])
    .join('\n');
};
Command.prototype.commandHelp = function() {
  if (!this.commands.length) return '';

  var commands = this.prepareCommands(),
    width = this.padWidth(),
    descriptionWidth = (process.stdout.columns || 80) - width - 4;

  return [
    'Commands:',
    commands.map(function(cmd) {
      var desc = cmd[1] ? '  ' + cmd[1] : '';
      return (desc ? pad(cmd[0], width) : cmd[0]) + optionalWrap(desc, descriptionWidth, width + 2);
    }).join('\n').replace(/^/gm, '  '),
    ''
  ].join('\n');
};

Command.prototype.helpInformation = function() {
  var desc = [];
  if (this._description) {
    desc = [this._description, ''];

    var argsDescription = this._argsDescription;
    if (argsDescription && this._args.length) {
      var width = this.padWidth(),
        descriptionWidth = (process.stdout.columns || 80) - width - 5;
      desc.push('Arguments:', '');
      this._args.forEach(function(arg) {
        desc.push('  ' + pad(arg.name, width) + '  ' + wrap(argsDescription[arg.name], descriptionWidth, width + 4));
      });
      desc.push('');
    }
  }

  var cmdName = this._name;
  this._alias && (cmdName += '|' + this._alias);
  for (var parentCmdNames = '', parentCmd = this.parent; parentCmd; parentCmd = parentCmd.parent)
    parentCmdNames = parentCmd.name() + ' ' + parentCmdNames;

  var usage = ['Usage: ' + parentCmdNames + cmdName + ' ' + this.usage(), ''],
    cmds = [],
    commandHelp = this.commandHelp();
  commandHelp && (cmds = [commandHelp]);

  var options = ['Options:', '' + this.optionHelp().replace(/^/gm, '  '), ''];

  return usage.concat(desc).concat(options).concat(cmds).join('\n');
};

Command.prototype.outputHelp = function(cb) {
  cb = cb || ((passthru) => passthru);
  var cbOutput = cb(this.helpInformation());
  if ('string' != typeof cbOutput && !Buffer.isBuffer(cbOutput))
    throw new Error('outputHelp callback must return a string or a Buffer');

  process.stdout.write(cbOutput);
  this.emit(this._helpLongFlag);
};
Command.prototype.helpOption = function(flags, description) {
  this._helpFlags = flags || this._helpFlags;
  this._helpDescription = description || this._helpDescription;

  var splitFlags = this._helpFlags.split(/[ ,|]+/);
  splitFlags.length > 1 && (this._helpShortFlag = splitFlags.shift());
  this._helpLongFlag = splitFlags.shift();

  return this;
};
Command.prototype.help = function(cb) {
  this.outputHelp(cb);
  this._exit(process.exitCode || 0, 'commander.help', '(outputHelp)');
};

function camelcase(flag) {
  return flag.split('-').reduce((str, word) => str + word[0].toUpperCase() + word.slice(1));
}

function pad(str, width) {
  var len = Math.max(0, width - str.length);
  return str + Array(len + 1).join(' ');
}

function wrap(str, width, indent) {
  var regex = new RegExp('.{1,' + (width - 1) + '}([\\s\u200B]|$)|[^\\s\u200B]+?([\\s\u200B]|$)', 'g');
  return (str.match(regex) || []).map(function(line, i) {
    '\n' === line.slice(-1) && (line = line.slice(0, line.length - 1));
    return (i > 0 && indent ? Array(indent + 1).join(' ') : '') + line.trimRight();
  }).join('\n');
}

function optionalWrap(str, width, indent) {
  if (str.match(/[\n]\s+/)) return str;

  return width < 40 ? str : wrap(str, width, indent);
}

function outputHelpIfRequested(cmd, options) {
  options = options || [];

  for (var i = 0; i < options.length; i++)
    if (options[i] === cmd._helpLongFlag || options[i] === cmd._helpShortFlag) {
      cmd.outputHelp();
      cmd._exit(0, 'commander.helpDisplayed', '(outputHelp)');
    }
}

function humanReadableArgName(arg) {
  var nameOutput = arg.name + (true === arg.variadic ? '...' : '');

  return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
}

function exists(file) {
  try {
    if (fs.statSync(file).isFile()) return true;
  } catch (e) {
    return false;
  }
}

function incrementNodeInspectorPort(args) {
  return args.map((arg) => {
    var result = arg;
    if (0 === arg.indexOf('--inspect')) {
      var debugOption, match,
        debugHost = '127.0.0.1',
        debugPort = '9229';
      if (null !== (match = arg.match(/^(--inspect(-brk)?)$/))) debugOption = match[1];
      else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/))) {
        debugOption = match[1];
        /^\d+$/.test(match[3]) ? (debugPort = match[3]) : (debugHost = match[3]);
      } else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/))) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }

      debugOption && '0' !== debugPort && (result = `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`);
    }
    return result;
  });
}
