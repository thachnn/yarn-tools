// Type definitions for mkdirp

export declare function mkdirp(path: string, mode?: number | string): Promise<string | undefined>;
export declare function sync(path: string, mode?: number | string): string | undefined;

export default mkdirp;
export { mkdirp as mkdirP };
