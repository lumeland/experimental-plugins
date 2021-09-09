import { merge } from "lume/core/utils.ts";
import { Page, Site } from "lume/core.ts";
import { compile } from "./deps.ts";

export interface Options {
  /** Set `true` to include the style reset */
  extensions: string[];
}

const defaults: Options = {
  extensions: [".sass", ".scss"],
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    function sass(page: Page) {
      page.content = compile(page.content as string);
      page.dest.ext = ".css";
    }
  };
}
