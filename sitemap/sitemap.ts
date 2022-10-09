import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import { buildSort } from "lume/plugins/search.ts";

import type { Site, StaticFile } from "lume/core.ts";
import type { Search } from "lume/plugins/search.ts";

export interface Options {
  /** The query to search pages included in the sitemap */
  query?: string | string[];

  /** The values to sort the sitemap */
  sort?: string | string[];

  /**
   * Automatically generate a `robots.txt`, or add the
   * `sitemap.xml` to an existing (works not with static assets)
   */
  enableRobots: boolean;
}

// Default options
export const defaults: Options = {
  query: undefined,
  sort: "url=asc",
  enableRobots: true,
};

/** A plugin to generate a sitemap.xml from page files after build */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("afterRender", () => {
      // Create the sitemap.xml page
      const sitemap = Page.create("sitemap.xml", getSitemapContent(site));

      // Add to the sitemap page to pages
      site.pages.push(sitemap);

      // Check if `robots.txt` is enabled
      if (options.enableRobots) {
        const robots = site.files.some((file: StaticFile) =>
          file.dest === "/robots.txt"
        );

        if (!robots) {
          const robots = site.pages.find((page: Page) =>
            page.data.url === "/robots.txt"
          );

          if (robots) {
            robots.content += `Sitemap: ${site.url("/sitemap.xml", true)}`;
          } else {
            site.pages.push(Page.create(
              "/robots.txt",
              `User-agent: *\nAllow: /\n\nSitemap: ${
                site.url("/sitemap.xml", true)
              }`,
            ));
          }
        }
      }
    });

    function getSitemapContent(site: Site) {
      // Get the search instance from the global data
      const search = site.globalData.search as Search;
      let sitemapPages = search.pages(options.query, options.sort);

      const { page404 } = site.options.server;

      if (page404) {
        sitemapPages = sitemapPages.filter((page: Page) =>
          page.data.url !== page404
        );
      }

      // Sort the pages
      sitemapPages.sort(buildSort(options.sort));

      // deno-fmt-ignore
      const sitemap = `
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapPages.map((page: Page) => {
    const lastmod = page.data.date
      ? `<lastmod>${page.data.date.toISOString()}</lastmod>`
      : "";
    return `<url>
    <loc>${site.url(page.data.url as string, true)}</loc>${lastmod}
  </url>
  `}).join("").trim()}
</urlset>`.trim();

      return `${sitemap}`;
    }
  };
}
