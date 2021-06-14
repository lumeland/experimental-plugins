import { merge } from "lume/utils.js";
import { Page } from "lume/filesystem.js";
import { HTMLParser, Processor, StyleSheet } from "./deps.ts";

const defaults = {
  preflight: false,
  minify: false,
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    // Get windi processor
    const processor = new Processor();

    site.addEventListener("afterRender", () => {
      const styles = site.pages
        .filter((page) => page.dest.ext === ".html")
        .map((page) => generateStyles(page, processor, options));

      const outputStyle = styles
        .reduce(
          (previous, current) => previous.extend(current),
          new StyleSheet(),
        )
        .sort()
        .combine();

      const css = new Page();
      css.content = outputStyle.build(options.minify);
      css.dest = {
        path: "/windi",
        ext: ".css",
      };
      site.pages.push(css);
    });
  };
}

export function generateStyles(page, processor, options) {
  const classes = new HTMLParser(page.content)
    .parseClasses()
    .map((i) => i.result)
    .join("");

  const styles = processor.interpret(classes).styleSheet;

  if (options.preflight) {
    const preflightSheet = processor.preflight(page.content);
    return styles.extend(preflightSheet);
  }

  return styles;
}
