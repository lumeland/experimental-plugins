import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import { buildFilter, buildSort } from "lume/plugins/search.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  /** The filters to search pages included in the sitemap */
  filters: string[];

  /** The values to sort the sitemap */
  sort: string[];

  /** The default filters including the index page (only if custom `filters` are defined) */
  defaultFilters: string[];

  /** Set `true` append your filters to the defaults (only if custom `filters` are defined) */
  keepDefaultFilters: boolean;
}

// Default options
export const defaults: Options = {
  filters: [],
  sort: ["url=asc"],
  defaultFilters: ["url=/"],
  keepDefaultFilters: true,
};

type SitemapPages = Array<{
  url: string;
  date: string | undefined;
}>;

/** A plugin to generate a sitemap.xml from page files after build */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  // If custom `filters` is defined, concatenate with `defaultFilters` (Index page)
  if (options.keepDefaultFilters && userOptions?.filters?.length) {
    options.filters = defaults.defaultFilters.concat(userOptions.filters);
  }

  return (site: Site) => {
    site.addEventListener("afterRender", () => {
      // Create the sitemap.xml page
      const sitemap = Page.create("sitemap.xml", getSitemapContent(site));

      // Add to the sitemap page to pages
      site.pages.push(sitemap);
    });

    function getSitemapContent(site: Site) {
      const sitemapPages: Page[] = [];

      if (Array.isArray(options.filters) && options?.filters?.length) {
        options.filters.forEach((filter) => {
          site.pages.filter(buildFilter(filter)).map((page: Page) => {
            sitemapPages.push(page);
          });
        });
      } else {
        site.pages.forEach((page: Page) => {
          sitemapPages.push(page);
        });
      }

      sitemapPages.sort(buildSort(options.sort));

      // deno-fmt-ignore
      const sitemap = `
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapPages.map((page) => {
    return `<url>
    <loc>${`${site.options.location.origin}${page.data.url as string}`}</loc>
    <lastmod>${page?.data?.date?.toISOString().slice(0, 10) as string}</lastmod>
  </url>
  `}).join("").trim()}
</urlset>`.trim();

      return `${sitemap}`;
    }
  };
}
