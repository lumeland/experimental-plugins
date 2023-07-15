import type { DeepPartial, Site } from "lume/core.ts";
import { merge, read } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";

import { createGenerator, type UserConfig } from "npm:@unocss/core@0.53.5";
import { presetUno } from "npm:@unocss/preset-uno@0.53.5";

export interface Options {
  /**
   * Configurations for UnoCSS.
   * @see {@link https://unocss.dev/guide/config-file}
   */
  config?: UserConfig;
  /**
   * Set the css filename for all generated styles,
   * Set to `false` to insert a <style> tag per page.
   * @defaultValue `false`
   */
  cssFile: false | string;
  /**
   * Supported CSS reset options.
   * @see {@link https://github.com/unocss/unocss/tree/v0.53.5/packages/reset}
   * @defaultValue `tailwind`
   */
  reset: false | "tailwind" | "tailwind-compat" | "eric-meyer";
}

export const defaults: Options = {
  config: {
    presets: [presetUno()],
  },
  cssFile: false,
  reset: "tailwind",
};

export default (userOptions: DeepPartial<Options> = {}) => {
  const options = merge(defaults, userOptions) as Options;

  /**
   * TODO: Replace with CSS Modules Import
   * @remarks Deno does not currently support CSS Modules.
   * @see {@link https://github.com/denoland/deno/issues/11961}
   */
  const prependReset = async (css: string) =>
    options.reset === false ? css : `${await read(
      `https://unpkg.com/@unocss/reset@0.53.5/${options.reset}.css`,
      false,
    )}\n${css}`;

  return (site: Site) => {
    const uno = createGenerator(options.config);

    if (options.cssFile === false) {
      // Insert a <style> tag for each page
      site.process([".html"], async (page) => {
        const css = await uno.generate(
          page.document?.documentElement?.innerHTML ?? "",
        ).then(({ css }) => prependReset(css));

        if (css) {
          const style = page.document!.createElement("style");
          style.innerText = css;
          page.document?.head?.appendChild(style);
        }
      });
    } else {
      // Insert a <link> tag for each page
      site.process([".html"], (page) => {
        const link = page.document!.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", site.url(options.cssFile as string));
        page.document?.head?.appendChild(link);
      });

      // Generate the stylesheets for all pages
      site.addEventListener("afterRender", async () => {
        const pages = site.pages
          .filter((page) => page.outputPath?.endsWith(".html"));

        const fileClassMap = new Map();
        const classes = new Set<string>();

        await Promise.all(
          pages.map(async (page) =>
            fileClassMap.set(
              page.src,
              await uno.generate(
                page.document?.documentElement?.innerHTML ?? "",
              ).then((res) => res.matched),
            )
          ),
        );

        for (const set of fileClassMap.values()) {
          for (const candidate of set) {
            classes.add(candidate);
          }
        }

        // Create & merge stylesheets for all pages
        const css = await uno.generate(classes).then(({ css }) =>
          prependReset(css)
        );

        // output css as a page
        const exists = site.pages.find((page) =>
          page.data.url === options.cssFile
        );

        if (exists) {
          exists.content += `\n${css}`;
        } else {
          site.pages.push(Page.create(options.cssFile as string, css));
        }
      });
    }
  };
};
