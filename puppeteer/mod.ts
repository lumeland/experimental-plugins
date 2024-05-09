import { DeepPartial, merge } from "lume/core/utils/object.ts";
import puppeteer from "npm:puppeteer@22.8.0";
import { Cache } from "npm:@puppeteer/browsers@2.2.3";

import "lume/types.ts";

export interface Options {
  /** The extensions */
  extensions: string[];
  browser: "chrome" | "firefox";
  cacheDirectory: string;
  callback: (page: Lume.Page) => Promise<void>;
}

export const defaults: Options = {
  extensions: [".html"],
  browser: "chrome",
  cacheDirectory: "_cache/puppeteer",
  callback: async (page) => {},
};

export default function (userOptions: DeepPartial<Options> = {}): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process(options.extensions, async (pages) => {
      const cacheDirectory = site.root(options.cacheDirectory);

      // Install the binaries if they are not already installed
      try {
        await Deno.stat(cacheDirectory);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          const command = new Deno.Command(Deno.execPath(), {
            args: ["run", "-A", "npm:puppeteer/install.js"],
            stdout: "inherit",
            env: {
              PUPPETEER_CACHE_DIR: cacheDirectory,
              PUPPETEER_PRODUCT: options.browser,
            },
          });

          await command.output();
        } else {
          throw error;
        }
      }

      const cache = new Cache(cacheDirectory);

      const installedBrowser = cache.getInstalledBrowsers().find((info) => {
        return info.browser === options.browser;
      });

      if (!installedBrowser) {
        throw new Error(`Browser ${options.browser} not installed`);
      }

      const browser = await puppeteer.launch({
        product: options.product,
        headless: "new",
        executablePath: installedBrowser.executablePath,
      });

      for (const page of pages) {
        const tab = await browser.newPage();
        await tab.setContent(page.content);

        await options.callback(tab);
        tab.close();
      }

      await browser.close();
    });
  };
}
