import { DeepPartial, merge } from "lume/core/utils.ts";
import puppeteer from "npm:puppeteer@21.0.3";
import { Cache } from "npm:@puppeteer/browsers@1.6.0";

import type { Plugin, Site } from "lume/core.ts";

export interface Options {
  /** The extensions */
  extensions: string[];
  browser: "chrome" | "firefox";
  cacheDirectory: string;
  callback: (page) => Promise<void>;
}

export const defaults: Options = {
  extensions: [".html"],
  browser: "chrome",
  cacheDirectory: "./_bin/puppeteer",
};

export default function (userOptions: DeepPartial<Options> = {}): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.processAll(options.extensions, async (pages) => {
      const cacheDirectory = site.src(options.cacheDirectory);

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
