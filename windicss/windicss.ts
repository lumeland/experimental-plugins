import { extname } from "lume/deps/path.ts";
import { SitePage } from "lume/core/filesystem.ts";
import { Page, Site } from "lume/core.ts";
import { defineConfig, HTMLParser, Processor, StyleSheet } from "./deps.ts";

/**
 * a lume plugin for windicss, the next generation utility-first css framework
 *
 * classnames from all built pages will be read/extracted
 * and only the necessary css will be generated
 *
 * the output css file must be manually included in your document's
 * head e.g. <link rel="stylesheet" href="/windi.css">
 */
export default function (
  { minify = false, output = "/windi.css", config = defineConfig({}) } = {},
) {
  return (site: Site) => {
    // create & configure a windicss instance
    const processor = new Processor();
    processor.loadConfig(config);

    site.addEventListener("afterRender", () => {
      // create & merge stylesheets for all pages
      const stylesheet = site.pages
        .filter((page) => page.dest.ext === ".html")
        .map((page) =>
          generateStyles(page, processor, config.preflight as boolean)
        )
        .reduce(
          (previous, current) => previous.extend(current, false),
          new StyleSheet(),
        )
        .sort()
        .combine();

      // output css as a page
      const ext = extname(output),
        path = output.slice(0, -ext.length),
        page = new SitePage({ path, ext });
      page.content = stylesheet.build(minify);
      site.pages.push(page);
    });
  };
}

export function generateStyles(
  page: Page,
  processor: Processor,
  preflight: boolean,
) {
  const content = page.content as string,
    classes = new HTMLParser(content)
      .parseClasses()
      .map((i) => i.result)
      .join(" "),
    interpretedSheet = processor.interpret(classes).styleSheet;
  if (!preflight) return interpretedSheet;

  const preflightSheet = processor.preflight(content);
  return interpretedSheet.extend(preflightSheet, false);
}
