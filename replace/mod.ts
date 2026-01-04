import { merge } from "lume/core/utils/object.ts";
import type { Extensions } from "lume/core/utils/path.ts";

export interface Options {
  extensions?: Extensions;
  replacements: Record<string, string>;
}

export const defaults: Options = {
  extensions: [".html"],
  replacements: {},
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process(options.extensions, (pages) => {
      const entries = Object.entries(options.replacements);

      for (const page of pages) {
        let content = page.text;

        for (const [searchValue, replaceValue] of entries) {
          content = content.replaceAll(searchValue, replaceValue);
        }

        page.text = content;
      }
    });
  };
}
