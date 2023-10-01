import satori, { SatoriOptions } from "npm:satori@0.10.8";
import { svg2png } from "lume/deps/svg2png.ts";
import { DeepPartial, merge, read } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";

import type { PageData, Site } from "lume/core.ts";

export interface Options {
  /** The query to search the pages */
  query?: string;

  /** The JSX template to use for each page */
  template: string | ((data: PageData) => Promise<unknown>);

  /**
   * The options for Satory to generate the SVG image.
   * @see https://github.com/vercel/satori
   */
  satori: SatoriOptions;
}

export const defaults: Options = {
  template: "./template.tsx",
  satori: {
    width: 1200,
    height: 627,
    fonts: [],
  },
};

export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("afterRender", async () => {
      if (!options.satori.fonts.length) {
        options.satori.fonts.push(...await defaultFonts());
      }

      const pages = site.searcher.pages(options.query);
      const template = typeof options.template === "string"
        ? (await import(options.template)).default
        : options.template;

      for (const data of pages) {
        const content = await template(data);
        const svg = await satori(content, options.satori);
        const png = await svg2png(svg);
        const url = data.page!.outputPath!.replace(/\.html$/, ".png");
        const page = Page.create(url, png);
        site.pages.push(page);
        data.metas.image = url;
      }
    });
  };
}

async function defaultFonts(): Promise<SatoriOptions["fonts"]> {
  return [
    {
      name: "inter",
      weight: 400,
      style: "normal",
      data: await read(
        "https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-Regular.woff",
        true,
      ),
    },
    {
      name: "inter",
      weight: 700,
      style: "normal",
      data: await read(
        "https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-SemiBold.woff",
        true,
      ),
    },
  ];
}
