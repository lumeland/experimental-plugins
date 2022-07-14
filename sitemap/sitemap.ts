import { merge } from "lume/core/utils.ts";
import textLoader from "lume/core/loaders/text.ts";

import type { Page, Site } from "lume/core.ts";

export interface Options {
  /** The public URL. By default detected automatically. */
  location?: URL;

  /** The list of extensions this plugin applies to */
  extensions: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
};

type SitemapPages = Array<{
  url: string;
  date: string | undefined;
  location: string | undefined;
}>;

/** A plugin to generate a sitemap.xml from html files after build */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Do not run the plugin in dev mode
    if (site.options.dev) {
      return;
    }

    options.location = (options.location instanceof URL)
      ? options.location
      : new URL(
        options.location || site.options.location.href || "http://localhost",
      );

    site.loadPages(options.extensions, textLoader);
    site.process(options.extensions, collectSitemap);

    site.addEventListener("afterBuild", saveSitemap);

    const sitemapPages: SitemapPages = [];

     /** Collect the generated .html files */
    function collectSitemap(page: Page) {
      // Ignore the 404 error page
      if (page.dest.path.includes("404")) {
        return;
      }

      sitemapPages.push({
        url: page.data.url as string,
        date: page.data.date?.toISOString().slice(0, 10),
        location: options.location?.origin,
      });
    }

    /** Build and save the sitemap.xml file to destination */
    async function saveSitemap() {
      // Sort pages alphabetically
      sitemapPages.sort(function (a, b) {
        return a.url.localeCompare(b.url);
      });

      // deno-fmt-ignore
      const sitemap = `
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapPages.map((page) => {
    return `<url>
    <loc>${`${page.location}${page.url}`}</loc>
    <lastmod>${page.date}</lastmod>
  </url>
  `}).join("").trim()}
</urlset>`.trim();

      // alternatively. but I like the first.
      /* let sitemap = `<?xml version="1.0" encoding="utf-8"?>\r\n`;
      sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\r\n`;
      sitemapPages.map((page) => {
        sitemap += `  <url>\r\n`
        sitemap += `    <loc>${`${page.site_url}${page.page_url}`}</loc>\r\n`
        sitemap += `    <lastmod>${page.page_date}</lastmod>\r\n`
        sitemap += `  </url>\r\n`;
      })
      sitemap += `</urlset>` */

      await Deno.writeTextFile(site.dest("sitemap.xml"), sitemap);
    }
  };
}
