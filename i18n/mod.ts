import i18next from "./deps.ts";
import { merge } from "lume/core/utils.ts";

import type { Plugin } from "lume/core.ts";
import type { InitOptions } from "./deps.ts";

export interface Options {
  /** The key name for the transformations definitions */
  key: string;

  /** The name of the filter */
  filter: string;

  /** Default options for i18next library */
  options: InitOptions;
}

export const defaults: Options = {
  key: "i18n",
  filter: "t",
  options: {},
};

export default function i18n(userOptions?: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.data(options.filter, filter);
    site.addEventListener("beforeRender", () => {
      const { key } = options;
      const resources = (site.source.root?.data[key] ?? {}) as Resources;
      const supportedLngs = Object.keys(resources);
      const lng = supportedLngs[0];
      const fallbackLng = lng;

      if (!i18next.isInitialized) {
        return i18next.init({
          resources,
          lng,
          supportedLngs,
          fallbackLng,
          ...options.options,
        });
      }

      for (const [lng, resource] of Object.entries(resources)) {
        for (const [ns, translations] of Object.entries(resource)) {
          i18next.addResourceBundle(lng, ns, translations);
        }
      }
    });

    site.filter(options.filter, (key, options) => filter(key, options));

    // deno-lint-ignore no-explicit-any
    function filter(key: string, options: any) {
      return i18next.t(key, options);
    }
  };
}

interface Resources {
  [lang: string]: Record<string, string>;
}
