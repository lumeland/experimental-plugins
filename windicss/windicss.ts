import { extname } from "lume/deps/path.ts";
import { merge } from "lume/core/utils.ts";
import { SitePage } from "lume/core/filesystem.ts";
import { Page, Site } from "lume/core.ts";
import { HTMLParser, Processor, StyleSheet } from "./deps.ts";

export interface Options {
  /** Set `true` to include the style reset */
  preflight: boolean;

  /** Set `true` to minify the output code */
  minify: boolean;

  /** The output filename with the generated code */
  dest: string;
}

const defaults: Options = {
  preflight: false,
  minify: false,
  dest: "/windi.css",
};

/** A plugin to use windi.css in your website */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Get windi processor
    const processor = new Processor();

    site.addEventListener("afterRender", () => {
      // Extract the styles from all html pages
      const styles = site.pages
        .filter((page) => page.dest.ext === ".html")
        .map((page) => generateStyles(page, processor, options));

      // Generate the final css code
      const outputStyle = styles
        .reduce(
          (previous, current) => previous.extend(current),
          new StyleSheet(),
        )
        .sort()
        .combine();

      // Create a new page with this code
      const ext = extname(options.dest);
      const path = options.dest.slice(0, -ext.length);
      const page = new SitePage({ path, ext });

      page.content = outputStyle.build(options.minify);
      site.pages.push(page);
    });
  };
}

export function generateStyles(
  page: Page,
  processor: Processor,
  options: Options,
) {
  const content = page.content as string;
  const classes = new HTMLParser(content)
    .parseClasses()
    .map((i) => i.result)
    .join("");

  const styles = processor.interpret(classes).styleSheet;

  if (options.preflight) {
    const preflightSheet = processor.preflight(content);
    return styles.extend(preflightSheet);
  }

  return styles;
}
