import tailwind, { Config } from "npm:@lumeland/tailwindcss@3.2.5";
import { merge } from "lume/core/utils.ts";
import { postcss } from "lume/deps/postcss.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  extensions: string[];
  options: Omit<Config, "content">;
}

export const defaults: Options = {
  extensions: [".html"],
  options: {},
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    let content: PageContent[];

    site.loadAssets([".css"]);

    site.processAll([".html"], (pages) => {
      content = pages.map((page) => {
        return { raw: page.content as string };
      });
    });

    site.process([".css"], async (page) => {
      const tw = tailwind({
        content,
        ...options.options,
      });
      page.content = await postcss([tw]).process(page.content, {
        from: undefined,
      });
    });
  };
}

interface PageContent {
  raw: string;
}
