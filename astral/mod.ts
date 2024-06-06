import { merge } from "lume/core/utils/object.ts";
import { launch, Page as Tab } from "jsr:@astral/astral@0.4.2";
import type { Page } from "lume/core/file.ts";

import "lume/types.ts";

export interface Options {
  /** The extensions */
  extensions?: string[];
  callback?: (tab: Tab, page: Page) => void | Promise<void>;
}

export const defaults: Options = {
  extensions: [".html"],
};

export default function (userOptions: Options = {}) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process(options.extensions, async (pages) => {
      const browser = await launch();

      for (const page of pages) {
        const tab = await browser.newPage();
        const html = page.content;
        if (typeof html !== "string") {
          throw new Error("The content of the page must be a string");
        }

        await tab.setContent(html);

        // @ts-ignore _continue is a global variable
        // deno-lint-ignore no-window
        await tab.waitForFunction(() => window._continue === true);

        await tab.evaluate(() => {
          document.querySelectorAll("[astral-delete]").forEach((el) => {
            el.remove();
          });
        });

        if (options.callback) {
          await options.callback(tab, page);
        }

        page.content = await tab.content();
        tab.close();
      }

      await browser.close();
    });
  };
}
