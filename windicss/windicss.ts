import { extname } from "lume/deps/path.ts";
import { SitePage } from "lume/core/filesystem.ts";
import { Page, Site } from "lume/core.ts";
import { CSSParser, HTMLParser, Processor, StyleSheet } from "./deps.ts";

type Mode = "interpret" | "compile";
export interface Options {
  minify?: boolean;
  mode?: Mode;
  output?: string;
  // https://github.com/windicss/windicss/blob/main/src/interfaces.ts#L367
  // https://windicss.org/guide/configuration.html
  config?: Record<string, unknown>;
}

/**
 * a lume plugin for windicss, the next generation utility-first css framework
 *
 * classnames from all built pages will be read/extracted
 * and only the necessary css will be generated
 *
 * the output css file must be manually included in your document's
 * head e.g. <link rel="stylesheet" href="/windi.css">
 */
export default function ({
  minify = false,
  mode = "interpret",
  output = "/windi.css",
  config = {},
}: Options = {}) {
  return (site: Site) => {
    // create & configure a windicss instance
    // (config assignment merges provided with defaults)
    const processor = new Processor();
    config = processor.loadConfig(config);

    site.addEventListener("afterRender", () => {
      // create & merge stylesheets for all pages
      const stylesheet = site.pages
        .filter((page) => page.dest.ext === ".html")
        .map((page) => windi(page, processor, mode, config))
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

export function windi(
  page: Page,
  processor: Processor,
  mode: Mode,
  config: Record<string, unknown>,
) {
  const content = page.content as string,
    parser = new HTMLParser(content);

  // update page content with classnames output from windi
  // e.g. to expand variant:(class groups) and to support compile mode
  let stylesheet = new StyleSheet(), html = "", index = 0;
  for (const className of parser.parseClasses()) {
    html += content.substring(index, className.start);
    index = className.end;
    if (mode === "interpret") {
      const interpreted = processor.interpret(className.result);
      html += [...interpreted.success, ...interpreted.ignored].join(" ");
      stylesheet = stylesheet.extend(interpreted.styleSheet);
    } else if (mode === "compile") {
      const compiled = processor.compile(
        className.result,
        config.prefix as string,
      );
      html += [compiled.className, ...compiled.ignored].join(" ");
      stylesheet = stylesheet.extend(compiled.styleSheet);
    }
  }
  page.content = html + content.substring(index);

  // attributify: https://windicss.org/features/attributify.html
  // reduceRight taken from https://github.com/windicss/windicss/blob/main/src/cli/index.ts
  const attrs: { [key: string]: string | string[] } = parser
    .parseAttrs()
    .reduceRight((a: { [key: string]: string | string[] }, b) => {
      if (b.key === "class" || b.key === "className") return a;
      if (b.key in a) {
        a[b.key] = Array.isArray(a[b.key])
          ? Array.isArray(b.value)
            ? [...(a[b.key] as string[]), ...b.value]
            : [...(a[b.key] as string[]), b.value]
          : [
            a[b.key] as string,
            ...(Array.isArray(b.value) ? b.value : [b.value]),
          ];
        return a;
      }
      return Object.assign(a, { [b.key]: b.value });
    }, {});
  const attributified = processor.attributify(attrs);
  stylesheet = stylesheet.extend(attributified.styleSheet);

  // style blocks: use @apply etc. in a style tag
  // https://windicss.org/features/directives.html
  // https://windicss.org/posts/language.html
  // https://windicss.org/integrations/cli.html#style-block
  const block = content.match(
    /(?<=<style lang=['"]windi["']>)[\s\S]*(?=<\/style>)/,
  );
  if (block && block.index) {
    const css = content.slice(block.index, block.index + block[0].length),
      styleBlock = new CSSParser(css, processor);
    stylesheet = stylesheet.extend(styleBlock.parse());
  }

  if (!config.preflight) return stylesheet;
  const preflightSheet = processor.preflight(content);
  return stylesheet.extend(preflightSheet);
}
