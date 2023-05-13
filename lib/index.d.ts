// Type definitions for yarn-tools
/// <reference lib="es2015" />

import { LockManifest, LockfileObject } from '../vendor/lockfile';

declare function merge(obj1: LockfileObject, obj2: LockfileObject, loose?: boolean): LockfileObject;
declare namespace merge {
  export function cleanup(obj: LockfileObject): LockfileObject;
}

declare namespace dedupe {
  export interface Options {
    listMagic?: string;
    includePackages?: string[];
    excludePackages?: string[];
    includeScopes?: string[];
    excludeScopes?: string[];
    useMostCommon?: boolean;
    loose?: boolean;
    includePrerelease?: boolean;
  }

  export function fixDuplicates(yarnLock: string, options?: Options): string;
  export function listDuplicates(yarnLock: string, options?: Options): string[];

  interface VersionInfo {
    pkg: LockManifest;
    satisfies: Set<string>;
  }
  export interface PackageInfo {
    name: string;
    requestedVersion: string;
    installedVersion: string;
    versions: Record<string, VersionInfo>;
    satisfiedBy: Set<string>;
    bestVersion: string;
  }

  export function getDuplicates(obj: LockfileObject, options?: Options): PackageInfo[];
}

declare function registry(name: string, version?: string): Promise<registry.Metadata | registry.Manifest>;
declare namespace registry {
  interface DistObject {
    tarball: string;
    shasum: string;
    integrity?: string;
  }
  export interface Manifest {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    dist: DistObject;
  }
  export interface Metadata {
    name: string;
    versions: Record<string, Manifest>;
    time: Record<string, string>;
  }

  export function getCachedMetadata(name: string, version?: string): string | Promise<Metadata | Manifest>;
}

declare function install(
  result: LockfileObject,
  pkgName: string,
  requestedVer: string,
  limitDate: string,
  pkgVersions: Record<string, Record<string, LockManifest>>,
  options?: install.Options
): Promise<string | undefined>;

declare namespace install {
  export interface Options {
    optional?: boolean;
    loose?: boolean;
    prerelease?: boolean;
  }
}
