import { extname } from "lume/deps/path.ts";
import { merge } from "lume/core/utils.ts";
import { SitePage } from "lume/core/filesystem.ts";
import { Page, Site } from "lume/core.ts";
import {
  CSSParser,
  Element,
  HTMLDocument,
  HTMLParser,
  Processor,
  StyleSheet,
} from "./deps.ts";

export interface Options {
  minify: boolean;
  mode: "interpret" | "compile";
  output: {
    // ouput mode "file"
    // = a single file will be created with generated styles
    //   from across the entire site
    // output mode "styleTag"
    // = a <style> tag will be inserted into each page
    //   containing only the generated styles for that page
    mode: "file" | "styleTag";
    filename?: string;
  };
  // https://github.com/windicss/windicss/blob/main/src/interfaces.ts#L367
  // https://windicss.org/guide/configuration.html
  config: Record<string, unknown>;
}

const defaults: Options = {
  minify: false,
  mode: "interpret",
  output: {
    mode: "file",
    filename: "windi.css",
  },
  config: {},
};

/**
 * a lume plugin for windicss, the next generation utility-first css framework
 *
 * classnames from all built pages will be read/extracted
 * and only the necessary css will be generated
 *
 * the output css file must be manually included in your document's
 * head e.g. <link rel="stylesheet" href="/windi.css">
 */
export default function (userOptions: Partial<Options> = {}) {
  const options = merge(defaults, userOptions) as Options;

  return (site: Site) => {
    // create & configure a windicss instance
    // (config assignment merges provided with defaults)
    const processor = new Processor();
    options.config = processor.loadConfig(options.config);

    site.addEventListener("afterRender", () => {
      const pages = site.pages
        .filter((page) => page.dest.ext === ".html");

      if (options.output.mode === "file" && options.output.filename) {
        // create & merge stylesheets for all pages
        const stylesheet = pages
          .map((page) => windi(page, processor, options))
          .reduce(
            (previous, current) => previous.extend(current),
            new StyleSheet(),
          )
          .sort()
          .combine();

        // output css as a page
        const ext = extname(options.output.filename),
          path = options.output.filename.slice(0, -ext.length),
          page = new SitePage({ path, ext });
        page.content = stylesheet.build(options.minify);
        site.pages.push(page);
      } else if (options.output.mode === "styleTag") {
        // insert stylesheets directly into pages
        for (const page of pages) {
          const stylesheet = windi(page, processor, options);
          page.content += `<style>${stylesheet.build(options.minify)}</style>`;
        }
      }
    });
  };
}

export function windi(page: Page, processor: Processor, options: Options) {
  const content = page.content as string,
    parser = new HTMLParser(content);

  // update page content with classnames output from windi
  // e.g. to expand variant:(class groups) and to support compile mode
  let stylesheet = new StyleSheet(), html = "", index = 0;
  for (const className of parser.parseClasses()) {
    html += content.substring(index, className.start);
    index = className.end;
    if (options.mode === "interpret") {
      const interpreted = processor.interpret(className.result);
      html += [...interpreted.success, ...interpreted.ignored].join(" ");
      stylesheet = stylesheet.extend(interpreted.styleSheet);
    } else if (options.mode === "compile") {
      const compiled = processor.compile(
        className.result,
        options.config.prefix as string || "windi-",
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
  // will always replace the inline style block with the generated styles
  // https://windicss.org/features/directives.html
  // https://windicss.org/posts/language.html
  // https://windicss.org/integrations/cli.html#style-block
  (page.document as HTMLDocument).querySelectorAll('style[lang="windi"]')
    .forEach((node) => {
      const $style = node as Element,
        translatedSheet = new CSSParser($style.innerText, processor).parse();
      $style.removeAttribute("lang");
      $style.innerText = translatedSheet.build(options.minify);
    });

  if (!options.config.preflight) return stylesheet;
  const preflightSheet = processor.preflight(content);
  return stylesheet.extend(preflightSheet);
}
