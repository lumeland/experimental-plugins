import type { Page, Site } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";

import { addCssLink2Head, getTwBinFullPath } from "./deps.ts";

export interface Options {
  version: string;
  dir: string;
}

// Default options
export const defaults: Options = {
  version: "3.1.8",
  dir: "./_bin",
};

export default function tailwindcss(userOptions?: Partial<Options>) {
  const { version, dir } = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], (page: Page) => addCssLink2Head(page));

    site.addEventListener("afterBuild", async () => {
      const tailwindBin = await getTwBinFullPath(version, dir);
      const process = Deno.run({
        cmd: [
          tailwindBin,
          "-i",
          "./_site/css/main.css",
          "-o",
          "./_site/css/main.css",
        ],
      });
      await process.status();
      process.close();
    });
  };
}
