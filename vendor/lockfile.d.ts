// Type definitions for @yarnpkg/lockfile 1.1
// Project: https://github.com/yarnpkg/yarn/tree/master/packages/lockfile
// Definitions by: Eric Wang <https://github.com/fa93hws>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare type ParseResultType = 'success' | 'merge' | 'conflict';

declare interface ParseResult {
  type: ParseResultType;
  object: any;
}

/**
 * Parse the lockfile.
 */
export function parse(str: string, fileLoc?: string): ParseResult;

export function stringify(obj: any, noHeader?: boolean, enableVersions?: boolean): string;

declare interface Dependencies {
  [key: string]: string;
}

export interface LockManifest {
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  registry: RegistryNames;
  uid: string;
  permissions?: { [key: string]: boolean };
  optionalDependencies?: Dependencies;
  dependencies?: Dependencies;
  prebuiltVariants?: { [key: string]: string };
}

export interface LockfileObject {
  [key: string]: LockManifest;
}

//export function implodeEntry(pattern: string, obj: any): MinimalLockManifest;
//export function explodeEntry(pattern: string, obj: any): LockManifest;

declare class Lockfile {
  constructor(opts?: { cache?: any; source?: string; parseResultType?: ParseResultType });

  // source string if the `cache` was parsed
  source: string;
  cache?: LockfileObject;

  parseResultType?: ParseResultType;

  // if true, we're parsing an old yarn file and need to update integrity fields
  hasEntriesExistWithoutIntegrity(): boolean;

  static fromDirectory(dir: string, reporter?: Reporter): Lockfile;

  getLocked(pattern: string): LockManifest | undefined;
  removePattern(pattern: string);

  //getLockfile(patterns: { [packagePattern: string]: Manifest; }): LockfileObject;
}
export default Lockfile;

declare interface Reporter {
  lang(key: string, ...args: any[]): string;

  // a error message has been triggered. this however does not always meant an abrupt program end.
  error(message: string);
  // an info message has been triggered. this provides things like stats and diagnostics.
  info(message: string);
  // a warning message has been triggered.
  warn(message: string);
  // a success message has been triggered.
  success(message: string);
  // a simple log message
  log(message: string, opts?: { force?: boolean });
}
