import { merge } from "lume/core/utils/object.ts";
import type Site from "lume/core/site.ts";
import type { Page } from "lume/core/file.ts";

// todo:
// - share URL scanning logic with modify_urls

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];
}

/** Default options */
export const defaults: Options = {
  extensions: [".html"],
};

/**
 * This plugin checks broken links in *.html output files.
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const url_base = site.options.location;
    const urls = new Set<string>(); // Set is more performant than arrays

    function scan(
      url: string | null,
      page: Page,
      _element: Element,
    ): undefined {
      const full_url = new URL(url, url_base);
      if (full_url.origin != url_base.origin) {
        return;
      }

      if (!urls.has(full_url.toString())) {
        console.warn(`Found broken link: ${page.data.url} -> ${url}`);
      }

      return;
    }

    function scanSrcset(
      attr: string | null,
      page: Page,
      element: Element,
    ): undefined {
      const srcset = attr ? attr.trim().split(",") : [];
      for (const src of srcset) {
        const [, url, _rest] = src.trim().match(/^(\S+)(.*)/)!;
        scan(url, page, element);
      }
    }

    site.process("*", (pages) => {
      urls.clear(); // Clear on rebuild
      for (const page of pages) {
        urls.add(new URL(page.data.url, url_base).toString()); // site.url() return the full url if the second argument is true
      }
      for (const file of site.files) {
        urls.add(site.url(file.outputPath, true));
      }
    });

    site.process(
      options.extensions,
      (pages) =>
        pages.forEach((page: Page) => {
          const { document } = page;

          if (!document) {
            return;
          }

          for (const element of document.querySelectorAll("[href]")) {
            scan(element.getAttribute("href"), page, element);
          }

          for (const element of document.querySelectorAll("[src]")) {
            scan(element.getAttribute("src"), page, element);
          }

          for (const element of document.querySelectorAll("video[poster]")) {
            scan(element.getAttribute("poster"), page, element);
          }

          for (const element of document.querySelectorAll("[srcset]")) {
            scanSrcset(
              element.getAttribute("srcset"),
              page,
              element,
            );
          }

          for (const element of document.querySelectorAll("[imagesrcset]")) {
            scanSrcset(
              element.getAttribute("imagesrcset"),
              page,
              element,
            );
          }
        }),
    );
  };
}
