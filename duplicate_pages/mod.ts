import { mergeData } from "lume/core/utils/merge_data.ts";
import type Site from "lume/core/site.ts";

import { Data, RawData } from "lume/types.ts";
import { posix } from "lume/deps/path.ts";
import { getBasename, getPageUrl } from "lume/core/utils/page_url.ts";
import { getPageDate } from "lume/core/utils/page_date.ts";

export interface Options<D> {
  /** Function to create duplications. */
  fn: (data: Data<D>) => Generator<RawData>;
}

export function duplicatePages<D = unknown>(options: Options<D>) {
  return (site: Site) => {
    site.preprocess<D>((pages, allPages) => {
      for (const page of pages) {
        let index = 0;
        const basePath = posix.dirname(page.data.url);
        for (const data of options.fn(page.data)) {
          if (data.url === false) {
            continue;
          }

          const newPage = page.duplicate(
            index++,
            mergeData(page.data, data) as Data<D>,
          );
          let base = basePath;

          if (!data.url && data.basename !== undefined) {
            // @ts-ignore: The url is added later
            delete newPage.data.url;
            base = posix.dirname(page.outputPath);
          }

          const url = getPageUrl(newPage, site.options.prettyUrls, base);

          if (!url) {
            continue;
          }

          newPage.data.url = url;
          newPage.data.basename = getBasename(url);
          newPage.data.date = getPageDate(newPage);

          // Prevent running the layout if the page is not HTML
          if (!data.layout && !newPage.isHTML) {
            delete newPage.data.layout;
          }

          allPages.push(newPage);
        }
      }
    });
  };
}

export default duplicatePages;
