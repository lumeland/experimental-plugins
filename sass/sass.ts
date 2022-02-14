import { merge } from "lume/core/utils.ts";
import { SassFormats, SassOptions, str } from "./deps.ts";
import { dirname } from "lume/deps/path.ts";

import type { Page, Site } from "lume/core.ts";

export interface Options {
  /** Extensions processed by this plugin */
  extensions: string[];

  /** Output format */
  format: SassFormats;

  /** Custom includes paths */
  includes: string | string[];
}

const defaults: Options = {
  extensions: [".sass", ".scss"],
  format: "compressed",
  includes: "_sass",
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const includes = Array.isArray(options.includes)
      ? options.includes.map((path) => site.src(path))
      : [site.src(options.includes)];

    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    function sass(page: Page) {
      const code = page.content as string;
      const filename = site.src(page.src.path + page.src.ext);
      const sassOptions: SassOptions = {
        load_paths: [...includes, dirname(filename)],
        style: options.format,
        quiet: false,
      };

      const result = str(code, sassOptions);

      page.content = result;
      page.dest.ext = ".css";
    }
  };
}
