import { merge } from "lume/core/utils/object.ts";
import type Site from "lume/core/site.ts";

export interface Options {
  command?: string;
  cwd?: string;
  varName?: string;
  branchPrefix?: string;
  shortHash?: boolean;
}

export interface GitInfo {
  branch: string;
  hash: string;
}

export const defaults: Options = {
  command: "git",
  varName: "git",
  branchPrefix: "lumecms/",
  shortHash: true,
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const info: GitInfo = {
      branch: currentBranch(options.command, options.branchPrefix, options.cwd),
      hash: currentHash(options.command, options.shortHash, options.cwd),
    };

    site.data(options.varName, info);
  };
}

const decoder = new TextDecoder();

function currentBranch(cmd: string, prefix?: string, cwd?: string): string {
  const branch = git(cmd, ["branch", "--show-current"], cwd);

  return prefix && branch.startsWith(prefix)
    ? branch.slice(prefix.length)
    : branch;
}

function currentHash(cmd: string, short: boolean, cwd?: string): string {
  return git(cmd, ["rev-parse", short ? "--short" : "--verify", "HEAD"], cwd);
}

function git(cmd: string, args: string[], cwd?: string): string {
  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });

  const result = command.outputSync();

  if (result.code !== 0) {
    throw new Error(` Git error: ${decoder.decode(result.stderr)}`);
  }

  return decoder.decode(result.stdout).trim();
}
