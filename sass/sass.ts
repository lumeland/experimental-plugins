import { merge } from "lume/core/utils.ts";
import { denosass, SassFormats } from "./deps.ts";

import type { Page, Site } from "lume/core.ts";

export interface Options {
  /** Set `true` to include the style reset */
  extensions: string[];
  format: SassFormats;
}

const defaults: Options = {
  extensions: [".sass", ".scss"],
  format: "compressed",
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    function sass(page: Page) {
      const compiler = denosass(page.content as string);
      const result = compiler.to_string(options.format);

      if (typeof result === "string") {
        page.content = result;
        page.dest.ext = ".css";
      }
    }
  };
}
