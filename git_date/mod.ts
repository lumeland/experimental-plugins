import { merge } from "lume/core/utils/object.ts";
import { normalizePath } from "lume/core/utils/path.ts";
import { join } from "lume/deps/path.ts";
import type { Extensions } from "lume/core/utils/path.ts";
import type Site from "lume/core/site.ts";

export interface Options {
  extensions?: Extensions;
}

export const defaults: Options = {
  extensions: [".html"],
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  let cache: Map<string, string> | undefined;

  return (site: Site) => {
    site.preprocess(options.extensions, (pages) => {
      if (!cache) {
        cache = getLastModified(site.src());
      }

      for (const page of pages) {
        const date = cache.get(site.src(page.sourcePath));
        if (date !== undefined) {
          page.data.date = new Date(date);
        }
      }
    });
  };
}

/**
 * Thanks to https://meiert.com/blog/eleventy-git-last-modified/
 */
function getLastModified(path: string): Map<string, string> {
  const toplevel = getTopLevel();

  const dates = new Map<string, string>();
  const args = ["log", "--format=DATE:%ci", "--name-only", "--", path];
  const { stdout, success } = new Deno.Command("git", { args }).outputSync();
  if (!success) {
    return dates;
  }
  let currentDate: string | undefined;
  const str = new TextDecoder().decode(stdout);
  for (const line of str.split("\n")) {
    const text = line.trim();

    if (text.startsWith("DATE:")) {
      currentDate = text.slice(5).trim();
    } else if (text && currentDate) {
      const path = normalizePath(join(toplevel, text));
      // First commits, last modification
      if (!dates.has(path)) {
        dates.set(path, currentDate);
      }
    }
  }

  return dates;
}

function getTopLevel(): string {
  const { stdout, success } = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
  }).outputSync();
  if (!success) {
    throw new Error("Git Error");
  }

  return new TextDecoder().decode(stdout).trim();
}
