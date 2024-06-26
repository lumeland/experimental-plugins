import { merge } from "lume/core/utils/object.ts";
import type Site from "lume/core/site.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

// todo:
// - make file extension configurable
// - make code simpler

export interface Options {
}

export const defaults: Options = {};

/**
 * This plugin check broken links in *.html output files.
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const url_base = site.options.location;
    const urls = new Set<string>(); // Set is more performant than arrays

    site.process("*", (pages) => {
      urls.clear(); // Clear on rebuild
      for (const page of pages) {
        urls.add(new URL(page.data.url, url_base).toString()); // site.url() return the full url if the second argument is true
      }
      for (const file of site.files) {
        urls.add(site.url(file.outputPath, true));
      }
    });

    site.use(modifyUrls({
      fn(url, page, _element) {
        const full_url = new URL(url, url_base);
        if (full_url.origin != url_base.origin) {
          return url;
        }

        if (!urls.has(full_url.toString())) {
          console.warn(`Found broken link: ${page.data.url} -> ${url}`);
        }

        return url;
      },
    }));
  };
}
