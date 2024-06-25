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
    site.use(modifyUrls({
      fn(url, page, _element) {
        const url_base = site.options.location;
        const urls: string[] = [];
        for (const page of site.pages) {
          urls.push(new URL(page.data.url, url_base).toString());
        }
        for (const file of site.files) {
          urls.push(new URL(file.outputPath, url_base).toString());
        }
        // console.log(urls)

        const full_url = new URL(url, url_base);
        if (full_url.origin != url_base.origin) {
          return url;
        }

        if (!urls.includes(full_url.toString())) {
          console.warn(`Found broken link: ${page.data.url} -> ${url}`);
        }

        return url;
      },
    }));
  };
}
