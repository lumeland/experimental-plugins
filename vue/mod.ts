import loader from "./loader.ts";
import { ModuleEngine } from "lume/plugins/modules.ts";
import { merge } from "lume/core/utils/object.ts";

import type Site from "lume/core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".vue"],
};

export function vue(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new ModuleEngine(options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    site.loadPages([".vue"], {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default vue;
